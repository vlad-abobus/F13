# 🔐 Руководство интеграции безопасности в маршруты

## 📋 Содержание

1. [Обзор](#обзор)
2. [Интеграция в auth.py](#интеграция-в-authpy)
3. [Интеграция в posts.py](#интеграция-в-postspy)
4. [Интеграция в comments.py](#интеграция-в-commentspy)
5. [Интеграция в users.py](#интеграция-в-userspy)
6. [Интеграция в admin.py](#интеграция-в-adminpy)
7. [Миграция БД](#миграция-бд)
8. [Тестирование](#тестирование)

---

## Обзор

Каждый маршрут должен иметь защиту в зависимости от типа операции:

```
POST /api/auth/login
├─ @rate_limit (AUTH_LIMIT: 5/мин)
├─ @detect_bot
├─ @validate_request
└─ обработка

POST /api/posts
├─ @rate_limit (POST_LIMIT: 10/мин)
├─ @require_session
├─ @check_spam
├─ @protect_from_sql_injection
└─ обработка

POST /api/comments
├─ @rate_limit (COMMENT_LIMIT: 20/мин)
├─ @require_session
├─ @check_spam
└─ обработка
```

---

## Интеграция в auth.py

**Файл**: `app/routes/auth.py`

### 1. Обновить импорты

```python
from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User
from app.middleware.rate_limiter import rate_limit, RateLimitConfig
from app.middleware.bot_detection import detect_bot
from app.middleware.security_manager import (
    SessionManager, TwoFactorAuth, SuspiciousActivityTracker
)
from app.middleware.sql_injection_protection import validate_request

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
```

### 2. LOGIN маршрут

```python
login_schema = {
    'required': ['username', 'password'],
    'properties': {
        'username': {'type': 'username'},
        'password': {'type': 'string', 'minLength': 8}
    }
}

@auth_bp.route('/login', methods=['POST'])
@rate_limit(endpoint='auth_login', limit=RateLimitConfig.AUTH_LIMIT)
@detect_bot
@validate_request(login_schema)
def login():
    """Вход пользователя с защитой"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username).first()
    
    if not user or not user.check_password(password):
        # Логировать неудачную попытку
        SuspiciousActivityTracker.log_failed_login(username)
        return {
            'error': 'Неверные учетные данные'
        }, 401
    
    # Получить IP и User-Agent
    ip = request.remote_addr
    user_agent = request.headers.get('User-Agent', '')
    
    # Создать сессию
    session = SessionManager.create_session(user.id, ip, user_agent)
    
    # Если включена 2FA
    if getattr(user, 'two_fa_enabled', False):
        TwoFactorAuth.send_otp(user.id, method=getattr(user, 'two_fa_method', 'email'))
        return {
            'message': 'OTP отправлена',
            'session_id': session['session_id'],
            'requires_2fa': True
        }, 200
    
    # Логировать успешный вход
    SuspiciousActivityTracker.log_security_event(
        user.id,
        'successful_login',
        metadata={'ip': ip}
    )
    
    return {
        'message': 'Успешный вход',
        'session_token': session['session_token'],
        'user': user.to_dict(),
        'expires_at': session['expires_at']
    }, 200
```

### 3. REGISTER маршрут

```python
register_schema = {
    'required': ['username', 'email', 'password'],
    'properties': {
        'username': {'type': 'username'},
        'email': {'type': 'email'},
        'password': {'type': 'string', 'minLength': 8}
    }
}

@auth_bp.route('/register', methods=['POST'])
@rate_limit(endpoint='auth_register', limit=RateLimitConfig.AUTH_LIMIT * 2)
@detect_bot
@validate_request(register_schema)
def register():
    """Регистрация с защитой"""
    data = request.get_json()
    
    # Проверить если пользователь существует
    if User.query.filter_by(username=data['username']).first():
        return {'error': 'Пользователь уже существует'}, 400
    
    if User.query.filter_by(email=data['email']).first():
        return {'error': 'Email уже зарегистрирован'}, 400
    
    # Создать пользователя
    user = User(
        username=data['username'],
        email=data['email']
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    # Логировать новую регистрацию
    SuspiciousActivityTracker.log_security_event(
        user.id,
        'user_registered',
        metadata={'ip': request.remote_addr}
    )
    
    return {
        'message': 'Пользователь успешно зарегистрирован',
        'user': user.to_dict()
    }, 201
```

### 4. VERIFY-OTP маршрут

```python
@auth_bp.route('/verify-otp', methods=['POST'])
@rate_limit(endpoint='auth_otp', limit=5)
def verify_otp():
    """Верификация OTP кода"""
    data = request.get_json()
    user_id = data.get('user_id')
    otp_code = data.get('otp_code')
    
    if not TwoFactorAuth.verify_otp(user_id, otp_code):
        SuspiciousActivityTracker.log_security_event(
            user_id,
            'failed_2fa_attempt'
        )
        return {'error': 'Неверный код'}, 400
    
    session = SessionManager.create_session(
        user_id,
        request.remote_addr,
        request.headers.get('User-Agent', '')
    )
    
    return {
        'message': '2FA верифицирована',
        'session_token': session['session_token']
    }, 200
```

### 5. LOGOUT маршрут

```python
@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Выход из системы"""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    
    if token:
        user_id, valid = SessionManager.validate_session(token)
        if valid:
            SessionManager.terminate_session(user_id, token)
            
            SuspiciousActivityTracker.log_security_event(
                user_id,
                'user_logout'
            )
    
    return {'message': 'Успешный выход'}, 200
```

---

## Интеграция в posts.py

**Файл**: `app/routes/posts.py`

### 1. Обновить импорты

```python
from flask import Blueprint, request, jsonify
from app import db
from app.models.post import Post
from app.middleware.rate_limiter import rate_limit, RateLimitConfig
from app.middleware.spam_detector import check_spam
from app.middleware.security_manager import SessionManager
from app.middleware.sql_injection_protection import (
    protect_from_sql_injection, validate_request
)

posts_bp = Blueprint('posts', __name__, url_prefix='/api/posts')
```

### 2. CREATE POST маршрут

```python
create_post_schema = {
    'required': ['content'],
    'properties': {
        'content': {'type': 'string', 'minLength': 1, 'maxLength': 5000},
        'gallery_id': {'type': 'string', 'minLength': 1}
    }
}

@posts_bp.route('', methods=['POST'])
@rate_limit(endpoint='create_post', limit=RateLimitConfig.POST_LIMIT)
@check_spam(content_field='content')
@validate_request(create_post_schema)
def create_post():
    """Создаение поста с защитой"""
    # Получить сессию
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id, valid = SessionManager.validate_session(token)
    
    if not valid:
        return {'error': 'Неавторизирован'}, 401
    
    data = request.get_json()
    
    post = Post(
        user_id=user_id,
        content=data['content'],
        gallery_id=data.get('gallery_id')
    )
    
    db.session.add(post)
    db.session.commit()
    
    return {
        'message': 'Пост создан',
        'post': post.to_dict()
    }, 201
```

### 3. SEARCH маршрут

```python
@posts_bp.route('/search', methods=['GET'])
@rate_limit(endpoint='search_posts', limit=RateLimitConfig.API_LIMIT)
@protect_from_sql_injection
def search_posts():
    """Поиск постов с защитой от SQL инъекций"""
    query = request.args.get('q', '').strip()
    
    if not query or len(query) < 3:
        return {'error': 'Минимум 3 символа'}, 400
    
    # SQLAlchemy параметризует автоматически
    posts = Post.query.filter(
        Post.content.ilike(f'%{query}%')
    ).limit(50).all()
    
    return {
        'total': len(posts),
        'posts': [post.to_dict() for post in posts]
    }, 200
```

### 4. GET POST маршрут

```python
@posts_bp.route('/<post_id>', methods=['GET'])
@rate_limit(endpoint='get_post', limit=RateLimitConfig.API_LIMIT)
@protect_from_sql_injection
def get_post(post_id):
    """Получить пост"""
    try:
        post_id = int(post_id)  # Простая валидация
    except ValueError:
        return {'error': 'Неверный ID'}, 400
    
    post = Post.query.get(post_id)
    
    if not post:
        return {'error': 'Пост не найден'}, 404
    
    return post.to_dict(), 200
```

---

## Интеграция в comments.py

**Файл**: `app/routes/comments.py`

### 1. Обновить импорты

```python
from flask import Blueprint, request, jsonify
from app import db
from app.models.comment import Comment
from app.middleware.rate_limiter import rate_limit, RateLimitConfig
from app.middleware.spam_detector import check_spam
from app.middleware.security_manager import SessionManager
from app.middleware.sql_injection_protection import validate_request

comments_bp = Blueprint('comments', __name__, url_prefix='/api/comments')
```

### 2. CREATE COMMENT маршрут

```python
create_comment_schema = {
    'required': ['post_id', 'content'],
    'properties': {
        'post_id': {'type': 'string', 'minLength': 1},
        'content': {'type': 'string', 'minLength': 1, 'maxLength': 1000}
    }
}

@comments_bp.route('', methods=['POST'])
@rate_limit(endpoint='create_comment', limit=RateLimitConfig.COMMENT_LIMIT)
@check_spam(content_field='content')
@validate_request(create_comment_schema)
def create_comment():
    """Создание комментария с защитой"""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id, valid = SessionManager.validate_session(token)
    
    if not valid:
        return {'error': 'Неавторизирован'}, 401
    
    data = request.get_json()
    
    comment = Comment(
        user_id=user_id,
        post_id=data['post_id'],
        content=data['content']
    )
    
    db.session.add(comment)
    db.session.commit()
    
    return {
        'message': 'Комментарий создан',
        'comment': comment.to_dict()
    }, 201
```

---

## Интеграция в users.py

**Файл**: `app/routes/users.py`

### 1. UPDATE PROFILE маршрут

```python
update_profile_schema = {
    'properties': {
        'bio': {'type': 'string', 'maxLength': 500},
        'avatar': {'type': 'string', 'maxLength': 500},
        'location': {'type': 'string', 'maxLength': 100}
    }
}

@users_bp.route('/profile', methods=['PUT'])
@rate_limit(endpoint='update_profile', limit=RateLimitConfig.API_LIMIT)
@validate_request(update_profile_schema)
def update_profile():
    """Обновление профиля"""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id, valid = SessionManager.validate_session(token)
    
    if not valid:
        return {'error': 'Неавторизирован'}, 401
    
    user = User.query.get(user_id)
    data = request.get_json()
    
    if 'bio' in data:
        user.bio = data['bio']
    if 'avatar' in data:
        user.avatar = data['avatar']
    if 'location' in data:
        user.location = data['location']
    
    db.session.commit()
    
    SuspiciousActivityTracker.log_security_event(
        user_id,
        'profile_updated'
    )
    
    return {'message': 'Профиль обновлен', 'user': user.to_dict()}, 200
```

### 2. CHANGE PASSWORD маршрут

```python
@users_bp.route('/change-password', methods=['POST'])
@rate_limit(endpoint='change_password', limit=5)
def change_password():
    """Изменение пароля"""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id, valid = SessionManager.validate_session(token)
    
    if not valid:
        return {'error': 'Неавторизирован'}, 401
    
    data = request.get_json()
    user = User.query.get(user_id)
    
    if not user.check_password(data.get('current_password')):
        SuspiciousActivityTracker.log_security_event(
            user_id,
            'failed_password_change_attempt'
        )
        return {'error': 'Неверный текущий пароль'}, 400
    
    user.set_password(data.get('new_password'))
    db.session.commit()
    
    SuspiciousActivityTracker.log_security_event(
        user_id,
        'password_changed'
    )
    
    return {'message': 'Пароль изменен'}, 200
```

---

## Интеграция в admin.py

**Файл**: `app/routes/admin.py`

### 1. SECURITY LOGS маршрут

```python
@admin_bp.route('/security/logs', methods=['GET'])
@admin_required
@rate_limit(endpoint='admin_logs', limit=RateLimitConfig.API_LIMIT)
def get_security_logs():
    """Получить логи безопасности"""
    from app.models.security_models import SecurityLog
    
    limit = request.args.get('limit', 100, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    logs = SecurityLog.query.order_by(
        SecurityLog.created_at.desc()
    ).limit(limit).offset(offset).all()
    
    return jsonify({
        'total': SecurityLog.query.count(),
        'logs': [log.to_dict() for log in logs]
    }), 200
```

### 2. BLOCKED IPS маршрут

```python
@admin_bp.route('/security/blocked-ips', methods=['GET'])
@admin_required
def get_blocked_ips():
    """Получить заблокированные IP адреса"""
    from app.models.ip_ban import IPBan
    
    banned = IPBan.query.filter_by(is_active=True).all()
    
    return jsonify({
        'total': len(banned),
        'ips': [{
            'ip': b.ip_address,
            'reason': b.reason,
            'banned_until': b.ban_until.isoformat() if b.ban_until else None
        } for b in banned]
    }), 200
```

### 3. UNBAN IP маршрут

```python
@admin_bp.route('/security/unban-ip', methods=['POST'])
@admin_required
def unban_ip():
    """Разблокировать IP адрес"""
    from app.models.ip_ban import IPBan
    
    data = request.get_json()
    ip = data.get('ip')
    
    ban = IPBan.query.filter_by(ip_address=ip).first()
    
    if not ban:
        return {'error': 'IP не заблокирован'}, 404
    
    ban.is_active = False
    db.session.commit()
    
    SuspiciousActivityTracker.log_security_event(
        current_user.id,
        'ip_unbanned',
        metadata={'ip': ip}
    )
    
    return {'message': f'IP {ip} разблокирован'}, 200
```

---

## Миграция БД

### 1. Создать миграции

```bash
# Инициализировать Alembic если еще не инициализировано
alembic init -t async migrations

# Создать автоматическую миграцию
alembic revision --autogenerate -m "Add security models"
```

### 2. Отредактировать миграцию

**Файл**: `migrations/versions/xxx_add_security_models.py`

```python
from alembic import op
import sqlalchemy as sa

def upgrade():
    # UserSession table
    op.create_table(
        'user_session',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('session_token_hash', sa.String(255), nullable=False),
        sa.Column('ip_address', sa.String(45), nullable=False),
        sa.Column('user_agent', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('session_token_hash')
    )
    
    # TwoFactorCode table
    op.create_table(
        'two_factor_code',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('otp_hash', sa.String(255), nullable=False),
        sa.Column('method', sa.String(50), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('attempts', sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE')
    )
    
    # SecurityLog table
    op.create_table(
        'security_log',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('event_type', sa.String(100), nullable=False),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(255), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE')
    )

def downgrade():
    op.drop_table('security_log')
    op.drop_table('two_factor_code')
    op.drop_table('user_session')
```

### 3. Применить миграцию

```bash
alembic upgrade head
```

---

## Тестирование

### 1. Тест Rate Limiting

```python
import requests
import time

BASE_URL = 'http://localhost:5000'

# Тестировать rate limit на login
for i in range(10):
    response = requests.post(
        f'{BASE_URL}/api/auth/login',
        json={'username': 'test', 'password': 'wrong'}
    )
    print(f"Request {i+1}: {response.status_code}")
    
    if response.status_code == 429:  # Too Many Requests
        print("✅ Rate limit сработал!")
        break
    
    time.sleep(1)
```

### 2. Тест Bot Detection

```python
# Использовать User-Agent бота
headers = {
    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)'
}

response = requests.post(
    f'{BASE_URL}/api/posts',
    json={'content': 'Spam content'},
    headers=headers
)

print(f"Bot detection: {response.json()}")
```

### 3. Тест Spam Detection

```python
# Тестировать обнаружение спама
response = requests.post(
    f'{BASE_URL}/api/posts',
    json={
        'content': 'BUY VIAGRA NOW! http://spam.com/virus'
    }
)

print(f"Spam detection: {response.json()}")
```

### 4. Тест SQL Injection Protection

```python
# Попробовать SQL injection
response = requests.get(
    f'{BASE_URL}/api/posts/search?q=\' OR \'1\'=\'1'
)

print(f"SQL injection attempt: {response.json()}")
```

---

## ✅ Checklist Интеграции

- [ ] Импортировать все middleware в маршруты
- [ ] Добавить @rate_limit к критическим маршрутам
- [ ] Добавить @detect_bot к аутентификации
- [ ] Добавить @check_spam к созданию постов/комментариев
- [ ] Добавить @validate_request со схемами
- [ ] Добавить @protect_from_sql_injection к поиску
- [ ] Создать и применить миграции БД
- [ ] Настроить Redis подключение
- [ ] Создать файл .env с переменными
- [ ] Протестировать все маршруты
- [ ] Включить логирование в production
- [ ] Настроить мониторинг логов

---

## 📞 Итого

Все компоненты готовы к интеграции. Следуйте шагам выше для каждого маршрута.
