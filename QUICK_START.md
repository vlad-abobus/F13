# ⚡ Швидкий Старт Freedom13

## 🎯 Мінімальний Запуск (5 хвилин)

### 1. Перевірка файлів
```bash
python CHECK_FILES.py
```

### 2. Створення .env
Скопіюйте `.env.example` в `.env` та налаштуйте (мінімум - залиште порожнім для SQLite)

### 3. Встановлення залежностей
```bash
# Backend (якщо помилка з pydantic - це нормально, він опціональний)
pip install -r requirements.txt

# Frontend
cd client
npm install
cd ..
```

### 4. Ініціалізація БД
```bash
python INIT_DB.py
```

### 5. Запуск
```bash
# Windows
FULL_START.bat

# Або вручну:
# Terminal 1
python run.py

# Terminal 2
cd client
npm run dev
```

### 6. Відкрити
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Health: http://localhost:5000/api/health

---

## ✅ Перевірка Доступу до Файлів

### Ruffle
- ✅ `http://localhost:5000/ruffle/ruffle.js` - має завантажитися
- ✅ `http://localhost:5000/ruffle/*.wasm` - має завантажитися

### Ігри
- ✅ `http://localhost:5000/games/Super_Drift3D.swf` - має завантажитися
- ✅ `http://localhost:5000/games/earn_to_die.swf` - має завантажитися

### MikuGPT Емоції
- ✅ `http://localhost:5000/api/miku/emotion-image/A/happy_idle` - має показати зображення
- ✅ `http://localhost:5000/api/miku/emotion-image/B/smileR_M` - має показати зображення

### Логотип
- ✅ `http://localhost:5000/logo.png` - має відобразитися

---

## 🔧 Налаштування БД

### SQLite (Development - за замовчуванням)
Просто не вказуйте `DB_PASSWORD` в `.env` - все працюватиме автоматично.

### PostgreSQL (Production)
```env
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=freedom13
```

---

## 📝 Структура Файлів

```
F13R/
├── ruffle/              ✅ Ruffle плеєр (ruffle.js + .wasm)
├── games/               ✅ SWF ігри (4 файли)
├── MikuGPT_ver_1.0/
│   └── emotions/        ✅ Емоції (A: 15 PNG, B: 9 JPG)
├── logo.png             ✅ Логотип
├── .env                 ⚠️  Створіть з .env.example
└── ...
```

---

## 🐛 Швидке Вирішення Проблем

**Помилка БД:** Перевірте `.env` або запустіть `python INIT_DB.py`

**Ruffle не працює:** Перевірте `ruffle/ruffle.js` існує

**Емоції не показуються:** Перевірте `MikuGPT_ver_1.0/emotions/A/` та `B/`

**CORS помилка:** Перевірте `CORS_ORIGINS` в `.env`

---

**Детальна інструкція:** Див. `START_GUIDE.md`
