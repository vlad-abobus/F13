# DuckDuckGo AI + MikuGPT Integration Guide

## Overview
MikuGPT now supports DuckDuckGo AI search integration for knowledge queries. The `DuckAIClient` async wrapper provides dialog history, error handling, and model selection.

## Backend: DuckAIClient Class

### File
`app/services/duck_ai_client.py`

### Features
- **Async interface** with `await client.ask(query)`
- **Dialog history** (last 5 messages by default, configurable)
- **Error handling** for network timeouts, rate limits, and service unavailability
- **Model selection** (default: `gpt-4o-mini`)
- **Context awareness** - uses previous messages for better responses

### Usage Example (Backend)
```python
from app.services.duck_ai_client import DuckAIClient

# Initialize
client = DuckAIClient(model="gpt-4o-mini", timeout=30, max_history=5)

# Ask a question
response = await client.ask("What is machine learning?")

# Get dialog history
history = client.get_history()  # Returns list of {'role': '...', 'content': '...'}

# Clear history
client.clear_history()
```

## API Endpoint: `/api/miku/search-chat` (POST)

### Request
```json
{
  "message": "Your search query here",
  "personality": "Дередере",
  "emotion_set": "A",
  "flirt_enabled": false,
  "nsfw_enabled": false,
  "model": "gpt-4o-mini"
}
```

### Response (Success)
```json
{
  "response": "Search result from DuckDuckGo AI...",
  "emotion": "happy_idle",
  "emotion_set": "A",
  "source": "duckduckgo_ai",
  "fallback": false
}
```

### Response (Error)
```json
{
  "response": "Мику: Вибач, DuckAI наразі недоступна 🔍... ♪",
  "emotion": "happy_idle",
  "emotion_set": "A",
  "source": "duckduckgo_ai",
  "error": "Connection timeout",
  "fallback": true
}
```

## Frontend Integration Pattern

### 1. Show "Thinking..." Immediately
```typescript
// When user sends search query:
1. Add message to history: { role: 'user', content: 'What is X?' }
2. Add thinking message: { role: 'assistant', content: 'думаю.....', isThinking: true }
3. POST /api/miku/search-chat with message
4. On response, replace thinking message with actual response
```

### 2. Example React Component
```typescript
const [messages, setMessages] = useState([]);

async function handleSearchQuery(query: string) {
  // Add user message
  setMessages(prev => [...prev, { role: 'user', content: query, isUser: true }]);
  
  // Add thinking message immediately
  setMessages(prev => [...prev, { 
    role: 'assistant', 
    content: 'думаю.....', 
    isThinking: true 
  }]);
  
  try {
    // Fetch from DuckDuckGo search endpoint
    const response = await fetch('/api/miku/search-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: query,
        personality: selectedPersonality,
        emotion_set: emotionSet,
        model: 'gpt-4o-mini'
      })
    });
    
    const data = await response.json();
    
    // Replace thinking message with actual response
    setMessages(prev => [
      ...prev.slice(0, -1),  // Remove thinking message
      {
        role: 'assistant',
        content: data.response,
        emotion: data.emotion,
        emotionSet: data.emotion_set,
        isThinking: false
      }
    ]);
  } catch (error) {
    setMessages(prev => [
      ...prev.slice(0, -1),
      {
        role: 'assistant',
        content: 'Вибач, щось пішло не так...',
        isThinking: false,
        isError: true
      }
    ]);
  }
}
```

## Dependencies
Added to `requirements.txt`:
- `duckduckgo-search==4.4.0` - DuckDuckGo search API wrapper
- `aiohttp==3.9.2` - Async HTTP support

## Installation
Run in project root:
```bash
pip install -r requirements.txt
```

## Error Handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `DuckAI request timed out` | DuckDuckGo AI service slow | Retry with longer timeout (already 60s by default) |
| `Empty response from DuckDuckGo AI` | Service returned no data | Retry with simpler query |
| Network errors | Connection issues | Check internet, fallback gracefully |
| Rate limit | Too many requests | Implement request throttling on frontend |

## Testing

Run the example:
```bash
python -m app.services.duck_ai_client
```

This will make 3 sample queries and show the dialog history at the end.

## Performance Notes
- **First request**: ~2-5 seconds (depends on query complexity and network)
- **Subsequent requests**: ~1-3 seconds (reuses connection)
- **History limit**: Keeps last 5 message pairs (10 messages total)
- **Timeout**: 60 seconds (helps with slow queries)

## Future Improvements
- [ ] Cache frequently asked questions
- [ ] Stream responses chunk-by-chunk for real-time feedback
- [ ] Add provider rotation if DuckDuckGo AI becomes unavailable
- [ ] Support file uploads for context
- [ ] Integration with regular MikuGPT for unified chat history

---

**Created**: 2026-02-05  
**Status**: MVP Ready
