# Gemini Integration на фронтенді (React)

## Установка

Пакет `@google/generative-ai` вже встановлений:
```bash
npm install @google/generative-ai
```

## Налаштування API ключа

### 1. Отримати Gemini API ключ
- Перейти на [google.ai.dev](https://google.ai.dev)
- Натиснути "Get API key" або "Create API key"
- Скопіювати API ключ

### 2. Додати ключ у `.env.local` (dev) або `.env` (build)

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

**Важливо:** Клиентський API ключ **НЕ** повинен містити чутливі дані, тому що він видиме у браузері. 
На production використовуй backend проксі (`/api/miku/chat`).

## Використання в компонентах

### Ініціалізація
```typescript
import { initializeGemini, useGeminiChat } from '@/services/GeminiChat';

// У main.tsx або App.tsx
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (apiKey) {
  initializeGemini(apiKey);
} else {
  console.warn('GEMINI_API_KEY not configured, using backend API');
}
```

### У React компоненті
```typescript
import { useGeminiChat } from '@/services/GeminiChat';

export function MikuChat() {
  const { sendMessage } = useGeminiChat();
  const [response, setResponse] = useState('');

  const handleSendMessage = async (message: string) => {
    try {
      const result = await sendMessage(
        message,
        'Дередере',  // personality
        'A',         // emotionSet
        false,       // flirtEnabled
        false,       // nsfwEnabled
        false        // rpEnabled
      );
      
      setResponse(result.response);
      console.log('Emotion:', result.emotion);
      console.log('Source:', result.source); // "gemini-client"
    } catch (error) {
      console.error('Failed to get response:', error);
      // Fallback до backend API
      // ... викликай /api/miku/chat замість
    }
  };

  return (
    <div>
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} />
      <button onClick={() => handleSendMessage(message)}>Send</button>
      <div>{response}</div>
    </div>
  );
}
```

## Архітектура

### Client-side (localhost:3000)
- React компоненти скреши `GeminiChat.ts`
- Прямий виклик до Gemini API через `@google/generative-ai`
- API ключ у `.env.local` (видиме у браузері - це зліпком як робить Google AI Studio)

### Server-side (localhost:5000)
- Backend API `/api/miku/chat` як fallback
- Використовує Python `google-genai`
- Для production та аутентифікованих запитів

## Fallback до Backend API

Якщо на клієнті Gemini недоступна (немає API ключа), автоматично використовуй backend:

```typescript
try {
  const clientResult = await sendMessage(...);
  return clientResult;
} catch (error) {
  console.log('Client Gemini failed, using backend API');
  // Викликай /api/miku/chat замість
  const backendResult = await fetch('/api/miku/chat', {
    method: 'POST',
    body: JSON.stringify({ message })
  });
  return await backendResult.json();
}
```

## Переваги локальної інтеграції

✅ **Швидше** — немає мережевого затримання до backend  
✅ **Дешевше** — рахується з Gemini лімітів Google, не твого серверу  
✅ **Автономно** — працює навіть якщо backend недоступний  
✅ **Тестування** — дебагти локально без серверу  

## Обмеження

⚠️ API ключ видиме у браузері (як у Google AI Studio)  
⚠️ Рахунок лімітів = від браузера користувача  
⚠️ CORS можуть бути обмеження залежно від домену  

## Поточний стан

- ✅ `@google/generative-ai` встановлений
- ✅ `GeminiChat.ts` створений з Redux у React
- ⏳ Потрібно додати `.env.local` з VITE_GEMINI_API_KEY
- ⏳ Потрібно інтегрувати у Miku компоненти (заміна `useMikuChat()`)

## Далі

1. Отримай Gemini API ключ від Google
2. Додай у `client/.env.local`:
   ```
   VITE_GEMINI_API_KEY=your_key_here
   ```
3. Онови компоненти чату (якщо потребує)
4. Тестуй на localhost:3000
