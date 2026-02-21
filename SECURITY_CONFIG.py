"""
Security Configuration and Requirements
"""

# requirements.txt должен содержать эти пакеты:
SECURITY_REQUIREMENTS = [
    'redis>=4.3.0',              # Для rate limiting
    'user-agents>=2.2.0',        # Для bot detection
    'PyJWT>=2.6.0',              # Для JWT токенов
    'Werkzeug>=2.2.0',           # Для secure password hashing
    'cryptography>=38.0.0',      # Для криптографии
    'python-dotenv>=0.21.0',     # Для переменных окружения
]

# Environment variables нужны в .env:
REQUIRED_ENV_VARS = {
    'SECRET_KEY': 'Секретный ключ для Flask',
    'JWT_SECRET_KEY': 'Секретный ключ для JWT токенов',
    'REDIS_URL': 'URL для подключения к Redis (например redis://localhost:6379)',
    'DATABASE_URL': 'URL для подключения к базе данных',
    'MAIL_SERVER': 'SMTP сервер для отправки писем',
    'MAIL_PORT': 'Порт SMTP сервера',
    'MAIL_USERNAME': 'Пользователь SMTP',
    'MAIL_PASSWORD': 'Пароль SMTP',
}

# Рекомендуемые настройки безопасности для production:
SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
}

# Пороги безопасности:
SECURITY_THRESHOLDS = {
    'RATE_LIMIT_GLOBAL': 60,              # Запросов в минуту
    'RATE_LIMIT_AUTH': 5,                 # Попыток входа
    'RATE_LIMIT_POST': 10,                # Постов в минуту
    'MAX_FAILED_LOGINS': 5,               # Макс неудачных попыток
    'SESSION_TIMEOUT': 24,                # Часов
    'OTP_TIMEOUT': 5,                     # Минут
    'BAN_DURATION': 60,                   # Минут
    'SUSPICIOUS_ACTIVITY_THRESHOLD': 5,   # События в час
}

print("✓ Security configuration loaded")
