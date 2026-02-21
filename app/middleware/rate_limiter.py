"""
Rate Limiter - защита от DDoS атак
Ограничивает количество запросов с одного IP адреса
"""

from flask import request
from datetime import datetime, timedelta
from functools import wraps
import json
from app import db
from app.models.ip_ban import IPBan
import redis
import logging

logger = logging.getLogger(__name__)

# Инициализируем Redis для кеширования
try:
    redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
    redis_client.ping()
    REDIS_AVAILABLE = True
except:
    redis_client = None
    REDIS_AVAILABLE = False
    logger.warning("Redis недоступен - rate limiting будет работать с меньшей производительностью")


class RateLimitConfig:
    """Конфигурация rate limiting"""
    
    # Основные лимиты (запросов в минуту)
    GLOBAL_LIMIT = 60                    # Общий лимит для всех
    AUTH_LIMIT = 5                       # Лимит для аутентификации (попытки входа)
    POST_LIMIT = 10                      # Лимит для создания постов
    COMMENT_LIMIT = 20                   # Лимит для комментариев
    SEARCH_LIMIT = 30                    # Лимит для поиска
    API_LIMIT = 50                       # Лимит для API запросов
    
    # Временные окна (в минутах)
    WINDOW_SIZE = 1                      # Размер временного окна
    BAN_DURATION = 60                    # Блокировка на N минут
    TEMP_BAN_DURATION = 15               # Временная блокировка на N минут
    
    # Пороги для блокировки
    ATTEMPTS_BEFORE_BAN = 100            # Заблокировать после N попыток в окне
    SUSPICIOUS_PATTERN_THRESHOLD = 150   # Пороговое значение для подозрительного паттерна


class RateLimiter:
    """Основной класс для rate limiting"""
    
    @staticmethod
    def get_client_ip():
        """Получить IP адрес клиента"""
        if request.environ.get('HTTP_CF_CONNECTING_IP'):
            return request.environ.get('HTTP_CF_CONNECTING_IP')
        
        if request.environ.get('HTTP_X_FORWARDED_FOR'):
            return request.environ.get('HTTP_X_FORWARDED_FOR').split(',')[0].strip()
        
        return request.remote_addr
    
    @staticmethod
    def is_ip_banned(ip: str) -> bool:
        """Проверить если IP заблокирован"""
        ban = IPBan.query.filter_by(ip_address=ip).first()
        
        if not ban:
            return False
        
        if ban.is_temporary and ban.ban_until and ban.ban_until < datetime.utcnow():
            # Временная блокировка истекла
            db.session.delete(ban)
            db.session.commit()
            return False
        
        return ban.is_active
    
    @staticmethod
    def ban_ip(ip: str, reason: str, duration_minutes: int = None, is_temporary: bool = True):
        """Заблокировать IP адрес"""
        existing = IPBan.query.filter_by(ip_address=ip).first()
        
        ban_until = datetime.utcnow() + timedelta(minutes=duration_minutes or RateLimitConfig.BAN_DURATION)
        
        if existing:
            existing.reason = reason
            existing.ban_until = ban_until
            existing.is_temporary = is_temporary
            existing.updated_at = datetime.utcnow()
        else:
            import uuid
            ban = IPBan(
                id=str(uuid.uuid4()),
                ip_address=ip,
                reason=reason,
                is_temporary=is_temporary,
                ban_until=ban_until
            )
            db.session.add(ban)
        
        db.session.commit()
        logger.warning(f"🚫 IP {ip} заблокирован: {reason}")
    
    @staticmethod
    def check_rate_limit(endpoint: str, limit: int = None) -> tuple[bool, int, int]:
        """
        Проверить rate limit
        Returns: (is_allowed, current_count, limit)
        """
        ip = RateLimiter.get_client_ip()
        
        # Проверяем если IP заблокирован
        if RateLimiter.is_ip_banned(ip):
            logger.warning(f"⚠️ Заблокированный IP {ip} попытался отправить запрос")
            return False, 0, 0
        
        limit = limit or RateLimitConfig.GLOBAL_LIMIT
        window_key = f"rate_limit:{ip}:{endpoint}:{datetime.utcnow().strftime('%Y-%m-%d %H:%M')}"
        
        if REDIS_AVAILABLE:
            # Используем Redis для высокопроизводительности
            current_count = redis_client.incr(window_key)
            if current_count == 1:
                redis_client.expire(window_key, 60)  # Истекает через 60 секунд
        else:
            # Fallback на обычное хранилище
            current_count = RateLimiter._get_count_from_db(window_key) + 1
            RateLimiter._set_count_in_db(window_key, current_count)
        
        if current_count > RateLimitConfig.ATTEMPTS_BEFORE_BAN:
            # Слишком много попыток - заблокировать IP
            RateLimiter.ban_ip(
                ip,
                f"Превышен лимит запросов на endpoint {endpoint}",
                RateLimitConfig.TEMP_BAN_DURATION,
                is_temporary=True
            )
            return False, current_count, limit
        
        return current_count <= limit, current_count, limit
    
    @staticmethod
    def _get_count_from_db(key: str) -> int:
        """Получить счетчик из БД (fallback)"""
        from app.models.security_models import RateLimitCounter
        
        counter = RateLimitCounter.query.filter_by(key=key).first()
        return counter.count if counter else 0
    
    @staticmethod
    def _set_count_in_db(key: str, count: int):
        """Установить счетчик в БД (fallback)"""
        from app.models.security_models import RateLimitCounter
        import uuid
        
        counter = RateLimitCounter.query.filter_by(key=key).first()
        if counter:
            counter.count = count
        else:
            counter = RateLimitCounter(
                id=str(uuid.uuid4()),
                key=key,
                count=count
            )
            db.session.add(counter)
        db.session.commit()


def rate_limit(endpoint: str = None, limit: int = None):
    """Декоратор для rate limiting"""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            endpoint_name = endpoint or f.__name__
            limit_value = limit or RateLimitConfig.GLOBAL_LIMIT
            
            is_allowed, current_count, limit_max = RateLimiter.check_rate_limit(endpoint_name, limit_value)
            
            if not is_allowed:
                return {
                    'error': 'Rate limit exceeded. Too many requests.',
                    'current': current_count,
                    'limit': limit_max
                }, 429
            
            # Добавляем информацию о rate limit в ответ
            from flask import make_response
            response = make_response(f(*args, **kwargs))
            response.headers['X-RateLimit-Limit'] = str(limit_max)
            response.headers['X-RateLimit-Remaining'] = str(max(0, limit_max - current_count))
            response.headers['X-RateLimit-Reset'] = str(int((datetime.utcnow() + timedelta(minutes=1)).timestamp()))
            
            return response
        
        return decorated
    return decorator
