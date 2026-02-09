оь# 🚀 DuckDuckGo AI + MikuGPT - Quick Reference Card

## ⚡ 5-Minute Setup

### 1. Install Dependencies
```bash
pip install duckduckgo-search aiohttp
# OR
pip install -r requirements.txt
```

### 2. Start Server
```bash
python run.py
```

### 3. Test Endpoint
```bash
curl -X POST http://localhost:5000/api/miku/search-chat \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "What is AI?", "personality": "Дередере"}'
```

---

## 📦 What You Get

| Component | File | Purpose |
|-----------|------|---------|
| **DuckAIClient** | `app/services/duck_ai_client.py` | Async DuckDuckGo AI wrapper with history |
| **Route Handler** | `app/routes/miku.py` | `/api/miku/search-chat` endpoint |
| **Frontend Service** | `client/src/services/DuckSearchChat.ts` | React/TypeScript integration with thinking messages |
| **Tests** | `test_duck_integration.py` | Validation script |
| **Docs** | `DUCKDUCKGO_AI_SETUP.md` | Complete setup guide |

---

## 🎯 Common Use Cases

### Use Case 1: Simple Query
```python
from app.services.duck_ai_client import DuckAIClient
import asyncio

async def main():
    client = DuckAIClient()
    response = await client.ask("What is Python?")
    print(response)

asyncio.run(main())
```

### Use Case 2: Query with Context
```python
client = DuckAIClient(max_history=10)

# First query
r1 = await client.ask("Who is Hatsune Miku?")

# Second query uses context of first
r2 = await client.ask("Tell me about her music")
```

### Use Case 3: Frontend Integration
```typescript
import { useDuckSearchChat } from '@/services/DuckSearchChat';

const { messages, send, isLoading } = useDuckSearchChat(apiClient);

// User sends query
await send("What is machine learning?");

// Messages now has:
// 1. User message
// 2. "думаю....." thinking message
// 3. (After response) Actual AI response
```

---

## 🔗 API Endpoints

### POST `/api/miku/search-chat`
Search using DuckDuckGo AI with MikuGPT personality

**Params:**
```json
{
  "message": "string (required)",
  "personality": "string (default: Дередере)",
  "emotion_set": "string (default: A)",
  "model": "string (default: gpt-4o-mini)"
}
```

**Response:**
```json
{
  "response": "AI response text",
  "emotion": "emotion_name",
  "emotion_set": "A|B",
  "source": "duckduckgo_ai",
  "fallback": false|true
}
```

---

## ⚙️ Configuration

### Change DuckAI Settings
```python
# In any route/service:
client = DuckAIClient(
    model="gpt-4o-mini",      # AI model
    timeout=60,                # Request timeout (sec)
    max_history=5              # Dialog history size
)
```

### Change Thinking Message
```typescript
// In DuckSearchChat.ts, line ~95
const thinkingMessage = {
    content: 'думаю.....  🔍',  // ← Edit this
    isThinking: true
};
```

---

## 🧪 Validation

### Run Validation Script
```bash
python test_duck_integration.py
```

**Expected output:**
```
✓ DuckAIClient imported successfully
✓ MikuGPT routes imported successfully
✓ duckduckgo-search imported successfully
✓ DuckAIClient initialized
✓ All required methods present
✓ Event loop works correctly

✓ All validations passed! Integration ready.
```

### Run Example
```bash
python -m app.services.duck_ai_client
```

---

## 🛠️ Troubleshooting

| Problem | Fix |
|---------|-----|
| `ModuleNotFoundError` | `pip install -r requirements.txt` |
| `401 Unauthorized` | Check auth token, re-authenticate |
| `Request timeout` | Increase timeout value or simplify query |
| `Empty response` | Query may be too complex, try simpler wording |
| `Thinking message stuck` | Check browser console for JS errors |

---

## 📊 Response Times

| Stage | Time |
|-------|------|
| Thinking message shown | ~200ms |
| DuckAI processing | 1-5s |
| Response displayed | ~200ms |
| **Total user wait** | ~2-6s |

---

## 🔒 Authentication

All `/api/miku/*` endpoints require:
```
Authorization: Bearer {jwt_token}
```

Get token:
```python
import requests
r = requests.post('/auth/login', json={'username': 'user', 'password': 'pass'})
token = r.json()['access_token']
```

---

## 💾 History Management

```python
client = DuckAIClient(max_history=5)

# Check history
print(client.get_history())
# Output: [
#   {'role': 'user', 'content': '...', 'timestamp': '...'},
#   {'role': 'assistant', 'content': '...', 'timestamp': '...'},
#   ...
# ]

# Clear history
client.clear_history()

# Get formatted recent messages
print(client.get_recent_messages(count=3))
```

---

## 🎨 Emotion Support

### Set A (Anime style)
`happy_idle`, `happy`, `cheerful`, `neutral2`, `neutral3`, `shocked`, `shocked2`, `surprised`, `embarrassed`, `apologetic`, `sad_look`, `crying`, `irritated`, `angry_look`, `middle_finger_anger`

### Set B (Manga style)  
`smileR_M`, `shyM`, `helloM`, `sayingM`, `interestedM`, `open_mouthM`, `sly_smileM`, `coolM`, `angryM`

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `DUCKDUCKGO_AI_SETUP.md` | Complete setup & configuration guide |
| `DUCKDUCKGO_INTEGRATION.md` | API reference & error handling |
| `app/services/duck_ai_client.py` | Class docstrings & method docs |
| `client/src/services/DuckSearchChat.ts` | Frontend TypeScript docs |

---

## 🚀 Next Steps

1. ✅ Install dependencies
2. ✅ Run validation: `python test_duck_integration.py`
3. ✅ Start server: `python run.py`
4. ✅ Test endpoint with cURL or Postman
5. ✅ Integrate into frontend with `DuckSearchChat` class
6. ✅ Deploy to staging/production

---

## 📝 Key Code Examples

### Backend Usage
```python
async def search_with_miku():
    client = DuckAIClient()
    response = await client.ask(
        "Tell me a joke",
        use_history=True  # Include context
    )
    return response
```

### Frontend Usage  
```typescript
const chat = new DuckSearchChat(apiClient);
const response = await chat.send(
    "What is AI?",
    "Дередере",  // Personality
    "A",          // Emotion set
    (msgs) => updateUI(msgs)  // Live update callback
);
```

### React Hook Usage
```typescript
const { messages, send, isLoading } = useDuckSearchChat(apiClient);

<div onClick={() => send("Hello!")}>
    {isLoading && <Spinner />}
    {messages.map(m => <Message {...m} />)}
</div>
```

---

**Version**: 1.0  
**Last Updated**: 2026-02-05  
**Status**: ✅ Production Ready
