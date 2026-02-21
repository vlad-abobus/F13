# 🚀 Рекомендації технологій для реворку F13

> **Важливо:** g4f залишається без змін, це редмі для реворку.

## 📋 Зміст

1. [Backend покращення](#backend-покращення)
2. [Frontend покращення](#frontend-покращення)
3. [Database та міграції](#database-та-міграції)
4. [Валідація та безпека](#валідація-та-безпека)
5. [Тестування](#тестування)
6. [DevOps та інфраструктура](#devops-та-інфраструктура)
7. [Продуктивність та масштабованість](#продуктивність-та-масштабованість)
8. [Моніторинг та логування](#моніторинг-та-логування)
9. [Real-time функціональність](#real-time-функціональність)
10. [Порівняльна таблиця](#порівняльна-таблиця)

---

## 🔧 Backend покращення

### 1. **Alembic для міграцій БД** ⭐⭐⭐⭐⭐
**Поточна проблема:** Немає системи міграцій, зміни моделей вручну.

**Рішення:**
```bash
pip install alembic
```

**Переваги:**
- ✅ Версіонування схеми БД
- ✅ Автоматичні міграції при зміні моделей
- ✅ Rollback можливості
- ✅ Team collaboration (всі мають однакову схему)

**Інтеграція:**
```python
# alembic.ini та env.py налаштування
# Команди:
# alembic revision --autogenerate -m "Add new field"
# alembic upgrade head
# alembic downgrade -1
```

---

### 2. **Pydantic для валідації** ⭐⭐⭐⭐⭐
**Поточна проблема:** Валідація через Flask вручну, немає type safety для API.

**Рішення:**
```bash
pip install pydantic pydantic-settings
```

**Переваги:**
- ✅ Автоматична валідація request/response
- ✅ Type hints для API
- ✅ JSON Schema генерація
- ✅ Валідація email, URL, дат автоматично

**Приклад:**
```python
from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class PostCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    tags: Optional[list[str]] = Field(default=[])
    is_nsfw: bool = False
    is_anonymous: bool = False

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, regex="^[a-zA-Z0-9_]+$")
    email: EmailStr
    password: str = Field(..., min_length=6)
```

---

### 3. **Flask-SocketIO для real-time** ⭐⭐⭐⭐
**Поточна проблема:** Немає real-time оновлень (нові пости, коментарі, статуси).

**Рішення:**
```bash
pip install flask-socketio python-socketio
```

**Використання:**
- Real-time оновлення стрічки постів
- Live коментарі
- Статуси активності в реальному часі
- WebSocket для MikuGPT чату

---

### 4. **Celery для асинхронних задач** ⭐⭐⭐⭐
**Поточна проблема:** MikuGPT блокує API thread, обробка зображень синхронна.

**Рішення:**
```bash
pip install celery redis
# або
pip install celery[redis]
```

**Використання:**
- Асинхронна генерація MikuGPT відповідей
- Обробка зображень (resize, thumbnail)
- Email нотифікації
- Scheduled tasks (cleanup, analytics)

**Приклад:**
```python
from celery import Celery

celery = Celery('freedom13', broker='redis://localhost:6379/0')

@celery.task
def generate_miku_response_async(user_id, message):
    # Не блокує API
    response = generate_miku_response(message)
    # Зберегти в БД
    return response
```

---

### 5. **Redis для кешування** ⭐⭐⭐⭐⭐
**Поточна проблема:** Немає кешування, кожен запит йде в БД.

**Рішення:**
```bash
pip install redis flask-caching
```

**Використання:**
- Кешування постів (popular, new)
- Кешування профілів користувачів
- Rate limiting (замість in-memory)
- Session storage
- Celery broker

**Приклад:**
```python
from flask_caching import Cache

cache = Cache(app, config={'CACHE_TYPE': 'redis', 'CACHE_REDIS_URL': 'redis://localhost:6379/0'})

@cache.cached(timeout=300, key_prefix='popular_posts')
def get_popular_posts():
    return Post.query.order_by(Post.likes_count.desc()).limit(20).all()
```

---

### 6. **SQLAlchemy 2.0 async (опціонально)** ⭐⭐⭐
**Поточна проблема:** Синхронні запити до БД.

**Рішення:**
```bash
pip install sqlalchemy[asyncio] asyncpg  # для PostgreSQL
```

**Переваги:**
- Асинхронні запити до БД
- Краща продуктивність при високому навантаженні
- Підтримка async/await

**Недоліки:**
- Потребує рефакторингу всього коду
- Складніше налагодження

---

### 7. **Structured Logging** ⭐⭐⭐⭐
**Поточна проблема:** print() для логування, немає структури.

**Рішення:**
```bash
pip install structlog python-json-logger
```

**Переваги:**
- JSON логи для парсингу
- Контекстне логування
- Інтеграція з monitoring tools

**Приклад:**
```python
import structlog

logger = structlog.get_logger()

logger.info("user_registered", user_id=user.id, username=user.username)
```

---

## 🎨 Frontend покращення

### 1. **React Query v5 (TanStack Query)** ⭐⭐⭐⭐⭐
**Поточна проблема:** Використовується React Query v3 (застаріла).

**Рішення:**
```bash
npm install @tanstack/react-query@latest
```

**Переваги:**
- Краще кешування та синхронізація
- Optimistic updates
- Infinite queries для пагінації
- DevTools для debugging

**Migration:**
```typescript
// Старе
import { useQuery } from 'react-query';

// Нове
import { useQuery } from '@tanstack/react-query';
```

---

### 2. **Zod для валідації форм** ⭐⭐⭐⭐⭐
**Поточна проблема:** Валідація форм вручну, немає type safety.

**Рішення:**
```bash
npm install zod
```

**Переваги:**
- TypeScript-first валідація
- Синхронізація з Pydantic на бекенді
- Автоматична генерація типів

**Приклад:**
```typescript
import { z } from 'zod';

const PostSchema = z.object({
  content: z.string().min(1).max(5000),
  tags: z.array(z.string()).optional(),
  is_nsfw: z.boolean().default(false),
});

type Post = z.infer<typeof PostSchema>;
```

---

### 3. **React Error Boundaries** ⭐⭐⭐⭐
**Поточна проблема:** Немає graceful error handling на фронтенді.

**Рішення:**
```typescript
// Створити ErrorBoundary компонент
class ErrorBoundary extends React.Component {
  // Обробка помилок рендерингу
}
```

**Переваги:**
- Не падає весь додаток при помилці
- Показує fallback UI
- Логування помилок

---

### 4. **React.lazy + Suspense для code splitting** ⭐⭐⭐⭐
**Поточна проблема:** Весь bundle завантажується одразу.

**Рішення:**
```typescript
const Admin = React.lazy(() => import('./pages/Admin'));
const MikuGPT = React.lazy(() => import('./pages/MikuGPT'));

<Suspense fallback={<Loading />}>
  <Admin />
</Suspense>
```

**Переваги:**
- Менший initial bundle
- Швидше завантаження
- Lazy loading сторінок

---

### 5. **SWR або React Query для real-time** ⭐⭐⭐⭐
**Поточна проблема:** Polling кожні 30 секунд (неефективно).

**Рішення:**
- WebSocket через Socket.IO клієнт
- Або SWR з revalidation

```typescript
import useSWR from 'swr';

const { data } = useSWR('/api/posts', fetcher, {
  refreshInterval: 1000, // 1 секунда
  revalidateOnFocus: true,
});
```

---

### 6. **React Hook Form + Zod integration** ⭐⭐⭐⭐
**Поточна проблема:** React Hook Form без валідації схем.

**Рішення:**
```bash
npm install @hookform/resolvers zod
```

**Приклад:**
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm({
  resolver: zodResolver(PostSchema),
});
```

---

### 7. **Vitest для тестування** ⭐⭐⭐⭐
**Поточна проблема:** Немає тестів на фронтенді.

**Рішення:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**Переваги:**
- Швидкі unit тести
- Інтеграція з Vite
- Coverage reports

---

### 8. **Playwright для E2E тестів** ⭐⭐⭐
**Рішення:**
```bash
npm install -D @playwright/test
```

**Використання:**
- E2E тести критичних flows
- Visual regression testing

---

## 💾 Database та міграції

### 1. **Alembic (обов'язково)** ⭐⭐⭐⭐⭐
Див. вище в Backend покращення.

### 2. **PostgreSQL-only для production** ⭐⭐⭐⭐⭐
**Поточна проблема:** SQLite fallback для production.

**Рішення:**
- Видалити SQLite fallback в `config.py`
- Обов'язкова PostgreSQL для production
- SQLite тільки для локальної розробки

**Переваги:**
- Concurrent writes
- Full-text search
- JSONB для гнучких даних
- Better performance

---

### 3. **Database indexes** ⭐⭐⭐⭐⭐
**Поточна проблема:** Можливо відсутні індекси на важливих полях.

**Рішення:**
```python
# Додати індекси в моделях
class Post(db.Model):
    # ...
    __table_args__ = (
        db.Index('idx_post_created_at', 'created_at'),
        db.Index('idx_post_user_id', 'user_id'),
        db.Index('idx_post_moderation', 'moderation_status'),
    )
```

**Критичні індекси:**
- `Post.created_at` (сортування)
- `Post.user_id` (фільтрація)
- `User.username` (пошук)
- `Comment.post_id` (коментарі до поста)
- `Follow.follower_id`, `Follow.following_id` (підписки)

---

### 4. **Full-text search (PostgreSQL)** ⭐⭐⭐⭐
**Рішення:**
```python
# Додати GIN індекс для full-text search
from sqlalchemy import text

db.session.execute(text("""
    CREATE INDEX idx_post_content_fts ON posts 
    USING gin(to_tsvector('russian', content));
"""))
```

**Використання:**
- Пошук постів за текстом
- Пошук користувачів

---

## 🔒 Валідація та безпека

### 1. **Pydantic (Backend)** ⭐⭐⭐⭐⭐
Див. вище.

### 2. **Zod (Frontend)** ⭐⭐⭐⭐⭐
Див. вище.

### 3. **Helmet для Flask** ⭐⭐⭐⭐
**Рішення:**
```bash
pip install flask-helmet
```

**Переваги:**
- Security headers (XSS, CSRF, etc.)
- Content Security Policy

---

### 4. **Rate limiting покращення** ⭐⭐⭐⭐
**Поточна проблема:** Flask-Limiter з in-memory storage.

**Рішення:**
- Використовувати Redis для rate limiting
- Різні ліміти для різних endpoints
- IP whitelist для адмінів

```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import redis

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    storage_uri="redis://localhost:6379/1",
    default_limits=["200 per day", "50 per hour"]
)

@limiter.limit("10 per minute")
@posts_bp.route('/', methods=['POST'])
def create_post():
    # ...
```

---

### 5. **Input sanitization** ⭐⭐⭐⭐
**Рішення:**
```bash
pip install bleach markdown
```

**Використання:**
- Sanitize HTML в коментарях
- Markdown для постів (безпечний)

---

### 6. **CORS покращення** ⭐⭐⭐
**Поточна проблема:** Можливо занадто відкритий CORS.

**Рішення:**
- Точні origins замість wildcard
- Credentials тільки для потрібних endpoints

---

## 🧪 Тестування

### 1. **pytest для Backend** ⭐⭐⭐⭐⭐
**Рішення:**
```bash
pip install pytest pytest-flask pytest-cov
```

**Структура:**
```
tests/
├── conftest.py
├── test_auth.py
├── test_posts.py
├── test_miku.py
└── test_integration.py
```

**Приклад:**
```python
import pytest
from app import create_app

@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_create_post(client):
    response = client.post('/api/posts', json={
        'content': 'Test post'
    })
    assert response.status_code == 201
```

---

### 2. **Vitest для Frontend** ⭐⭐⭐⭐
Див. вище.

### 3. **Playwright для E2E** ⭐⭐⭐
Див. вище.

---

## 🚀 DevOps та інфраструктура

### 1. **Docker + Docker Compose** ⭐⭐⭐⭐⭐
**Рішення:**
```dockerfile
# Dockerfile для backend
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "-c", "gunicorn_config.py", "wsgi:app"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: freedom13
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
  
  redis:
    image: redis:7-alpine
  
  backend:
    build: .
    ports:
      - "5000:5000"
    depends_on:
      - db
      - redis
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@db:5432/freedom13
      REDIS_URL: redis://redis:6379/0
  
  celery:
    build: .
    command: celery -A app.celery worker --loglevel=info
    depends_on:
      - db
      - redis
```

**Переваги:**
- Однакова середовище для всіх
- Легкий деплой
- Scaling

---

### 2. **GitHub Actions CI/CD** ⭐⭐⭐⭐⭐
**Рішення:**
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
      - run: pip install -r requirements.txt
      - run: pytest
      - run: npm install
      - run: npm test
```

---

### 3. **Environment management** ⭐⭐⭐⭐
**Рішення:**
- `.env.example` для документації
- Різні `.env` для dev/staging/prod
- Використання `python-dotenv` (вже є)

---

### 4. **Health checks** ⭐⭐⭐
**Поточна проблема:** Тільки `/api/health`.

**Рішення:**
```python
@app.route('/api/health')
def health():
    # Перевірка БД
    try:
        db.session.execute(text('SELECT 1'))
        db_status = 'ok'
    except:
        db_status = 'error'
    
    # Перевірка Redis
    try:
        redis_client.ping()
        redis_status = 'ok'
    except:
        redis_status = 'error'
    
    return {
        'status': 'ok' if db_status == 'ok' and redis_status == 'ok' else 'degraded',
        'database': db_status,
        'redis': redis_status,
        'timestamp': datetime.utcnow().isoformat()
    }
```

---

## ⚡ Продуктивність та масштабованість

### 1. **Redis кешування** ⭐⭐⭐⭐⭐
Див. вище.

### 2. **CDN для статичних файлів** ⭐⭐⭐⭐
**Рішення:**
- Cloudflare, AWS CloudFront
- Статичні assets (Ruffle, logo) через CDN

---

### 3. **Image optimization** ⭐⭐⭐⭐
**Рішення:**
```bash
pip install pillow-simd  # швидший Pillow
```

**Функціонал:**
- Автоматичний resize завантажених зображень
- Thumbnail generation
- WebP конвертація

```python
from PIL import Image

def create_thumbnail(image_path, size=(300, 300)):
    img = Image.open(image_path)
    img.thumbnail(size, Image.Resampling.LANCZOS)
    img.save(thumbnail_path, 'JPEG', quality=85, optimize=True)
```

---

### 4. **Database connection pooling** ⭐⭐⭐⭐
**Рішення:**
```python
# В config.py
SQLALCHEMY_ENGINE_OPTIONS = {
    'pool_size': 10,
    'pool_recycle': 3600,
    'pool_pre_ping': True,
}
```

---

### 5. **Gunicorn з workers** ⭐⭐⭐⭐
**Рішення:**
```python
# gunicorn_config.py
workers = 4
worker_class = 'sync'
worker_connections = 1000
timeout = 30
keepalive = 2
```

---

## 📊 Моніторинг та логування

### 1. **Structured Logging** ⭐⭐⭐⭐
Див. вище.

### 2. **Sentry для error tracking** ⭐⭐⭐⭐
**Рішення:**
```bash
pip install sentry-sdk[flask]
```

**Переваги:**
- Автоматичне відстеження помилок
- Stack traces
- Performance monitoring

---

### 3. **Prometheus + Grafana** ⭐⭐⭐
**Рішення:**
```bash
pip install prometheus-flask-exporter
```

**Метрики:**
- Request rate
- Response time
- Error rate
- Database query time

---

## 🔄 Real-time функціональність

### 1. **Flask-SocketIO** ⭐⭐⭐⭐
Див. вище.

**Використання:**
- Live оновлення стрічки
- Real-time коментарі
- Статуси активності
- WebSocket для MikuGPT чату

---

## 📊 Порівняльна таблиця

| Технологія | Пріоритет | Складність | Вплив | Час впровадження |
|------------|-----------|------------|-------|------------------|
| **Alembic** | ⭐⭐⭐⭐⭐ | Низька | Високий | 2-4 години |
| **Pydantic** | ⭐⭐⭐⭐⭐ | Середня | Високий | 4-8 годин |
| **Redis** | ⭐⭐⭐⭐⭐ | Середня | Високий | 4-6 годин |
| **React Query v5** | ⭐⭐⭐⭐⭐ | Низька | Середній | 2-4 години |
| **Zod** | ⭐⭐⭐⭐⭐ | Низька | Високий | 2-4 години |
| **Celery** | ⭐⭐⭐⭐ | Висока | Високий | 8-12 годин |
| **Flask-SocketIO** | ⭐⭐⭐⭐ | Середня | Середній | 6-8 годин |
| **Docker** | ⭐⭐⭐⭐⭐ | Середня | Високий | 4-6 годин |
| **pytest** | ⭐⭐⭐⭐ | Низька | Середній | 4-6 годин |
| **Vitest** | ⭐⭐⭐⭐ | Низька | Середній | 2-4 години |
| **Error Boundaries** | ⭐⭐⭐⭐ | Низька | Середній | 2-3 години |
| **Code Splitting** | ⭐⭐⭐⭐ | Низька | Середній | 2-4 години |
| **Structured Logging** | ⭐⭐⭐⭐ | Низька | Середній | 2-3 години |
| **Sentry** | ⭐⭐⭐⭐ | Низька | Високий | 1-2 години |
| **Database Indexes** | ⭐⭐⭐⭐⭐ | Низька | Високий | 2-4 години |

---

## 🎯 План впровадження (пріоритети)

### Фаза 1: Критичні (1-2 тижні)
1. ✅ **Alembic** - міграції БД
2. ✅ **Database Indexes** - продуктивність
3. ✅ **Pydantic** - валідація API
4. ✅ **Redis** - кешування та rate limiting
5. ✅ **PostgreSQL-only** - видалити SQLite fallback

### Фаза 2: Важливі (2-3 тижні)
6. ✅ **React Query v5** - оновлення
7. ✅ **Zod** - валідація форм
8. ✅ **Celery** - асинхронні задачі
9. ✅ **Docker** - контейнеризація
10. ✅ **pytest** - тестування backend

### Фаза 3: Покращення (3-4 тижні)
11. ✅ **Flask-SocketIO** - real-time
12. ✅ **Error Boundaries** - graceful errors
13. ✅ **Code Splitting** - оптимізація bundle
14. ✅ **Structured Logging** - логування
15. ✅ **Sentry** - error tracking

### Фаза 4: Додаткові (опціонально)
16. ✅ **Vitest** - тестування frontend
17. ✅ **Playwright** - E2E тести
18. ✅ **Prometheus** - метрики
19. ✅ **Image optimization** - оптимізація зображень

---

## 📝 Додаткові рекомендації

### Code Quality
- **Black** для форматування Python коду
- **Prettier** для форматування TypeScript
- **mypy** для type checking Python
- **ESLint** вже є, продовжувати використовувати

### Documentation
- **Sphinx** для Python документації
- **TypeDoc** для TypeScript документації
- **API документація** через OpenAPI/Swagger

### Security
- **OWASP Top 10** перевірка
- **Dependency scanning** (safety, npm audit)
- **Secrets management** (не комітити .env)

---

## ✅ Висновок

**Топ-5 найважливіших технологій для реворку:**

1. **Alembic** - міграції БД (обов'язково)
2. **Pydantic** - валідація API (обов'язково)
3. **Redis** - кешування та продуктивність (обов'язково)
4. **Docker** - контейнеризація (обов'язково)
5. **React Query v5 + Zod** - покращення фронтенду (рекомендовано)

**Примітка:** g4f залишається без змін, як і було зазначено.

---

*Документ створено для реворку Freedom13. Оновлюйте за потреби.*
