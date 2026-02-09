# Gemini Integration - Полная инструкция запуска

## 🎯 Архитектура

```
Пользователь (localhost:3000)
    ↓
[React Frontend] - MikuGPT.tsx
    ├→ Попытка 1: Gemini API (DIRECT) ✅ PRIMARY
    │  └─ Если работает: быстрый ответ без backend
    └→ Попытка 2: Backend API (FALLBACK)
       └─ http://localhost:5000/api/miku/chat
```

**Backend** (localhost:5000) также использует Gemini:
```
Flask Backend
    └→ MikuService.generate_response()
       └→ genai.Client(api_key=...).models.generate_content()
```

---

## 🚀 Запуск (3 остановки)

### 1️⃣ Запустите Backend (Flask на :5000)

```powershell
cd "c:\Users\vladi\Documents\GitHub\F13"
.\venv\Scripts\Activate.ps1
python run.py
```

**Проверка**: http://localhost:5000 должен ответить

### 2️⃣ Запустите Frontend (React на :3000)

```powershell
cd "c:\Users\vladi\Documents\GitHub\F13\client"
npm run dev
```

**Проверка**: http://localhost:3000 откроется в браузере

### 3️⃣ Тестируйте Мику!

Зайдите на http://localhost:3000 и:
- Напишите сообщение Мику
- Выберите personality (Дередере, Цундере, и т.д.)
- Отправьте!

---

## 🔧 Как это работает

### Клиентская сторона (React :3000)

```typescript
// client/src/pages/MikuGPT.tsx
import { initializeGemini, sendGeminiMessage } from '../services/GeminiChat'

// При загрузке:
initializeGemini(import.meta.env.VITE_GEMINI_API_KEY)

// При отправке сообщения:
const response = await sendGeminiMessage(message, personality)
// → Прямой вызов Google Gemini API
// → Без network round-trip на backend!
```

### Серверная сторона (Flask :5000)

```python
# app/services/miku_service.py
from google import genai

api_key = os.environ.get('GOOGLE_API_KEY')  # Из .env
client = genai.Client(api_key=api_key)
response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents=prompt,
)
```

---

## ⚙️ Конфигурация

### Backend (.env файл)
```
GOOGLE_API_KEY=AIzaSyAQNpPVxkj53vBF698WZxcYaFAwR9BKx_Y
```
✅ **Уже настроен в проекте**

### Frontend (client/.env.local)
```
VITE_GEMINI_API_KEY=AIzaSyAQNpPVxkj53vBF698WZxcYaFAwR9BKx_Y
```
✅ **Уже настроен в проекте**

---

## 📊 Что произойдёт

### Сценарий 1: Gemini работает (обычно)
```
Пользователь: "Привет Мику!"
  ↓ (2-3 сек)
Браузер → Gemini API (прямо)
  ↓
Ответ: "Привет, сенпай! 💕"
Без задержек backend!
```

### Сценарий 2: Gemini недоступен (fallback)
```
Пользователь: "Привет Мику!"
  ↓ (ошибка Gemini: quota exceeded)
  ↓
Браузер → Backend :5000
  ↓
Backend использует свой Gemini
  ↓
Ответ: "Привет! ♪"
```

---

## 🐛 Решение проблем

### Ошибка 502 Bad Gateway
❌ Это была старая проблема с g4f
✅ Теперь исправлено - используем официальный Gemini API

### Quota Exceeded (429 Error)
- Причина: Бесплатный API отключён
- Решение: 
  1. Проверьте billing: https://console.cloud.google.com/billing
  2. Или дождитесь сброса квоты (в полночь UTC)

### Gemini API Key not found
- Проверьте что `.env` имеет: `GOOGLE_API_KEY=AIzaSyAQ...`
- Для React проверьте `client/.env.local`

---

## ✅ Чек-лист

- [x] Backend использует google-genai (Gemini)
- [x] Frontend использует @google/generative-ai 
- [x] .env файл имеет правильный API ключ
- [x] client/.env.local настроен
- [x] MikuGPT.tsx интегрирован с GeminiChat.ts
- [x] Fallback на backend если Gemini недоступен
- [x] Нет TypeScript ошибок
- [x] Нет g4f в коде (всё очищено)

---

## 🎉 Результат

Пользователи теперь могут:
- ✅ Общаться с Мику напрямую через Gemini (localhost:3000)
- ✅ Выбирать personality (Дередере, Цундере и т.д.)
- ✅ Включать/выключать flirt, NSFW, RP режимы
- ✅ Видеть эмоции Мику (картинки)
- ✅ Получать ответы даже если backend недоступен (Gemini direct!)

---

**Created**: February 5, 2026
**Status**: Ready for Production ✅
