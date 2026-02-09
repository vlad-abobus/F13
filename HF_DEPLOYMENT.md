# Публікація Freedom13 на Hugging Face

## Варіанти публікації

### 1. Hugging Face Space (рекомендується для демо)
Для розгортання веб-додатка прямо на HF серверах.

### 2. Hugging Face Models
Для публікації готових моделей (якщо будуть).

### 3. Hugging Face Hub
Для публікації документації та кода.

---

## ✅ Варіант 1: Hugging Face Space

### Крок 1: Підготовка
```bash
# 1. Переконайтесь, що у вас є GitHub акаунт та Hugging Face акаунт
# https://huggingface.co/join

# 2. Встановіть huggingface-hub CLI
pip install huggingface-hub

# 3. Увійдіть
huggingface-cli login
# Введіть ваш HF токен (отримайте на https://huggingface.co/settings/tokens)
```

### Крок 2: Створіть новий Space вручну

1. Перейдіть на https://huggingface.co/spaces
2. Натисніть "Create new Space"
3. **Назва**: `freedom13` (або `your-username/freedom13`)
4. **Лікензія**: MIT або AGPL-3.0
5. **Тип**: "Docker" (оскільки ми маємо Dockerfile)
6. Натисніть "Create Space"

### Крок 3: Розгортання через Git

```bash
# В корні проекту:

# 1. Ініціалізуйте Git (якщо ще не зроблено)
git init
git add .
git commit -m "Initial commit for HF Space"

# 2. Додайте HF Space як remote
git remote add space https://huggingface.co/spaces/<your-username>/freedom13
# Замініть <your-username> на ваш HF username

# 3. Пушьте код
git push space main
# або main -> master залежно від бранчу
```

**HF Space автоматично:**
- Прочитає Dockerfile
- Побудує образ
- Розгорне на своїх серверах
- Дасть публічний URL

### Крок 4: Налаштування для HF Space

Створіть файл `.hf_space_config.yaml` в корені:
```yaml
title: "Freedom13 - Анонимная социальная сеть"
description: "Децентрализована соціальна мережа з MikuGPT"
tags:
  - social-network
  - decentralized
  - mikugpt
  - anonymous
thumbnail: "./logo.png"
emoji: "🔐"
colorFrom: "black"
colorTo: "gray"
```

### Крок 5: Оптимізація Dockerfile для HF

Створіть `Dockerfile.hf` (оптимізований для Space):

```dockerfile
# Використовуйте HF-based image
FROM nvidia/cuda:12.1.1-devel-ubuntu22.04

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Встановіть Python та залежності
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3-pip \
    nodejs \
    npm \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Копіюйте проект
COPY . .

# Встановіть Python залежності
RUN pip install --no-cache-dir -r requirements.txt

# Встановіть JS залежності та побудуйте клієнт
WORKDIR /app/client
RUN npm ci && npm run build

# Повертаємось до корня
WORKDIR /app

# Запустіть Gunicorn на порту 7860 (HF Space стандарт)
EXPOSE 7860

CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:7860", "wsgi:app"]
```

Відмbennєте `docker-compose.yml` у `Dockerfile` (без Redis/Postgres зовні):

```dockerfile
# Вбудуйте Redis у контейнер для простоти:
RUN apt-get install -y redis-server

# Запускайте Redis в фоні перед Gunicorn
CMD ["sh", "-c", "redis-server &  sleep 2 && gunicorn -w 2 -b 0.0.0.0:7860 wsgi:app"]
```

### Крок 6: Налаштування Secret Variables

На сторінці Space перейдіть в **Settings → Repository secrets**:

Додайте:
```
SECRET_KEY = your-super-secret-key
JWT_SECRET_KEY = your-jwt-secret
DATABASE_URL = sqlite:///./freedom13.db  (або PostgreSQL на зовніш. базі)
CLOUDINARY_URL = cloudinary://...
MAIL_SMTP_HOST = smtp.example.com
MAIL_SMTP_PORT = 587
ADMIN_NOTIFICATION_EMAILS = admin@example.com
```

### Крок 7: Моніторинг

```bash
# Дивіться логи:
# На сторінці Space → Logs

# Перезавантажте Space:
# Settings → Restart Space
```

---

## 📦 Варіант 2: Публікація Docker Image на HF Registry

```bash
# 1. Залогуйтесь в HF Registry
huggingface-cli login --token <YOUR_HF_TOKEN>

# 2. Побудуйте та залиште образ
docker build -t freedom13:latest .
docker tag freedom13:latest registry.huggingface.co/<username>/freedom13:latest
docker push registry.huggingface.co/<username>/freedom13:latest

# 3. Публікуйте Model Card (README.md в корені HF репо)
# Перейдіть на https://huggingface.co/models/<username>/freedom13
```

---

## 📚 Варіант 3: Публікація на HF Hub (як репозиторій коду)

```bash
# 1. Встановіть git-lfs для великих файлів
git lfs install

# 2. Клонуйте HF репо
git clone https://huggingface.co/<username>/freedom13
cd freedom13

# 3. Скопіюйте проект
cp -r ../F13/* .

# 4. Додайте Model Card
cat > README.md << 'EOF'
---
title: Freedom13
description: Anonymous Decentralized Social Network with MikuGPT
license: agpl-3.0
---

# Freedom13

## Overview
Freedom13 is an anonymous decentralized social network powered by MikuGPT.

## Features
- Anonymous posting
- MikuGPT-powered content moderation
- Real-time comments
- Emotion-based filtering
- CAPTCHA protection
- Dark mode interface

## Tech Stack
- Frontend: React, TypeScript, Tailwind CSS
- Backend: Flask, SQLAlchemy, PostgreSQL
- AI: MikuGPT, DuckDuckGo API

## Deployment
See [DEPLOYMENT.md](DEPLOYMENT.md) for setup instructions.

## License
AGPL-3.0
EOF

# 5. Пушьте
git add .
git commit -m "Publish on HF Hub"
git push origin main
```

---

## 🚀 Крок за кроком для Space (найлегше)

### Найшвидший варіант (5 хвилин):

1. **Буд репо на GitHub** (якщо ще немає):
   ```bash
   git init
   git remote add origin https://github.com/your-username/F13
   git push -u origin main
   ```

2. **Створіть Space на HF**:
   - https://huggingface.co/spaces?template=docker
   - Виберіть "Docker" темплейт
   - Назва: `freedom13`

3. **Замініть `.git` в HF Space**:
   ```bash
   cd ~/hf-space-clone
   git remote set-url origin https://huggingface.co/spaces/your-username/freedom13
   ```

4. **Скопіюйте файли проекту** в HF папку та пушьте:
   ```bash
   cp -r /path/to/F13/* .
   git add .
   git commit -m "Initial deployment"
   git push origin main
   ```

5. **Відсліджуйте розгортання** на https://huggingface.co/spaces/your-username/freedom13

---

## ⚠️ Основні проблеми та рішення

### Проблема 1: Port занятий
**Рішення**: HF Space очікує port `7860`. Переконайтесь у Dockerfile:
```dockerfile
EXPOSE 7860
CMD ["gunicorn", "-b", "0.0.0.0:7860", "wsgi:app"]
```

### Проблема 2: Недостатньо памяті
**Рішення**: 
- Оберігайте Redis в пам'яті (не на диску)
- Використовуйте меншу кількість воркерів: `-w 1`
- Складіть client на локалі перед пушем

### Проблема 3: База даних
**Рішення**:
- Використовуйте SQLite в Space для простоти
- Або підключіть PostgreSQL від `railway.app` або `supabase.com`

### Проблема 4: Статичні файли не завантажуються
**Рішення**: Переконайтесь що клієнт збудований у `client/dist`:
```bash
cd client && npm run build
git add client/dist
```

---

## 📋 Чеклист перед публікацією

- [ ] Всі섯 змінні оточення налаштовані
- [ ] `client/dist/` побудований та додан до git
- [ ] `Dockerfile` оптимізований для HF (port 7860)
- [ ] `DEPLOYMENT.md` актуальний
- [ ] `README.md` містить опис та приклади
- [ ] Logo `logo.png` присутній в корені
- [ ] `.gitignore` правильно налаштований
- [ ] Telegram токени та API ключі в `.env` (не в коді)
- [ ] Пройшов локальний тест: `docker-compose up`

---

## 🔗 Корисні посилання

- **HF Docs**: https://huggingface.co/docs/hub/spaces
- **Docker Spaces**: https://huggingface.co/docs/hub/spaces-run-docker
- **Моделі**: https://huggingface.co/models
- **Datasets**: https://huggingface.co/datasets
- **Create Space**: https://huggingface.co/spaces

---

## 💡 Пітримко для демо

Якщо хочете показати Demo на HF, обмежте функціональні:
- Вимкніть реальні відправки email
- Обмежте збереження в БД (очистите старі записи щодня)
- Встановіть публічне читання (без реєстрації) для гостей

