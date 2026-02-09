# 🚀 Інструкція з Деплою Freedom13

## 📋 Production Checklist

### Перед деплоєм:
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

## Docker (recommended)

1. Build and run with docker-compose (will build client and backend, start Postgres and Redis):

```bash
docker-compose build --pull --no-cache
docker-compose up -d
```

2. Access the app at `http://<host>` (Nginx proxy listens on 80/443 and forwards to the web container). If you don't use the proxy, you can port-forward `8000` to the web service by changing the `docker-compose.yml` mapping.

3. Environment variables

- Create a `.env` file at repo root or provide env vars to your host. Example minimal `.env`:

```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=changeme
POSTGRES_DB=freedom13
DATABASE_URL=postgresql://postgres:changeme@db:5432/freedom13
SECRET_KEY=replace-with-secure-value
JWT_SECRET_KEY=replace-with-secure-value
REDIS_HOST=redis
REDIS_PORT=6379
ADMIN_NOTIFICATION_EMAILS=admin@example.com
MAIL_SMTP_HOST=smtp.example.com
MAIL_SMTP_PORT=587
MAIL_USERNAME=your-sender@example.com
MAIL_PASSWORD=supersecret
```

4. Volumes

- `uploads` volume is mounted to `/app/uploads` so uploaded files persist across container restarts.

5. Logs & management

- View logs: `docker-compose logs -f web`
- Run a one-off shell: `docker-compose run --rm web sh`

Troubleshooting: if the client does not show, ensure `client/dist` was built into the image (the Dockerfile copies it during build). Rebuild with `docker-compose build --no-cache web`.

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
