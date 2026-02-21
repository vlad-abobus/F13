"""
Security Manager - управление безопасностью аккаунтов
Включает 2FA, session management, IP whitelist, device tracking
"""

import uuid
import logging
from datetime import datetime, timedelta
from app import db
from app.models.user import User
from functools import wraps
from flask import request
import secrets
import hashlib
import json

logger = logging.getLogger(__name__)


class SecurityConfig:
    """Конфигурация безопасности"""
    
    # Session management
    SESSION_TIMEOUT = 24  # часов
    MAX_SESSIONS_PER_USER = 5
    REQUIRE_RE_AUTH_AFTER = 12  # часов
    
    # 2FA
    TWO_FA_ENABLED = True
    TWO_FA_TIMEOUT = 5  # минут для OTP ввода
    
    # IP Whitelist
    ENFORCE_IP_WHITELIST = False
    MAX_IP_ADDRESSES = 10
    
    # Suspicious activity
    MAX_FAILED_LOGINS = 5
    LOCKOUT_DURATION = 30  # минут
    SUSPICIOUS_THRESHOLD = 5  # событий за час


class SessionManager:
    """Управление сессиями пользователя"""
    
    @staticmethod
    def create_session(user_id: str, ip_address: str, user_agent: str) -> dict:
        """Создать новую сессию"""
        from app.models.security_models import UserSession
        
        # Удалить старые сессии если слишком много
        old_sessions = UserSession.query.filter_by(user_id=user_id).order_by(
            UserSession.created_at.desc()
        ).offset(SecurityConfig.MAX_SESSIONS_PER_USER).all()
        
        for session in old_sessions:
            db.session.delete(session)
        
        session_token = secrets.token_urlsafe(32)
        session_hash = hashlib.sha256(session_token.encode()).hexdigest()
        
        new_session = UserSession(
            id=str(uuid.uuid4()),
            user_id=user_id,
            session_token_hash=session_hash,
            ip_address=ip_address,
            user_agent=user_agent,
            last_activity=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(hours=SecurityConfig.SESSION_TIMEOUT)
        )
        
        db.session.add(new_session)
        db.session.commit()
        
        logger.info(f"✓ Новая сессия для пользователя {user_id} от IP {ip_address}")
        
        return {
            'session_id': new_session.id,
            'session_token': session_token,
            'expires_at': new_session.expires_at.isoformat()
        }
    
    @staticmethod
    def validate_session(session_token: str) -> tuple[bool, str]:
        """Валидировать сессию"""
        from app.models.security_models import UserSession
        
        if not session_token:
            return False, "No session token"
        
        session_hash = hashlib.sha256(session_token.encode()).hexdigest()
        session = UserSession.query.filter_by(session_token_hash=session_hash).first()
        
        if not session:
            return False, "Invalid session token"
        
        if session.expires_at < datetime.utcnow():
            db.session.delete(session)
            db.session.commit()
            return False, "Session expired"
        
        # Обновить последнее время активности
        session.last_activity = datetime.utcnow()
        db.session.commit()
        
        return True, session.user_id
    
    @staticmethod
    def terminate_session(user_id: str, session_id: str = None):
        """Завершить сессию"""
        from app.models.security_models import UserSession
        
        if session_id:
            session = UserSession.query.get(session_id)
            if session and session.user_id == user_id:
                db.session.delete(session)
        else:
            # Завершить все сессии пользователя
            UserSession.query.filter_by(user_id=user_id).delete()
        
        db.session.commit()
        logger.info(f"✓ Сессия завершена для пользователя {user_id}")
    
    @staticmethod
    def get_active_sessions(user_id: str) -> list:
        """Получить активные сессии пользователя"""
        from app.models.security_models import UserSession
        
        sessions = UserSession.query.filter_by(user_id=user_id).all()
        
        active_sessions = []
        for session in sessions:
            if session.expires_at > datetime.utcnow():
                active_sessions.append({
                    'id': session.id,
                    'ip_address': session.ip_address,
                    'user_agent': session.user_agent[:50] + '...' if len(session.user_agent) > 50 else session.user_agent,
                    'last_activity': session.last_activity.isoformat(),
                    'created_at': session.created_at.isoformat()
                })
        
        return active_sessions


class TwoFactorAuth:
    """Двухфакторная аутентификация"""
    
    @staticmethod
    def generate_otp() -> str:
        """Генерировать OTP код"""
        import random
        return ''.join([str(random.randint(0, 9)) for _ in range(6)])
    
    @staticmethod
    def send_otp(user_id: str, method: str = 'email') -> bool:
        """Отправить OTP"""
        from app.models.security_models import TwoFactorCode
        
        user = User.query.get(user_id)
        if not user:
            return False
        
        # Удалить старые коды
        TwoFactorCode.query.filter_by(user_id=user_id).delete()
        
        otp_code = TwoFactorAuth.generate_otp()
        otp_hash = hashlib.sha256(otp_code.encode()).hexdigest()
        
        two_fa = TwoFactorCode(
            id=str(uuid.uuid4()),
            user_id=user_id,
            code_hash=otp_hash,
            method=method,
            attempts=0,
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(minutes=SecurityConfig.TWO_FA_TIMEOUT)
        )
        
        db.session.add(two_fa)
        db.session.commit()
        
        # Отправляем OTP (здесь должна быть реальная отправка)
        logger.info(f"📱 OTP отправлен пользователю {user_id} методом {method}: {otp_code}")
        
        return True
    
    @staticmethod
    def verify_otp(user_id: str, otp_code: str) -> bool:
        """Верифицировать OTP"""
        from app.models.security_models import TwoFactorCode
        
        otp_hash = hashlib.sha256(otp_code.encode()).hexdigest()
        two_fa = TwoFactorCode.query.filter_by(user_id=user_id, code_hash=otp_hash).first()
        
        if not two_fa:
            return False
        
        if two_fa.expires_at < datetime.utcnow():
            db.session.delete(two_fa)
            db.session.commit()
            return False
        
        if two_fa.attempts >= 3:
            db.session.delete(two_fa)
            db.session.commit()
            logger.warning(f"⚠️ Слишком много неправильных попыток OTP для {user_id}")
            return False
        
        db.session.delete(two_fa)
        db.session.commit()
        
        logger.info(f"✓ OTP верифицирован для пользователя {user_id}")
        return True


class IPWhitelist:
    """Управление белым списком IP адресов"""
    
    @staticmethod
    def add_ip(user_id: str, ip_address: str, device_name: str = None) -> bool:
        """Добавить IP в белый список"""
        from app.models.security_models import TrustedDevice
        
        # Проверить лимит
        count = TrustedDevice.query.filter_by(user_id=user_id).count()
        if count >= SecurityConfig.MAX_IP_ADDRESSES:
            return False
        
        device = TrustedDevice(
            id=str(uuid.uuid4()),
            user_id=user_id,
            ip_address=ip_address,
            device_name=device_name or f'Device {count + 1}',
            is_active=True,
            created_at=datetime.utcnow()
        )
        
        db.session.add(device)
        db.session.commit()
        
        logger.info(f"✓ IP {ip_address} добавлен в белый список для {user_id}")
        return True
    
    @staticmethod
    def is_ip_trusted(user_id: str, ip_address: str) -> bool:
        """Проверить если IP в белом списке"""
        if not SecurityConfig.ENFORCE_IP_WHITELIST:
            return True
        
        from app.models.security_models import TrustedDevice
        
        device = TrustedDevice.query.filter_by(
            user_id=user_id,
            ip_address=ip_address,
            is_active=True
        ).first()
        
        return device is not None
    
    @staticmethod
    def get_trusted_devices(user_id: str) -> list:
        """Получить доверенные устройства"""
        from app.models.security_models import TrustedDevice
        
        devices = TrustedDevice.query.filter_by(user_id=user_id, is_active=True).all()
        
        return [{
            'id': device.id,
            'ip_address': device.ip_address,
            'device_name': device.device_name,
            'created_at': device.created_at.isoformat()
        } for device in devices]


class SuspiciousActivityTracker:
    """Отслеживание подозрительной активности"""
    
    @staticmethod
    def log_failed_login(username: str):
        """Логировать неудачную попытку входа"""
        from app.models.security_models import SecurityLog
        
        user = User.query.filter_by(username=username).first()
        
        log = SecurityLog(
            id=str(uuid.uuid4()),
            user_id=user.id if user else None,
            event_type='failed_login',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent', '')[:255],
            description=f'Failed login attempt for {username}',
            created_at=datetime.utcnow()
        )
        
        db.session.add(log)
        db.session.commit()
        
        # Проверить количество неудачных попыток
        failed_attempts = SecurityLog.query.filter(
            SecurityLog.event_type == 'failed_login',
            SecurityLog.user_id == (user.id if user else None),
            SecurityLog.created_at >= datetime.utcnow() - timedelta(hours=1)
        ).count()
        
        if failed_attempts >= SecurityConfig.MAX_FAILED_LOGINS and user:
            user.is_banned = True
            user.ban_until = datetime.utcnow() + timedelta(minutes=SecurityConfig.LOCKOUT_DURATION)
            db.session.commit()
            logger.warning(f"🔒 Пользователь {username} заблокирован за слишком много неудачных попыток")
    
    @staticmethod
    def log_security_event(user_id: str, event_type: str, description: str = None):
        """Логировать событие безопасности"""
        from app.models.security_models import SecurityLog
        
        log = SecurityLog(
            id=str(uuid.uuid4()),
            user_id=user_id,
            event_type=event_type,
            ip_address=request.remote_addr if request else None,
            user_agent=request.headers.get('User-Agent', '')[:255] if request else None,
            description=description,
            created_at=datetime.utcnow()
        )
        
        db.session.add(log)
        db.session.commit()
        
        logger.info(f"📊 Security event: {event_type} for {user_id}")


def require_2fa(f):
    """Декоратор для требования 2FA"""
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id = getattr(request, 'current_user', {}).id if hasattr(request, 'current_user') else None
        
        if not user_id:
            return {'error': 'Not authenticated'}, 401
        
        user = User.query.get(user_id)
        if user and user.two_fa_enabled and user.two_fa_method:
            # Проверить если уже верифицирован
            if not getattr(request, 'two_fa_verified', False):
                return {'error': '2FA required', 'need_2fa': True}, 403
        
        return f(*args, **kwargs)
    
    return decorated


def require_session(f):
    """Декоратор для проверки активной сессии"""
    @wraps(f)
    def decorated(*args, **kwargs):
        session_token = request.headers.get('X-Session-Token')
        
        if not session_token:
            return {'error': 'Session token required'}, 401
        
        is_valid, user_id = SessionManager.validate_session(session_token)
        
        if not is_valid:
            return {'error': 'Invalid or expired session'}, 401
        
        request.current_user_id = user_id
        return f(*args, **kwargs)
    
    return decorated
