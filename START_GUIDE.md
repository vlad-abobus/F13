# 🚀 Повна Інструкція з Запуску F13

## 📋 Передумови

### Необхідне програмне забезпечення:

1. **Python 3.11+**
   - Завантажити з [python.org](https://www.python.org/downloads/)
   - Перевірити: `python --version`

2. **Node.js 18+ та npm**
   - Завантажити з [nodejs.org](https://nodejs.org/)
   - Перевірити: `node --version` та `npm --version`

3. **PostgreSQL** (рекомендовано для production) або **SQLite** (для development)
   - PostgreSQL: [postgresql.org](https://www.postgresql.org/download/)
   - SQLite: входить в Python

4. **Redis** (опціонально, для кешування та rate limiting)
   - Windows: [Redis for Windows](https://github.com/microsoftarchive/redis/releases)
   - Linux/Mac: `sudo apt-get install redis-server` або `brew install redis`

---

## 🔧 Крок 1: Клонування та Налаштування

### 1.1 Перевірка структури проекту

Переконайтеся, що у вас є такі папки та файли:

```
F13R/
├── app/                    # Flask backend
├── client/                 # React frontend
├── ruffle/                 # Ruffle Flash плеєр (має містити ruffle.js та .wasm файли)
├── games/                  # SWF файли ігор
│   ├── Super_Drift3D.swf
│   ├── earn_to_die.swf
│   ├── hatsune_miku_wear.swf
│   └── bikini.swf
├── MikuGPT_ver_1.0/       # MikuGPT AI
│   ├── main.py
│   └── emotions/           # Зображення емоцій
│       ├── A/              # PNG файли
│       └── B/              # JPG файли
├── logo.png                # Логотип проекту
├── config.py
├── run.py
├── requirements.txt
└── .env.example
```

### 1.2 Створення .env файлу

Створіть файл `.env` в корені проекту (скопіюйте з `.env.example`):

```env
# ============================================
# DATABASE CONFIGURATION
# ============================================
# Для SQLite (development) - залиште DB_PASSWORD порожнім
# Для PostgreSQL (production) - вкажіть дані

# PostgreSQL (production)
DB_USER=postgres
DB_PASSWORD=your_secure_password_here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=freedom13

# Або використайте готовий DATABASE_URL
# DATABASE_URL=postgresql://user:password@localhost:5432/freedom13

# ============================================
# SECURITY KEYS
# ============================================
# ⚠️ ОБОВ'ЯЗКОВО ЗМІНІТЬ В PRODUCTION!
SECRET_KEY=change-this-to-random-secret-key-in-production
JWT_SECRET_KEY=change-this-to-random-jwt-secret-in-production

# ============================================
# SERVER CONFIGURATION
# ============================================
FLASK_ENV=development
DEBUG=True
PORT=5000
HOST=127.0.0.1

# ============================================
# CORS CONFIGURATION
# ============================================
# Дозволені джерела для CORS (через кому для кількох)
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# ============================================
# FILE UPLOAD
# ============================================
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# ============================================
# MIKUGPT CONFIGURATION
# ============================================
MIKUGPT_PYTHON_PATH=python
MIKUGPT_SCRIPT_PATH=./MikuGPT_ver_1.0/main.py

# ============================================
# REDIS CONFIGURATION (опціонально)
# ============================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Якщо Redis недоступний, rate limiting працюватиме в пам'яті
```

---

## 🗄️ Крок 2: Налаштування Бази Даних

### Варіант A: SQLite (Development - найпростіше)

**Якщо не вказати `DB_PASSWORD` в `.env`, автоматично використається SQLite.**

База даних створиться автоматично в `instance/freedom13.db` при першому запуску.

### Варіант B: PostgreSQL (Production)

1. **Встановіть PostgreSQL** (якщо ще не встановлено)

2. **Створіть базу даних:**
   ```sql
   CREATE DATABASE freedom13;
   CREATE USER freedom13_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE freedom13 TO freedom13_user;
   ```

3. **Оновіть `.env`:**
   ```env
   DB_USER=freedom13_user
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=freedom13
   ```

---

## 📦 Крок 3: Встановлення Залежностей

### 3.1 Backend (Python)

```bash
# Створіть віртуальне середовище (рекомендовано)
python -m venv venv

# Активуйте віртуальне середовище
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Встановіть залежності
pip install -r requirements.txt

# Примітка: Якщо виникає помилка з pydantic (потребує Rust),
# це нормально - pydantic опціональний і не використовується в коді.
# Для встановлення pydantic спочатку встановіть Rust: https://rustup.rs/
# Потім: pip install -r requirements-optional.txt
```

### 3.2 Frontend (Node.js)

```bash
cd client
npm install
cd ..
```

---

## 🗃️ Крок 4: Ініціалізація Бази Даних

База даних ініціалізується автоматично при першому запуску через `init_db()`.

**Або вручну:**

```bash
python -c "from app import create_app; from config import Config; app = create_app(Config); app.app_context().push(); from app.database import init_db; init_db(); print('Database initialized!')"
```

**Що створюється:**
- Всі таблиці БД
- Дефолтні бейджі
- Дефолтні правила GoonZone
- Дефолтні Flash ігри
- Користувач MikuGPT

---

## 🚀 Крок 5: Запуск Проекту

### Варіант A: Development (окремо Backend + Frontend)

**Terminal 1 - Flask Backend:**
```bash
python run.py
```
Backend буде доступний на: `http://127.0.0.1:5000`

**Terminal 2 - React Frontend:**
```bash
cd client
npm run dev
```
Frontend буде доступний на: `http://localhost:3000`

### Варіант B: Production (об'єднаний режим)

**1. Спочатку зібрати фронтенд:**
```bash
cd client
npm run build
cd ..
```

**2. Запустити Flask:**
```bash
python run.py
```

Flask автоматично обслуговуватиме зібраний React з `client/dist/`

---

## ✅ Крок 6: Перевірка Роботи

### 6.1 Health Check

Відкрийте в браузері: `http://localhost:5000/api/health`

Очікувана відповідь:
```json
{
  "status": "ok",
  "database": "ok",
  "redis": "ok" or "unavailable",
  "version": "1.0.0"
}
```

### 6.2 Перевірка статичних файлів

- **Ruffle:** `http://localhost:5000/ruffle/ruffle.js` - має завантажитися
- **Логотип:** `http://localhost:5000/logo.png` - має відобразитися
- **Емоції Miku:** `http://localhost:5000/api/miku/emotion-image/A/happy_idle` - має відобразитися зображення
- **Ігри:** `http://localhost:5000/games/Super_Drift3D.swf` - має завантажитися

### 6.3 Перевірка Frontend

Відкрийте: `http://localhost:3000` (development) або `http://localhost:5000` (production)

---

## 🔍 Перевірка Доступу до Файлів

### Ruffle Flash Плеєр

**Файли повинні бути в `ruffle/`:**
- `ruffle.js`
- `ruffle.js.map`
- `*.wasm` файли (наприклад, `838b8fc87121998f05cb.wasm`)

**Доступ через:**
- `/ruffle/ruffle.js`
- `/ruffle/*.wasm`

### Flash Ігри

**Файли повинні бути в `games/`:**
- `Super_Drift3D.swf`
- `earn_to_die.swf`
- `hatsune_miku_wear.swf`
- `bikini.swf`

**Доступ через:**
- `/games/Super_Drift3D.swf`
- `/games/earn_to_die.swf`
- тощо

### MikuGPT Емоції

**Структура:**
```
MikuGPT_ver_1.0/emotions/
├── A/                    # PNG файли
│   ├── happy_idle.png
│   ├── happy.png
│   ├── angry_look.png
│   ├── embarrassed .png   # (з пробілом!)
│   └── ...
└── B/                    # JPG файли
    ├── smileR_M.jpg
    ├── angryM.jpg
    └── ...
```

**Доступ через API:**
- `/api/miku/emotion-image/A/happy_idle` → `MikuGPT_ver_1.0/emotions/A/happy_idle.png`
- `/api/miku/emotion-image/B/smileR_M` → `MikuGPT_ver_1.0/emotions/B/smileR_M.jpg`

**Важливо:** Файл `embarrassed .png` має пробіл в назві!

### Логотип

**Файл:** `logo.png` в корені проекту

**Доступ через:**
- `/logo.png`

---

## 🐛 Вирішення Проблем

### Проблема: "Database connection failed"

**Рішення:**
1. Перевірте налаштування в `.env`
2. Для PostgreSQL: переконайтеся що сервіс запущений
3. Для SQLite: переконайтеся що папка `instance/` існує (створиться автоматично)

### Проблема: "Ruffle не завантажується"

**Рішення:**
1. Перевірте що файли в `ruffle/` існують
2. Перевірте консоль браузера на помилки
3. Перевірте що MIME type для `.wasm` правильний (application/wasm)

### Проблема: "Емоції Miku не відображаються"

**Рішення:**
1. Перевірте що папка `MikuGPT_ver_1.0/emotions/A/` та `B/` існують
2. Перевірте назви файлів (зокрема `embarrassed .png` з пробілом)
3. Перевірте доступ через: `http://localhost:5000/api/miku/emotion-image/A/happy_idle`

### Проблема: "CORS error"

**Рішення:**
1. Перевірте `CORS_ORIGINS` в `.env`
2. Переконайтеся що фронтенд працює на правильному порту
3. Для development: `CORS_ORIGINS=http://localhost:3000`

### Проблема: "Redis connection failed"

**Рішення:**
- Redis опціональний! Якщо не встановлений, rate limiting працюватиме в пам'яті
- Для production рекомендується встановити Redis

---

## 📝 Створення Першого Користувача

Після запуску, створіть користувача через реєстрацію:

1. Відкрийте: `http://localhost:3000/register`
2. Заповніть форму
3. Після реєстрації ви автоматично увійдете

**Для створення адміна:**

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

## 🎮 Тестування Flash Ігор

1. Відкрийте: `http://localhost:3000/flash`
2. Натисніть на гру
3. Перевірте що Ruffle завантажився (консоль браузера)
4. Гра має запуститися

**Якщо гра не запускається:**
- Перевірте консоль браузера
- Перевірте що SWF файл доступний: `http://localhost:5000/games/Super_Drift3D.swf`
- Перевірте що Ruffle завантажився: `http://localhost:5000/ruffle/ruffle.js`

---

## 🤖 Тестування MikuGPT

1. Відкрийте: `http://localhost:3000/miku`
2. Увійдіть в систему (потрібна авторизація)
3. Виберіть особистість та набір емоцій
4. Надішліть повідомлення
5. Перевірте що емоція відображається

**Перевірка емоцій:**
- `/api/miku/emotion-image/A/happy_idle` - має показати зображення
- `/api/miku/emotion-image/B/smileR_M` - має показати зображення

---

## 📊 Структура БД

База даних створюється автоматично з такими таблицями:

- `users` - користувачі
- `posts` - пости
- `comments` - коментарі
- `badges` - бейджі
- `user_badges` - бейджі користувачів
- `flash_games` - Flash ігри
- `goonzone_polls` - опитування
- `goonzone_news` - новини
- `goonzone_rules` - правила
- `gallery` - галерея зображень
- `miku_interactions` - взаємодії з MikuGPT
- `follows` - підписки
- `collections` - колекції
- `reports` - скарги
- `admin_logs` - логи адмінів
- `quotes` - цитати

---

## 🔒 Безпека

### Production Checklist:

- [ ] Змініть `SECRET_KEY` та `JWT_SECRET_KEY` в `.env`
- [ ] Використовуйте PostgreSQL замість SQLite
- [ ] Встановіть Redis для rate limiting
- [ ] Налаштуйте HTTPS (Talisman `force_https=True`)
- [ ] Обмежте `CORS_ORIGINS` тільки до ваших доменів
- [ ] Змініть пароль MikuGPT користувача
- [ ] Налаштуйте регулярні бекапи БД

---

## 📞 Підтримка

Якщо виникли проблеми:

1. Перевірте логи Flask (консоль)
2. Перевірте консоль браузера (F12)
3. Перевірте `/api/health` endpoint
4. Перевірте що всі файли на місці

---

## ✅ Готово!

Після успішного запуску:

- **Frontend:** http://localhost:3000 (dev) або http://localhost:5000 (prod)
- **API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health

**Успіхів з проектом! 🎉**
