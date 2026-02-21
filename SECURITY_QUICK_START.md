# 🔐 Система безопасности - Быстрый старт

## ✅ Что было установлено

### 1. 5 основных модулей безопасности
- **Rate Limiter** (`app/middleware/rate_limiter.py`) - DDoS защита
- **Bot Detection** (`app/middleware/bot_detection.py`) - Детектирование ботов
- **Spam Detector** (`app/middleware/spam_detector.py`) - Обнаружение спама
- **Security Manager** (`app/middleware/security_manager.py`) - Управление сессиями, 2FA, учетные записи
- **SQL Injection Protection** (`app/middleware/sql_injection_protection.py`) - Защита от SQL инъекций

### 2. Модели БД для безопасности
- `UserSession` - Управление сессиями
- `TwoFactorCode` - Коды OTP для 2FA
- `TrustedDevice` - Белый список IP адресов
- `SecurityLog` - Логирование событий безопасности
- `RateLimitCounter` - Fallback для rate limiting

### 3. Интегрированные маршруты
- ✅ **auth.py** - Добавлены @detect_bot и логирование
- ✅ **posts.py** - Добавлены @check_spam, @protect_from_sql_injection
- ✅ **comments.py** - Добавлены @check_spam и логирование
- ✅ **users.py** - Добавлены логирование обновлений профиля
- ✅ **admin.py** - Добавлены логирования действий админов

---

## 🚀 Как начать использовать

### 1. Установить необходимые пакеты (уже установлены)
```bash
pip install user-agents redis PyJWT cryptography python-dotenv
```

### 2. Создать таблицы безопасности

#### Вариант А: Используя SQL миграцию
```bash
# Прочитайте и выполните SQL из файла
cat migrations/add_security_models.sql | psql postgresql://user:password@localhost/dbname
```

#### Вариант B: Используя Python миграцию
```bash
python migrations/migrate_security_models.py
```

### 3. Настроить переменные окружения

Скопируйте пример конфигурации:
```bash
cp .env.example.security .env
```

Заполните необходимые переменные:
```env
# Обязательные
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:password@localhost/dbname

# Опционально (но рекомендуется для production)
REDIS_URL=redis://localhost:6379
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

### 4. Запустить приложение

```bash
python run.py
```

Все декораторы безопасности будут автоматически применяться к маршрутам.

---

## 📊 Статус безопасности по маршрутам

### Аутентификация (auth.py)
| Маршрут | Защита | Статус |
|---------|--------|--------|
| POST /api/auth/register | detect_bot, rate_limit, captcha | ✅ |
| POST /api/auth/login | detect_bot, rate_limit, captcha | ✅ |
| POST /api/auth/verify-otp | rate_limit | ✅ |
| POST /api/auth/refresh | rate_limit, jwt | ✅ |

### Посты (posts.py)
| Маршрут | Защита | Статус |
|---------|--------|--------|
| GET /api/posts | sql_injection_protection | ✅ |
| POST /api/posts | check_spam, rate_limit, token_required | ✅ |
| GET /api/posts/<id> | sql_injection_protection | ✅ |

### Комментарии (comments.py)
| Маршрут | Защита | Статус |
|---------|--------|--------|
| POST /api/comments | check_spam, rate_limit, token_required | ✅ |
| GET /api/comments | sql_injection_protection | ✅ |

### Пользователи (users.py)
| Маршрут | Защита | Статус |
|---------|--------|--------|
| PUT /api/users/profile | token_required, logging | ✅ |
| GET /api/users/<username> | sql_injection_protection | ✅ |

### Администрирование (admin.py)
| Маршрут | Защита | Статус |
|---------|--------|--------|
| POST /api/admin/users/<id>/ban | admin_required, logging | ✅ |
| POST /api/admin/users/<id>/unban | admin_required, logging | ✅ |

---

## 🔧 Как использовать компоненты

### Rate Limiter
```python
@rate_limit(endpoint='my_endpoint', limit=10)
def my_route():
    pass
```

### Bot Detection
```python
@detect_bot
def login():
    # Требует CAPTCHA если обнаружен бот
    pass
```

### Spam Detection
```python
@check_spam(content_field='content')
def create_post():
    # Проверяет контент на спам
    pass
```

### Security Manager (2FA, Sessions)
```python
# Создать сессию
session = SessionManager.create_session(user_id, ip, user_agent)

# Отправить OTP
TwoFactorAuth.send_otp(user_id, method='email')

# Логировать событие
SuspiciousActivityTracker.log_security_event(user_id, 'password_changed')
```

### SQL Injection Protection
```python
@protect_from_sql_injection
def search():
    # Защищена от SQL инъекций
    pass
```

---

## 📈 Мониторинг и логирование

### Просмотр логов безопасности
```sql
-- Последние события безопасности
SELECT * FROM security_log 
ORDER BY created_at DESC 
LIMIT 100;

-- Активные сессии пользователя
SELECT * FROM user_session 
WHERE user_id = 'user_id' 
AND expires_at > NOW();

-- Заблокированные IP адреса
SELECT * FROM ip_ban 
WHERE is_active = true;
```

### Мониторить через Python
```python
from app.models.security_models import SecurityLog

# Получить последние события
logs = SecurityLog.query.order_by(
    SecurityLog.created_at.desc()
).limit(100).all()

for log in logs:
    print(f"{log.event_type} - {log.user_id} - {log.created_at}")
```

---

## ⚙️ Конфигурация

### Пределы Rate Limiting
В `.env`:
```
RATE_LIMIT_GLOBAL=60          # 60 запросов/минуту
RATE_LIMIT_AUTH=5             # 5 попыток входа/минуту
RATE_LIMIT_POST=10            # 10 постов/минуту
RATE_LIMIT_COMMENT=20         # 20 комментариев/минуту
```

### Пороги для спама
```
SPAM_FLAG_THRESHOLD=7         # Оценка спама для флага
SPAM_MAX_URLS_PER_POST=2      # Макс URL в посте
SPAM_MAX_URLS_PER_COMMENT=1   # Макс URL в комментарии
```

### Безопасность учетной записи
```
MAX_FAILED_LOGINS=5           # Блокировка после 5 неудачных попыток
LOCKOUT_DURATION=30           # Длительность блокировки (минут)
MAX_SESSIONS_PER_USER=5       # Макс активных сессий
SESSION_TIMEOUT=24            # Timeout сессии (часов)
```

---

## 🧪 Тестирование

### Запустить интеграционный тест
```bash
python test_security_integration.py
```

### Вручную протестировать rate_limit
```bash
# Снова в 1 минуту превышить лимит
for i in {1..15}; do
  curl http://localhost:5000/api/auth/login \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"wrong"}'
  sleep 1
done
# Должны получить 429 Too Many Requests
```

### Протестировать bot detection
```bash
curl http://localhost:5000/api/posts \
  -H "User-Agent: Mozilla/5.0 (compatible; Googlebot/2.1)" \
  -X POST \
  -d '{"content":"Spam"}' \
```

---

## 📞 Помощь и рекомендации

### Проблема: Redis недоступен
**Решение:** Система автоматически переходит на БД как fallback. Но для production рекомендуется установить Redis:

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

### Проблема: Слишком много ложных срабатываний bot detection
**Решение:** Отрегулируйте `BOT_DETECTION_THRESHOLD` в .env (по умолчанию 50)

### Проблема: Спам детектор слишком агрессивен
**Решение:** Изменяйте `SPAM_FLAG_THRESHOLD` (по умолчанию 7)

---

## 📝 Документация

Для подробной информации смотрите:
- `SECURITY_COMPLETE.md` - Полная документация всей системы
- `SECURITY_INTEGRATION_GUIDE.md` - Руководство по интеграции
- `SECURITY_CONFIG.py` - Константы конфигурации

---

## ✨ Итого

✅ **Все 5 компонентов безопасности интегрированы в маршруты**  
✅ **Логирование всех рисковых событий реализовано**  
✅ **Миграции БД готовы**  
✅ **Конфигурация готова к использованию**  

🎉 **Система полностью защищена и готова к production!**
