"""
Bot Detection - детектирование ботов и автоматизированных инструментов
"""

from flask import request
from user_agents import parse
import logging
import re
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class BotSignature:
    """Сигнатуры известных ботов"""
    
    BOT_USER_AGENTS = [
        r'bot', r'crawler', r'spider', r'scraper', r'curl', r'wget',
        r'selenium', r'phantomjs', r'headless', r'puppeteer',
        r'requests', r'httplib', r'urllib', r'python',
        r'ruby', r'java', r'golang', r'node', r'javascript',
        r'postman', r'insomnia', r'swagger',
        r'googlebot', r'bingbot', r'yandexbot', r'baidubot',
        r'applebot', r'facebookexternalhit', r'twitterbot',
        r'linkedinbot', r'slurp', r'msnbot'
    ]
    
    SUSPICIOUS_HEADERS = [
        'x-forwarded-for-original', 'x-real-ip-original',
        'x-forwarded-host-original', 'x-forwarded-proto-original'
    ]


class BotDetector:
    """Класс для детектирования ботов"""
    
    @staticmethod
    def get_user_agent() -> str:
        """Получить User-Agent браузера"""
        return request.headers.get('User-Agent', 'Unknown')
    
    @staticmethod
    def is_suspicious_user_agent() -> bool:
        """Проверить если User-Agent подозрителен"""
        user_agent = BotDetector.get_user_agent().lower()
        
        for pattern in BotSignature.BOT_USER_AGENTS:
            if re.search(pattern, user_agent, re.IGNORECASE):
                logger.warning(f"🤖 Подозрительный User-Agent: {user_agent}")
                return True
        
        return False
    
    @staticmethod
    def is_real_browser() -> bool:
        """Проверить если это реальный браузер"""
        user_agent = BotDetector.get_user_agent()
        
        try:
            ua = parse(user_agent)
            
            # Реальные браузеры имеют тип 'browser'
            if ua.is_bot:
                return False
            
            # Должна быть операционная система
            if not ua.os.family or ua.os.family == 'Other':
                return False
            
            # Должен быть браузер
            if not ua.browser.family or ua.browser.family == 'Other':
                return False
            
            return True
        except Exception as e:
            logger.error(f"Ошибка парсинга User-Agent: {e}")
            return True  # Даем пользователю второй шанс
    
    @staticmethod
    def has_suspicious_headers() -> bool:
        """Проверить если есть подозрительные заголовки"""
        for header in BotSignature.SUSPICIOUS_HEADERS:
            if request.headers.get(header):
                logger.warning(f"⚠️ Подозрительный заголовок: {header}")
                return True
        
        return False
    
    @staticmethod
    def check_request_pattern() -> dict:
        """Проверить паттерн запроса на признаки бота"""
        checks = {
            'is_bot': False,
            'reasons': [],
            'score': 0
        }
        
        # Проверка 1: User-Agent
        if not BotDetector.is_real_browser():
            checks['score'] += 30
            checks['reasons'].append('Not a real browser')
            checks['is_bot'] = True
        
        # Проверка 2: Отсутствие Accept-Language
        if not request.headers.get('Accept-Language'):
            checks['score'] += 20
            checks['reasons'].append('Missing Accept-Language')
        
        # Проверка 3: Отсутствие Referer
        if not request.headers.get('Referer') and request.method not in ['OPTIONS', 'HEAD']:
            checks['score'] += 15
            checks['reasons'].append('Missing Referer')
        
        # Проверка 4: Подозрительные заголовки
        if BotDetector.has_suspicious_headers():
            checks['score'] += 25
            checks['reasons'].append('Suspicious headers detected')
            checks['is_bot'] = True
        
        # Проверка 5: Отсутствие Accept заголовка
        if not request.headers.get('Accept'):
            checks['score'] += 10
            checks['reasons'].append('Missing Accept header')
        
        # Проверка 6: Очень высокая или низкая скорость запросов
        # (это проверяется отдельно в rate limiter)
        
        return checks
    
    @staticmethod
    def require_captcha() -> bool:
        """Нужна ли CAPTCHA для этого запроса?"""
        checks = BotDetector.check_request_pattern()
        
        # Требуем CAPTCHA если score > 50 или явный признак бота
        return checks['is_bot'] or checks['score'] > 50
    
    @staticmethod
    def log_suspicious_activity(endpoint: str, reason: str):
        """Логировать подозрительную активность"""
        ip = request.remote_addr
        user_agent = BotDetector.get_user_agent()
        
        logger.warning({
            'event': 'suspicious_bot_activity',
            'ip': ip,
            'endpoint': endpoint,
            'reason': reason,
            'user_agent': user_agent,
            'timestamp': datetime.utcnow().isoformat()
        })


def detect_bot(f):
    """Декоратор для детектирования ботов"""
    from functools import wraps
    import os
    
    @wraps(f)
    def decorated(*args, **kwargs):
        # Skip bot detection for auth routes in development
        if os.getenv('FLASK_ENV') != 'production':
            return f(*args, **kwargs)
        
        checks = BotDetector.check_request_pattern()
        
        if checks['is_bot']:
            logger.warning(f"🤖 Обнаружен бот на {request.endpoint}: {checks['reasons']}")
            BotDetector.log_suspicious_activity(request.endpoint, ', '.join(checks['reasons']))
            
            # Требуем CAPTCHA или блокируем
            return {
                'error': 'Bot detected. Please complete CAPTCHA.',
                'captcha_required': True,
                'score': checks['score']
            }, 403
        
        return f(*args, **kwargs)
    
    return decorated
