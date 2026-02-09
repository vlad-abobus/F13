# MikuGPT 502 Error Fix

## Problem
MikuGPT was returning 502 Bad Gateway errors when trying to chat with the AI assistant.

## Root Cause
The g4f library (Google for Free) is an unstable wrapper around free AI providers. These providers:
- Frequently block or rate-limit g4f requests
- Go down unexpectedly
- Return 502/504 errors that weren't being handled properly

## Solution Implemented

### 1. **Retry Logic with Exponential Backoff**
   - Added automatic retry mechanism (up to 2 attempts)
   - Exponential backoff delays between retries
   - Only retries on transient errors (timeouts, connection issues)

### 2. **Better Timeout Handling**
   - Added explicit timeout parameters to g4f calls
   - Timeout set to 30 seconds for chat, 30 seconds for moderation
   - Prevents hanging requests

### 3. **Graceful Fallback Responses**
   - Instead of returning 500 errors, returns 200 with fallback response
   - Fallback: "Вибач, зараз не можу відповісти ♪"
   - Users get a polite message instead of error

### 4. **Improved Error Logging**
   - Added detailed logging with attempt numbers
   - Logs which errors occur and at which attempt
   - Helps diagnose issues in production

### 5. **Better Error Classification**
   - Distinguishes between temporary errors (retry) and permanent errors (fallback)
   - JSON parsing errors are also retried once
   - Other exceptions fail fast

## Files Modified

1. **app/services/miku_service.py**
   - Added retry logic and timeout parameters
   - Enhanced error handling with logging
   - Added empty response validation

2. **app/services/miku_moderation_service.py**
   - Added retry logic with exponential backoff
   - Better exception handling for JSON parsing
   - Improved fallback behavior

3. **app/routes/miku.py**
   - Changed error handling to return 200 with fallback response
   - Added logging for debugging

## Testing

To test if the fix works:

```bash
# Start the app
python run.py

# Test MikuGPT chat endpoint
curl -X POST http://localhost:5000/api/miku/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Привет!", "personality": "Дередере"}'
```

You should now get a response (either real or fallback) instead of a 502 error.

## Additional Considerations

### If 502 errors persist:

1. **Check g4f provider status**
   - g4f uses free AI providers that may be blocked or down
   - No control over these external services

2. **Alternative Solutions** (for production):
   - Use a paid API like OpenAI, Claude, or other LLM providers
   - Set up a dedicated API gateway with rate limiting
   - Implement caching for common responses
   - Add a queue system for AI requests

3. **Monitoring**
   - Check Flask logs for specific error patterns
   - Monitor AI response times
   - Track fallback response frequency

## Configuration

The retry behavior can be adjusted in `MikuService.__init__()`:
```python
self.timeout = 30          # Seconds per attempt
self.max_retries = 2       # Number of retries
self.retry_delay = 1       # Initial delay in seconds (exponential backoff)
```

## Fallback Responses

The service always returns a valid response now:
- If AI generates a response: Returns the AI response
- If timeout/connection error: Retries up to 2 times
- If persistent error: Returns friendly fallback message

Status is always 200 with a response object containing:
- `response`: The actual response text or fallback
- `emotion`: The emotion to display
- `emotion_set`: A or B
- `error`: (optional) Error message if fallback was used
