# ✅ Фінальний Чеклист Freedom13

## 🔍 Перевірка перед запуском

### 1. Файли проекту
```bash
python CHECK_FILES.py
```

**Очікуваний результат:**
- ✅ Ruffle файли знайдені
- ✅ Ігри знайдені (4 SWF файли)
- ✅ Емоції Miku знайдені (A: 15 PNG, B: 9 JPG)
- ✅ Логотип знайдено

### 2. Налаштування .env
- [ ] Файл `.env` створено з `.env.example`
- [ ] `SECRET_KEY` та `JWT_SECRET_KEY` встановлені
- [ ] Для SQLite: `DB_PASSWORD` порожній
- [ ] Для PostgreSQL: дані БД вказані

### 3. Залежності
```bash
# Backend
pip install -r requirements.txt

# Frontend
cd client
npm install
cd ..
```

### 4. База даних
```bash
python INIT_DB.py
```

**Перевірка:**
- Таблиці створені
- Дефолтні дані додані
- MikuGPT користувач створений

---

## 🚀 Запуск

### Development
```bash
# Windows
FULL_START.bat

# Або вручну:
python run.py          # Terminal 1
cd client && npm run dev  # Terminal 2
```

### Production
```bash
cd client
npm run build
cd ..
python run.py
```

---

## ✅ Перевірка Доступу

### Статичні файли

1. **Ruffle:**
   - `http://localhost:5000/ruffle/ruffle.js` ✅
   - `http://localhost:5000/ruffle/*.wasm` ✅

2. **Ігри:**
   - `http://localhost:5000/games/Super_Drift3D.swf` ✅
   - `http://localhost:5000/games/earn_to_die.swf` ✅
   - `http://localhost:5000/games/hatsune_miku_wear.swf` ✅
   - `http://localhost:5000/games/bikini.swf` ✅

3. **MikuGPT Емоції:**
   - `http://localhost:5000/api/miku/emotion-image/A/happy_idle` ✅
   - `http://localhost:5000/api/miku/emotion-image/A/happy` ✅
   - `http://localhost:5000/api/miku/emotion-image/B/smileR_M` ✅
   - `http://localhost:5000/api/miku/emotion-image/A/embarrassed` ✅ (з пробілом!)

4. **Логотип:**
   - `http://localhost:5000/logo.png` ✅

### API Endpoints

1. **Health Check:**
   - `http://localhost:5000/api/health` ✅
   - Має повернути: `{"status": "ok", "database": "ok", ...}`

2. **MikuGPT:**
   - `http://localhost:5000/api/miku/profile` ✅
   - `http://localhost:5000/api/miku/emotions?set=A` ✅

3. **Flash Games:**
   - `http://localhost:5000/api/flash/games` ✅

---

## 🎮 Тестування Функцій

### Flash Ігри
1. Відкрити: `http://localhost:3000/flash`
2. Натиснути на гру
3. Перевірити консоль браузера (F12)
4. Гра має запуститися через Ruffle

**Якщо не працює:**
- Перевірте `ruffle/ruffle.js` доступний
- Перевірте `.wasm` файли доступні
- Перевірте MIME type для `.wasm` = `application/wasm`

### MikuGPT
1. Відкрити: `http://localhost:3000/miku`
2. Увійти в систему
3. Вибрати особистість та набір емоцій
4. Надіслати повідомлення
5. Перевірити що емоція відображається

**Якщо емоції не показуються:**
- Перевірте `MikuGPT_ver_1.0/emotions/A/` та `B/` існують
- Перевірте назви файлів (зокрема `embarrassed .png` з пробілом)
- Перевірте доступ через API: `/api/miku/emotion-image/A/happy_idle`

### Пости та Коментарі
1. Створити пост
2. Додати коментар
3. Перевірити nested comments
4. Перевірити лайки

### Галерея
1. Відкрити: `http://localhost:3000/gallery`
2. Перевірити Masonry layout
3. Перевірити фільтри по тегам
4. Перевірити NSFW фільтр

---

## 🗄️ База Даних

### SQLite (Development)
- Файл: `instance/freedom13.db`
- Створюється автоматично
- Не потребує налаштування

### PostgreSQL (Production)
- Створіть БД: `CREATE DATABASE freedom13;`
- Оновіть `.env` з даними підключення
- Запустіть `python INIT_DB.py`

---

## 📝 Створення Адміна

```python
python -c "
from app import create_app, db
from config import Config
from app.models.user import User
from app.utils.password import hash_password
import uuid

app = create_app(Config)
with app.app_context():
    admin = User(
        id=str(uuid.uuid4()),
        username='admin',
        email='admin@freedom13.com',
        password_hash=hash_password('admin_password'),
        status='admin'
    )
    db.session.add(admin)
    db.session.commit()
    print('Admin user created!')
"
```

---

## 🐛 Типові Проблеми

### "Database connection failed"
- Перевірте `.env` налаштування
- Для PostgreSQL: перевірте що сервіс запущений
- Для SQLite: перевірте права доступу до папки `instance/`

### "Ruffle не завантажується"
- Перевірте `ruffle/ruffle.js` існує
- Перевірте консоль браузера
- Перевірте MIME type для `.wasm`

### "Емоції Miku не показуються"
- Перевірте папки `MikuGPT_ver_1.0/emotions/A/` та `B/`
- Перевірте назви файлів (зокрема пробіл в `embarrassed .png`)
- Перевірте доступ через API

### "CORS error"
- Перевірте `CORS_ORIGINS` в `.env`
- Перевірте що фронтенд на правильному порту

---

## ✅ Готово!

Після успішного запуску:

- **Frontend:** http://localhost:3000 (dev) або http://localhost:5000 (prod)
- **API:** http://localhost:5000/api
- **Health:** http://localhost:5000/api/health

**Всі файли перевірені, доступ налаштований, БД ініціалізована! 🎉**
