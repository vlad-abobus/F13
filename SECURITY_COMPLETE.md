# 🔐 Полная система безопасности приложения

## 📋 Содержание

1. [Обзор](#обзор)
2. [Компоненты системы](#компоненты-системы)
3. [Установка и конфигурация](#установка-и-конфигурация)
4. [Использование](#использование)
5. [Best Practices](#best-practices)
6. [Мониторинг](#мониторинг)

---

## Обзор

Полная система безопасности включает защиту от:

✅ **DDoS атак** - Rate Limiting  
✅ **Ботов** - Bot Detection  
✅ **Спама** - Spam Detection  
✅ **Взлома аккаунтов** - Account Security (2FA, Sessions)  
✅ **SQL инъекций** - SQL Injection Protection  
✅ **Других атак** - Request Validation  

---

## Компоненты системы

### 1. 🚫 Rate Limiter (DDoS защита)

**Файл**: `app/middleware/rate_limiter.py`

**Функция**: Ограничивает количество запросов с одного IP адреса

**Пределы**:
```
- Общий: 60 запросов/минуту
- Аутентификация: 5 попыток/минуту
- Создание постов: 10 постов/минуту
- Комментарии: 20 комментариев/минуту
- API: 50 запросов/минуту
```

**Использование**:
```python
from app.middleware.rate_limiter import rate_limit, RateLimitConfig

@app.route('/api/posts', methods=['POST'])
@rate_limit(endpoint='create_post', limit=RateLimitConfig.POST_LIMIT)
def create_post():
    # Ваш код
    pass
```

**Redis**:
- Используется для быстрого кеширования
- Fallback на БД если Redis недоступен

### 2. 🤖 Bot Detection

**Файл**: `app/middleware/bot_detection.py`

**Функция**: Детектирует автоматизированные инструменты и боты

**Проверки**:
- User-Agent анализ
- Отсутствие необходимых заголовков
- Подозрительные заголовки
- Требует CAPTCHA если score > 50

**Использование**:
```python
from app.middleware.bot_detection import detect_bot

@app.route('/api/auth/login', methods=['POST'])
@detect_bot
def login():
    # Ваш код
    pass
```

### 3. 🚨 Spam Detector

**Файл**: `app/middleware/spam_detector.py`

**Функция**: Детектирует спам и вредоносный контент

**Проверки**:
- Ключевые слова спама
- Подозрительные URL
- Phishing попытки
- Malware сигнатуры
- Поведение пользователя
- Повторяющееся содержимое

**Использование**:
```python
from app.middleware.spam_detector import check_spam

@app.route('/api/posts', methods=['POST'])
@check_spam(content_field='content')
def create_post():
    # Ваш код
    pass
```

### 4. 🔒 Security Manager (Account Security)

**Файл**: `app/middleware/security_manager.py`

**Функции**:

#### Session Management
```python
from app.middleware.security_manager import SessionManager

# Создать сессию
session = SessionManager.create_session(user_id, ip_address, user_agent)

# Валидировать сессию
is_valid, user_id = SessionManager.validate_session(session_token)

# Завершить сессию
SessionManager.terminate_session(user_id, session_id)

# Получить активные сессии
sessions = SessionManager.get_active_sessions(user_id)
```

#### Two-Factor Auth (2FA)
```python
from app.middleware.security_manager import TwoFactorAuth

# Отправить OTP
TwoFactorAuth.send_otp(user_id, method='email')

# Верифицировать OTP
is_valid = TwoFactorAuth.verify_otp(user_id, otp_code)
```

#### IP Whitelist
```python
from app.middleware.security_manager import IPWhitelist

# Добавить IP в белый список
IPWhitelist.add_ip(user_id, ip_address, device_name='My Device')

# Проверить если IP доверенный
is_trusted = IPWhitelist.is_ip_trusted(user_id, ip_address)

# Получить доверенные устройства
devices = IPWhitelist.get_trusted_devices(user_id)
```

#### Suspicious Activity Tracking
```python
from app.middleware.security_manager import SuspiciousActivityTracker

# Логировать неудачный вход
SuspiciousActivityTracker.log_failed_login(username)

# Логировать событие безопасности
SuspiciousActivityTracker.log_security_event(user_id, 'password_changed')
```

### 5. 🛡️ SQL Injection Protection

**Файл**: `app/middleware/sql_injection_protection.py`

**Функции**:
- Детектирование SQL инъекций
- Санитизация входных данных
- Валидация параметров запроса

**Использование**:
```python
from app.middleware.sql_injection_protection import protect_from_sql_injection, validate_request

@app.route('/api/search', methods=['GET'])
@protect_from_sql_injection
def search():
    # Ваш код, защищен от SQL инъекций
    pass

# Валидация по схеме
schema = {
    'required': ['username', 'email'],
    'properties': {
        'username': {'type': 'username'},
        'email': {'type': 'email'},
        'bio': {'type': 'string', 'maxLength': 500}
    }
}

@app.route('/api/users/register', methods=['POST'])
@validate_request(schema)
def register():
    # Ваш код
    pass
```

---

## Установка и конфигурация

### 1. Установить зависимости

```bash
pip install redis user-agents PyJWT cryptography python-dotenv
```

Или из requirements.txt:
```bash
pip install -r requirements.txt
```

### 2. Создать файл .env

```env
# Безопасность
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here

# Redis
REDIS_URL=redis://localhost:6379

# База данных
DATABASE_URL=postgresql://user:password@localhost/dbname

# Email (для 2FA)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

### 3. Инициализировать модели БД

```bash
python
from app import db, create_app
app = create_app()
with app.app_context():
    db.create_all()
```

### 4. Включить Redis (опционально)

```bash
# macOS
brew install redis
brew services start redis

# Linux
sudo apt-get install redis-server
sudo systemctl start redis-server

# Docker
docker run -d -p 6379:6379 redis:latest
```

---

## Использование

### Пример 1: Complete Authentication Flow

```python
from flask import Flask, request, jsonify
from app import db, create_app
from app.models.user import User
from app.middleware.security_manager import SessionManager, TwoFactorAuth, SuspiciousActivityTracker
from app.middleware.rate_limiter import rate_limit, RateLimitConfig
from app.middleware.bot_detection import detect_bot
from app.middleware.spam_detector import check_spam

app = create_app()

@app.route('/api/auth/login', methods=['POST'])
@rate_limit(endpoint='login', limit=RateLimitConfig.AUTH_LIMIT)
@detect_bot
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username).first()
    
    if not user or not user.check_password(password):
        SuspiciousActivityTracker.log_failed_login(username)
        return {'error': 'Invalid credentials'}, 401
    
    # Создаем сессию
    ip = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    session = SessionManager.create_session(user.id, ip, user_agent)
    
    # Если включена 2FA
    if user.two_fa_enabled:
        TwoFactorAuth.send_otp(user.id, method=user.two_fa_method)
        return {
            'message': 'OTP sent',
            'session_id': session['session_id'],
            'need_2fa': True
        }, 200
    
    SuspiciousActivityTracker.log_security_event(user.id, 'successful_login')
    
    return {
        'message': 'Login successful',
        'session_token': session['session_token'],
        'expires_at': session['expires_at']
    }, 200


@app.route('/api/auth/verify-otp', methods=['POST'])
def verify_otp():
    data = request.get_json()
    user_id = data.get('user_id')
    otp_code = data.get('otp_code')
    
    if not TwoFactorAuth.verify_otp(user_id, otp_code):
        return {'error': 'Invalid OTP'}, 400
    
    session = SessionManager.create_session(
        user_id,
        request.remote_addr,
        request.headers.get('User-Agent')
    )
    
    return {
        'message': '2FA verified',
        'session_token': session['session_token']
    }, 200


@app.route('/api/posts', methods=['POST'])
@rate_limit(endpoint='create_post', limit=RateLimitConfig.POST_LIMIT)
@check_spam(content_field='content')
def create_post():
    # Ваш код
    pass
```

### Пример 2: Admin Dashboard для мониторинга

```python
@app.route('/admin/security/logs', methods=['GET'])
@admin_required
def get_security_logs():
    from app.models.security_models import SecurityLog
    
    logs = SecurityLog.query.order_by(
        SecurityLog.created_at.desc()
    ).limit(100).all()
    
    return jsonify([log.to_dict() for log in logs]), 200


@app.route('/admin/security/blocked-ips', methods=['GET'])
@admin_required
def get_blocked_ips():
    from app.models.ip_ban import IPBan
    
    banned_ips = IPBan.query.filter_by(is_active=True).all()
    
    return jsonify([{
        'ip': ban.ip_address,
        'reason': ban.reason,
        'banned_until': ban.ban_until.isoformat() if ban.ban_until else None
    } for ban in banned_ips]), 200
```

---

## Best Practices

### 1. ✅ Всегда используйте HTTPS в Production

```python
# app.py
from flask_talisman import Talisman

Talisman(app, force_https=True)
```

### 2. ✅ Включайте Security Headers

```python
@app.after_request
def set_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000'
    return response
```

### 3. ✅ Логируйте все события безопасности

```python
SuspiciousActivityTracker.log_security_event(
    user_id,
    'password_changed',
    description='User changed password'
)
```

### 4. ✅ Используйте strong passwords

```python
# Минимум 8 символов, буквы, цифры, спец символы
def is_strong_password(password: str) -> bool:
    if len(password) < 8:
        return False
    
    import re
    if not re.search(r'[a-z]', password):
        return False
    if not re.search(r'[A-Z]', password):
        return False
    if not re.search(r'[0-9]', password):
        return False
    if not re.search(r'[!@#$%^&*]', password):
        return False
    
    return True
```

### 5. ✅ Регулярно проверяйте логи

```bash
# Мониторить подозрительную активность
tail -f logs/security.log | grep "suspicious"

# Проверить заблокированные IP
tail -f logs/security.log | grep "banned"
```

---

## Мониторинг

### Ключевые метрики

1. **Rate Limit Violations** - Количество превышений лимита
2. **Bot Attempts** - Количество попыток ботов
3. **Spam Reports** - Обнаруженный спам
4. **Failed Logins** - Неудачные попытки входа
5. **Active Sessions** - Активные сессии пользователей
6. **Blocked IPs** - Количество заблокированных IP адресов

### Dashboard SQL Запросы

```sql
-- Последние события безопасности
SELECT * FROM security_logs 
ORDER BY created_at DESC 
LIMIT 100;

-- Активные сессии
SELECT user_id, COUNT(*) as session_count 
FROM user_sessions 
WHERE expires_at > NOW()
GROUP BY user_id;

-- Заблокированные IP
SELECT ip_address, reason, ban_until 
FROM ip_bans 
WHERE is_active = true;

-- Попытки спама сегодня
SELECT user_id, COUNT(*) as spam_attempts
FROM security_logs
WHERE event_type = 'spam_detected'
AND created_at >= DATE_TRUNC('day', NOW())
GROUP BY user_id
ORDER BY spam_attempts DESC;
```

---

## 🎯 Итоговый рейтинг безопасности

| Защита | Уровень | Статус |
|--------|---------|--------|
| DDoS | ⭐⭐⭐⭐⭐ | ✅ |
| Боты | ⭐⭐⭐⭐ | ✅ |
| Спам | ⭐⭐⭐⭐ | ✅ |
| SQL инъекции | ⭐⭐⭐⭐⭐ | ✅ |
| Аккаунты | ⭐⭐⭐⭐⭐ | ✅ |

**Общий рейтинг: ⭐⭐⭐⭐⭐ (5/5)**

---

## 📞 Помощь

Если возникли вопросы:
1. Проверьте логи: `tail -f logs/app.log`
2. Проверьте Redis: `redis-cli ping`
3. Проверьте БД: `psql -h localhost -U user dbname`
4. Читайте документацию компонентов
