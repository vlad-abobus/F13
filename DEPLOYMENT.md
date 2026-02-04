# 🚀 Інструкція з Деплою Freedom13

## 📋 Production Checklist

### Перед деплоєм:

- [ ] Змініть `SECRET_KEY` та `JWT_SECRET_KEY` в `.env`
- [ ] Використовуйте PostgreSQL (не SQLite!)
- [ ] Встановіть Redis для кешування
- [ ] Налаштуйте HTTPS
- [ ] Обмежте `CORS_ORIGINS`
- [ ] Змініть пароль MikuGPT користувача
- [ ] Налаштуйте регулярні бекапи БД

---

## 🐳 Docker Deployment

### Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Build frontend
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci && npm run build

WORKDIR /app

# Run
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "wsgi:app"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  backend:
    build: .
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      REDIS_HOST: redis
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
  redis_data:
```

---

## ☁️ Cloud Deployment

### Railway / Render / Fly.io

1. Підключіть PostgreSQL базу даних
2. Встановіть змінні середовища
3. Deploy через Git

### Vercel / Netlify (Frontend only)

1. Зібрати фронтенд: `cd client && npm run build`
2. Deploy `client/dist/` папку

---

## 🔒 Security

### Environment Variables

```env
# Production
FLASK_ENV=production
DEBUG=False
SECRET_KEY=<random-32-char-string>
JWT_SECRET_KEY=<random-32-char-string>
CORS_ORIGINS=https://yourdomain.com
```

### HTTPS

В `app/__init__.py`:
```python
Talisman(
    app,
    force_https=True,  # Enable for production
    ...
)
```

---

## 📊 Monitoring

- Health check: `/api/health`
- Logs: Перевіряйте логи сервера
- Database: Регулярні бекапи

---

**Детальна інструкція:** Див. `START_GUIDE.md`
