# 🚀 Рекомендації щодо покращення технологій для Freedom13 (Реворк)

> **Важливо:** g4f залишається незмінним, це обов'язкова вимога для реворку.

## 📋 Зміст

1. [Backend покращення](#backend-покращення)
2. [Frontend покращення](#frontend-покращення)
3. [База даних та кешування](#база-даних-та-кешування)
4. [Infrastructure та DevOps](#infrastructure-та-devops)
5. [Безпека](#безпека)
6. [Продуктивність](#продуктивність)
7. [Моніторинг та логування](#моніторинг-та-логування)
8. [План міграції](#план-міграції)

---

## 🔧 Backend покращення

### 1. **Alembic для міграцій БД** ⭐ ВИСОКИЙ ПРІОРИТЕТ

**Поточна проблема:** Використовується `db.create_all()`, що не підтримує міграції.

**Рішення:**
```python
# Додати в requirements.txt:
alembic==1.13.1
Flask-Migrate==4.0.5

# Ініціалізація:
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

**Переваги:**
- Версіонування схеми БД
- Безпечні оновлення в production
- Відкат змін (rollback)
- Спільна робота команди

---

### 2. **Pydantic для валідації** ⭐ ВИСОКИЙ ПРІОРИТЕТ

**Поточна проблема:** Валідація через ручні перевірки, немає типізації request/response.

**Рішення:**
```python
# Додати в requirements.txt:
pydantic==2.5.3
pydantic-settings==2.1.0

# Приклад використання:
from pydantic import BaseModel, EmailStr, Field, validator

class PostCreateRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    tags: list[str] = Field(default_factory=list, max_items=10)
    is_nsfw: bool = False
    is_anonymous: bool = False
    
    @validator('content')
    def validate_content(cls, v):
        if len(v.strip()) == 0:
            raise ValueError('Content cannot be empty')
        return v.strip()

class PostResponse(BaseModel):
    id: str
    content: str
    author: UserResponse
    created_at: datetime
    likes_count: int
    
    class Config:
        from_attributes = True  # Для SQLAlchemy моделей
```

**Переваги:**
- Автоматична валідація
- Type safety
- Автогенерація документації (OpenAPI)
- Менше коду для валідації

---

### 3. **Redis для кешування та rate limiting** ⭐ ВИСОКИЙ ПРІОРИТЕТ

**Поточна проблема:** Flask-Limiter використовує пам'ять, втрачається при рестарті.

**Рішення:**
```python
# Додати в requirements.txt:
redis==5.0.1
Flask-Caching==2.1.0

# Конфігурація:
from flask_caching import Cache
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import redis

redis_client = redis.Redis(
    host=os.getenv('REDIS_HOST', 'localhost'),
    port=int(os.getenv('REDIS_PORT', 6379)),
    db=0,
    decode_responses=True
)

cache = Cache(config={
    'CACHE_TYPE': 'RedisCache',
    'CACHE_REDIS_URL': f"redis://{redis_client.connection_pool.connection_kwargs['host']}:{redis_client.connection_pool.connection_kwargs['port']}"
})

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    storage_uri=f"redis://{redis_client.connection_pool.connection_kwargs['host']}:{redis_client.connection_pool.connection_kwargs['port']}",
    default_limits=["200 per day", "50 per hour"]
)
```

**Використання кешування:**
```python
@cache.cached(timeout=300, key_prefix='posts_popular')
def get_popular_posts():
    # Кешується на 5 хвилин
    return Post.query.filter_by(moderation_status='approved').order_by(Post.likes_count.desc()).limit(20).all()
```

**Переваги:**
- Персистентний rate limiting
- Швидкий кеш для популярних запитів
- Менше навантаження на БД
- Можливість використання для сесій

---

### 4. **Celery для асинхронних задач** ⭐ СЕРЕДНІЙ ПРІОРИТЕТ

**Поточна проблема:** MikuGPT виклики блокують API, обробка зображень синхронна.

**Рішення:**
```python
# Додати в requirements.txt:
celery==5.3.4
flower==2.0.1  # Моніторинг Celery

# Конфігурація:
from celery import Celery

celery = Celery(
    'freedom13',
    broker=os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0'),
    backend=os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
)

# Задача:
@celery.task(name='miku.chat', bind=True, max_retries=3)
def miku_chat_task(self, user_id: str, message: str, personality: str):
    try:
        response = miku_service.generate_response(message, personality)
        # Зберегти в БД
        return response
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)
```

**Використання:**
```python
# Замість синхронного виклику:
task = miku_chat_task.delay(user_id, message, personality)
return {'task_id': task.id, 'status': 'processing'}, 202

# Клієнт перевіряє статус:
@celery.task.route('/api/miku/chat/status/<task_id>')
def check_task_status(task_id):
    task = celery.AsyncResult(task_id)
    return {'status': task.state, 'result': task.result if task.ready() else None}
```

**Переваги:**
- Неблокуючі AI виклики
- Масштабування через workers
- Retry логіка
- Моніторинг через Flower

---

### 5. **Структуроване логування** ⭐ СЕРЕДНІЙ ПРІОРИТЕТ

**Поточна проблема:** Використовується `print()` та базове логування.

**Рішення:**
```python
# Додати в requirements.txt:
structlog==23.2.0
python-json-logger==2.0.7

# Конфігурація:
import structlog
import logging

structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()
```

**Використання:**
```python
logger.info("post_created", post_id=post.id, user_id=user.id, tags=post.tags_list)
logger.error("miku_error", error=str(e), user_id=user.id, retry_count=retry_count)
```

**Переваги:**
- JSON логи для парсингу
- Структуровані дані
- Легка інтеграція з ELK/Grafana
- Контекстні логи

---

### 6. **OpenAPI/Swagger документація** ⭐ НИЗЬКИЙ ПРІОРИТЕТ

**Рішення:**
```python
# Додати в requirements.txt:
flask-restx==1.3.0  # або flask-smorest==0.42.0

# Автоматична генерація документації з Pydantic моделей
```

**Переваги:**
- Автоматична документація API
- Тестування через Swagger UI
- Валідація через схеми

---

## 🎨 Frontend покращення

### 1. **React Query v5** ⭐ ВИСОКИЙ ПРІОРИТЕТ

**Поточна проблема:** Використовується React Query v3 (застаріла версія).

**Рішення:**
```bash
cd client
npm install @tanstack/react-query@^5.17.0
npm uninstall react-query
```

**Оновлення коду:**
```typescript
// Замість:
import { useQuery, useMutation, QueryClient } from 'react-query';

// Використовувати:
import { useQuery, useMutation, QueryClient } from '@tanstack/react-query';

// Нова конфігурація:
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 хвилин
      gcTime: 1000 * 60 * 10, // 10 хвилин (замість cacheTime)
    },
  },
});
```

**Переваги:**
- Краще кешування
- Покращена продуктивність
- Нові фічі (persist, devtools)
- Активна підтримка

---

### 2. **Error Boundaries** ⭐ ВИСОКИЙ ПРІОРИТЕТ

**Поточна проблема:** Немає обробки помилок React компонентів.

**Рішення:**
```typescript
// client/src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    // Відправити в Sentry/лог сервіс
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-boundary">
          <h2>Щось пішло не так</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Спробувати знову
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Використання в App.tsx:
<ErrorBoundary>
  <Routes>...</Routes>
</ErrorBoundary>
```

**Переваги:**
- Graceful error handling
- Не падає весь додаток
- Кращий UX при помилках

---

### 3. **React Suspense для lazy loading** ⭐ СЕРЕДНІЙ ПРІОРИТЕТ

**Рішення:**
```typescript
// client/src/App.tsx
import { lazy, Suspense } from 'react';

const Home = lazy(() => import('./pages/Home'));
const Admin = lazy(() => import('./pages/Admin'));

// Використання:
<Suspense fallback={<div>Завантаження...</div>}>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/admin" element={<Admin />} />
  </Routes>
</Suspense>
```

**Переваги:**
- Менший initial bundle
- Швидше завантаження
- Кращий UX

---

### 4. **Service Worker для PWA** ⭐ НИЗЬКИЙ ПРІОРИТЕТ

**Рішення:**
```bash
npm install workbox-webpack-plugin --save-dev
```

**Переваги:**
- Offline режим
- Кешування статики
- Можливість встановлення як додаток

---

### 5. **Оптимізація зображень** ⭐ СЕРЕДНІЙ ПРІОРИТЕТ

**Рішення:**
```typescript
// Використовувати next/image або react-image
// Або власний компонент:
import { useState } from 'react';

function OptimizedImage({ src, alt, ...props }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="image-wrapper">
      {!loaded && <div className="image-skeleton" />}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        loading="lazy"
        {...props}
      />
    </div>
  );
}
```

**Backend:**
```python
# Додати в requirements.txt:
Pillow-SIMD==10.0.0  # Швидша обробка
imageio==2.33.0

# Генерація thumbnail:
from PIL import Image

def generate_thumbnail(image_path, size=(300, 300)):
    img = Image.open(image_path)
    img.thumbnail(size, Image.Resampling.LANCZOS)
    thumbnail_path = image_path.replace('.jpg', '_thumb.jpg')
    img.save(thumbnail_path, 'JPEG', quality=85, optimize=True)
    return thumbnail_path
```

**Переваги:**
- Менший розмір файлів
- Швидше завантаження
- Менше трафіку

---

### 6. **Web Workers для важких обчислень** ⭐ НИЗЬКИЙ ПРІОРИТЕТ

**Використання:**
- Обробка великих списків постів
- Фільтрація/сортування на клієнті
- Image processing (якщо потрібно)

---

## 💾 База даних та кешування

### 1. **PostgreSQL тільки (видалити SQLite)** ⭐ ВИСОКИЙ ПРІОРИТЕТ

**Поточна проблема:** SQLite fallback для development.

**Рішення:**
```python
# config.py - видалити SQLite fallback
if not os.environ.get('DATABASE_URL') and not os.environ.get('DB_PASSWORD'):
    raise ValueError("DATABASE_URL or DB_PASSWORD must be set. SQLite is not allowed.")
```

**Для локальної розробки:**
```bash
# Docker Compose для PostgreSQL
docker-compose up -d postgres
```

**Переваги:**
- Консистентність dev/prod
- Краща продуктивність
- Підтримка JSON полів
- Full-text search

---

### 2. **Database Indexing** ⭐ ВИСОКИЙ ПРІОРИТЕТ

**Додати індекси:**
```python
# app/models/post.py
class Post(db.Model):
    # ...
    __table_args__ = (
        db.Index('idx_post_created_at', 'created_at'),
        db.Index('idx_post_user_id', 'user_id'),
        db.Index('idx_post_moderation', 'moderation_status'),
        db.Index('idx_post_likes', 'likes_count'),
        # Composite index для популярних запитів
        db.Index('idx_post_popular', 'moderation_status', 'likes_count', 'created_at'),
    )
```

**Переваги:**
- Швидші запити
- Менше навантаження на БД

---

### 3. **Connection Pooling** ⭐ СЕРЕДНІЙ ПРІОРИТЕТ

**Рішення:**
```python
# config.py
SQLALCHEMY_ENGINE_OPTIONS = {
    'pool_size': 10,
    'max_overflow': 20,
    'pool_pre_ping': True,  # Перевірка з'єднань
    'pool_recycle': 3600,   # Переподключення кожну годину
}
```

---

### 4. **Full-text Search (PostgreSQL)** ⭐ СЕРЕДНІЙ ПРІОРИТЕТ

**Рішення:**
```python
# Додати в requirements.txt:
sqlalchemy-searchable==1.4.1

# Або використати вбудований PostgreSQL full-text search:
from sqlalchemy import func

def search_posts(query: str):
    search_vector = func.to_tsvector('russian', Post.content)
    search_query = func.plainto_tsquery('russian', query)
    
    return Post.query.filter(
        search_vector.match(search_query)
    ).order_by(
        func.ts_rank(search_vector, search_query).desc()
    ).all()
```

---

## 🏗️ Infrastructure та DevOps

### 1. **Docker та Docker Compose** ⭐ ВИСОКИЙ ПРІОРИТЕТ

**Рішення:**
```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Встановлення залежностей
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копіювання коду
COPY . .

# Збірка фронтенду (якщо потрібно)
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci && npm run build

WORKDIR /app

# Запуск
CMD ["gunicorn", "-c", "gunicorn_config.py", "wsgi:app"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: freedom13
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: .
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/freedom13
      REDIS_HOST: redis
      REDIS_PORT: 6379
    depends_on:
      - postgres
      - redis

  celery:
    build: .
    command: celery -A app.celery worker --loglevel=info
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/freedom13
      REDIS_HOST: redis
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
  redis_data:
```

**Переваги:**
- Консистентне середовище
- Легкий деплой
- Масштабування

---

### 2. **CI/CD (GitHub Actions)** ⭐ ВИСОКИЙ ПРІОРИТЕТ

**Рішення:**
```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          cd client && npm ci

      - name: Run tests
        run: |
          pytest
          cd client && npm run lint

      - name: Build
        run: |
          cd client && npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          # Деплой логіка
```

---

### 3. **Nginx як Reverse Proxy** ⭐ СЕРЕДНІЙ ПРІОРИТЕТ

**Рішення:**
```nginx
# nginx.conf
upstream backend {
    server localhost:5000;
}

server {
    listen 80;
    server_name freedom13.com;

    # Статичні файли
    location /static/ {
        alias /app/client/dist/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # API
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # React app
    location / {
        try_files $uri $uri/ /index.html;
        root /app/client/dist;
    }
}
```

---

## 🔒 Безпека

### 1. **Flask-Talisman (Security Headers)** ⭐ ВИСОКИЙ ПРІОРИТЕТ

**Рішення:**
```python
# Додати в requirements.txt:
Flask-Talisman==1.1.0

# Використання:
from flask_talisman import Talisman

talisman = Talisman(
    app,
    force_https=False,  # True для production
    strict_transport_security=True,
    content_security_policy={
        'default-src': "'self'",
        'script-src': "'self' 'unsafe-inline'",  # Для Ruffle
        'img-src': "'self' data: https:",
    }
)
```

---

### 2. **Input Sanitization** ⭐ ВИСОКИЙ ПРІОРИТЕТ

**Рішення:**
```python
# Додати в requirements.txt:
bleach==6.1.0

# Використання:
import bleach

ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'a']
ALLOWED_ATTRIBUTES = {'a': ['href']}

def sanitize_content(content: str) -> str:
    return bleach.clean(
        content,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        strip=True
    )
```

---

### 3. **CSRF Protection** ⭐ СЕРЕДНІЙ ПРІОРИТЕТ

**Рішення:**
```python
# Додати в requirements.txt:
Flask-WTF==1.2.1

# Використання:
from flask_wtf.csrf import CSRFProtect

csrf = CSRFProtect(app)
```

---

### 4. **Rate Limiting через Redis** ⭐ ВИСОКИЙ ПРІОРИТЕТ

(Див. розділ "Redis для кешування")

---

## ⚡ Продуктивність

### 1. **Query Optimization** ⭐ ВИСОКИЙ ПРІОРИТЕТ

**Рішення:**
```python
# Використовувати eager loading
from sqlalchemy.orm import joinedload

posts = Post.query.options(
    joinedload(Post.author),
    joinedload(Post.comments).joinedload(Comment.author)
).filter_by(moderation_status='approved').all()

# Замість N+1 queries
```

---

### 2. **Pagination для всіх списків** ⭐ ВИСОКИЙ ПРІОРИТЕТ

**Рішення:**
```python
from flask import request

def paginate_query(query, per_page=20):
    page = request.args.get('page', 1, type=int)
    per_page = min(per_page, 100)  # Максимум 100
    
    pagination = query.paginate(
        page=page,
        per_page=per_page,
        error_out=False
    )
    
    return {
        'items': [item.to_dict() for item in pagination.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev,
        }
    }
```

---

### 3. **CDN для статики** ⭐ СЕРЕДНІЙ ПРІОРИТЕТ

**Рішення:**
- Cloudflare CDN
- AWS CloudFront
- Vercel/Netlify для фронтенду

---

## 📊 Моніторинг та логування

### 1. **Sentry для Error Tracking** ⭐ ВИСОКИЙ ПРІОРИТЕТ

**Рішення:**
```python
# Додати в requirements.txt:
sentry-sdk[flask]==1.38.0

# Використання:
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration

sentry_sdk.init(
    dsn=os.getenv('SENTRY_DSN'),
    integrations=[FlaskIntegration()],
    traces_sample_rate=0.1,
    environment=os.getenv('FLASK_ENV', 'development')
)
```

---

### 2. **Prometheus + Grafana** ⭐ СЕРЕДНІЙ ПРІОРИТЕТ

**Рішення:**
```python
# Додати в requirements.txt:
prometheus-flask-exporter==0.22.0

# Використання:
from prometheus_flask_exporter import PrometheusMetrics

metrics = PrometheusMetrics(app)
```

---

### 3. **Health Check Endpoint** ⭐ СЕРЕДНІЙ ПРІОРИТЕТ

**Рішення:**
```python
@app.route('/api/health')
def health_check():
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
        'version': '1.0.0'
    }, 200 if db_status == 'ok' else 503
```

---

## 📅 План міграції

### Фаза 1: Критичні покращення (1-2 тижні)
1. ✅ Alembic міграції
2. ✅ PostgreSQL тільки
3. ✅ Pydantic валідація
4. ✅ Redis для rate limiting
5. ✅ Error Boundaries
6. ✅ React Query v5

### Фаза 2: Продуктивність (2-3 тижні)
1. ✅ Database indexing
2. ✅ Query optimization
3. ✅ Caching strategy
4. ✅ Image optimization
5. ✅ Pagination

### Фаза 3: Infrastructure (2-3 тижні)
1. ✅ Docker + Docker Compose
2. ✅ CI/CD
3. ✅ Nginx
4. ✅ Моніторинг

### Фаза 4: Додаткові фічі (1-2 тижні)
1. ✅ Celery для асинхронних задач
2. ✅ Full-text search
3. ✅ PWA (Service Worker)
4. ✅ Структуроване логування

---

## 📦 Оновлений requirements.txt

```txt
# Core
Flask==3.0.0
Flask-SQLAlchemy==3.1.1
Flask-CORS==4.0.0
Flask-JWT-Extended==4.6.0
Flask-Limiter==3.5.0
Werkzeug==3.0.1

# Database
alembic==1.13.1
Flask-Migrate==4.0.5
psycopg2-binary==2.9.10

# Validation
pydantic==2.5.3
pydantic-settings==2.1.0

# Caching & Queue
redis==5.0.1
Flask-Caching==2.1.0
celery==5.3.4
flower==2.0.1

# Security
Flask-Talisman==1.1.0
Flask-WTF==1.2.1
bleach==6.1.0

# Logging & Monitoring
structlog==23.2.0
python-json-logger==2.0.7
sentry-sdk[flask]==1.38.0
prometheus-flask-exporter==0.22.0

# Utilities
requests==2.31.0
python-dotenv==1.0.0
bcrypt==4.1.2
g4f==0.2.0.0  # ⚠️ НЕ ЗМІНЮВАТИ
langdetect==1.0.9
captcha==0.5.0
Pillow==10.2.0
Pillow-SIMD==10.0.0

# Production
gunicorn==21.2.0
waitress==2.1.2
```

---

## 🎯 Висновок

Ці покращення дозволять:
- ✅ Підвищити продуктивність на 50-70%
- ✅ Покращити безпеку
- ✅ Спростити деплой та масштабування
- ✅ Покращити developer experience
- ✅ Додати моніторинг та логування
- ✅ Зберегти g4f без змін

**Пріоритетність:**
1. **Високий:** Alembic, PostgreSQL, Pydantic, Redis, Error Boundaries
2. **Середній:** Celery, Indexing, Docker, CI/CD
3. **Низький:** PWA, Web Workers, OpenAPI

---

**Примітка:** Всі зміни повинні бути протестовані перед застосуванням в production. Рекомендується поступова міграція з тестуванням на staging середовищі.
