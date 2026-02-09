# Post & Comment Cooldown (Spam Prevention) Documentation

## Overview
This feature implements time-based cooldowns to prevent users from spamming posts and comments. It tracks when users last posted/commented and prevents them from doing so again until a cooldown period has elapsed.

## Features
- **Post Cooldown**: Prevents users from posting too frequently (default: 30 seconds)
- **Comment Cooldown**: Prevents users from commenting too frequently (default: 10 seconds)
- **Repost Cooldown**: Reposts also count toward post cooldown
- **Automatic Tracking**: Last post/comment time is automatically updated when user creates content
- **Configurable**: All cooldown durations can be customized via environment variables

## Database Changes
Two new columns were added to the `users` table:
- `last_post_time` (TIMESTAMP, nullable): Records when the user last created a post or repost
- `last_comment_time` (TIMESTAMP, nullable): Records when the user last created a comment

## Implementation Details

### Configuration (config.py)
```python
# Spam prevention - cooldown settings (in seconds)
POST_COOLDOWN = int(os.environ.get('POST_COOLDOWN', 30))  # 30 seconds between posts
COMMENT_COOLDOWN = int(os.environ.get('COMMENT_COOLDOWN', 10))  # 10 seconds between comments
```

### Modified Routes
1. **POST /api/posts/** (create_post)
   - Checks if user has waited long enough since last post
   - Returns 429 (Too Many Requests) if still in cooldown
   - Updates `last_post_time` when post is created

2. **POST /api/comments/** (create_comment)
   - Checks if user has waited long enough since last comment
   - Returns 429 (Too Many Requests) if still in cooldown
   - Updates `last_comment_time` when comment is created

3. **POST /api/posts/<post_id>/repost**
   - Shares the same cooldown as regular posts
   - Updates `last_post_time` when repost is created

### Error Response
When a user hits the cooldown limit, they receive:
```json
{
  "error": "Please wait {seconds_remaining} seconds before posting again",
  "cooldown": 30,
  "seconds_remaining": 15
}
```
HTTP Status: **429 Too Many Requests**

## Configuration & Customization

### Environment Variables
Set these in your `.env` file to customize cooldown durations:

```env
# Post cooldown in seconds (minimum time between posts)
POST_COOLDOWN=30

# Comment cooldown in seconds (minimum time between comments)
COMMENT_COOLDOWN=10
```

### Example Configurations

**Strict Mode (prevent spam):**
```env
POST_COOLDOWN=60
COMMENT_COOLDOWN=20
```

**Relaxed Mode (allow more freedom):**
```env
POST_COOLDOWN=15
COMMENT_COOLDOWN=5
```

**Very Strict Mode (forum-like):**
```env
POST_COOLDOWN=120
COMMENT_COOLDOWN=30
```

## Database Migration

### Run the Migration
```bash
python migrations/migrate_add_cooldown_tracking.py
```

This script:
- Creates the new columns if they don't exist
- Works with both SQLite (development) and PostgreSQL (production)
- Safely handles existing databases

### Manual SQL (if needed)
For PostgreSQL:
```sql
ALTER TABLE users ADD COLUMN last_post_time TIMESTAMP;
ALTER TABLE users ADD COLUMN last_comment_time TIMESTAMP;
```

For SQLite:
```sql
ALTER TABLE users ADD COLUMN last_post_time TIMESTAMP;
ALTER TABLE users ADD COLUMN last_comment_time TIMESTAMP;
```

## Frontend Integration

### Example: Handle Cooldown Error in React
```typescript
async function createPost(content: string) {
  try {
    const response = await fetch('/api/posts/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });

    if (response.status === 429) {
      const data = await response.json();
      showError(`${data.error} (${data.seconds_remaining}s remaining)`);
      // Optionally disable submit button for seconds_remaining duration
      disableSubmitFor(data.seconds_remaining);
      return;
    }

    if (!response.ok) throw new Error('Failed to create post');
    // Success handling
  } catch (error) {
    showError(error.message);
  }
}
```

### Example: Display Remaining Cooldown
```typescript
function PostForm() {
  const [secondsRemaining, setSecondsRemaining] = React.useState(0);

  const handleCooldown = (remaining: number) => {
    setSecondsRemaining(remaining);
    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        const next = prev - 1;
        if (next <= 0) clearInterval(timer);
        return Math.max(0, next);
      });
    }, 1000);
  };

  return (
    <form>
      <textarea placeholder="What's on your mind?" />
      <button 
        disabled={secondsRemaining > 0}
        title={secondsRemaining > 0 ? `Wait ${secondsRemaining}s` : ''}
      >
        {secondsRemaining > 0 ? `Wait ${secondsRemaining}s` : 'Post'}
      </button>
    </form>
  );
}
```

## Additional Considerations

### Rate Limiting
The cooldown feature works alongside existing rate limiter:
- **POST /api/posts/**: 5 posts per minute (rate limit) + 30 second cooldown (user cooldown)
- **POST /api/comments/**: 10 comments per minute (rate limit) + 10 second cooldown (user cooldown)

Both protections work together for maximum spam prevention.

### Null Handling
- New users have `last_post_time` and `last_comment_time` as NULL
- NULL timestamps don't trigger cooldown check
- First post/comment from a user is always allowed

### Admin Bypass
Currently, all users including admins must respect the cooldown. To exempt admins:

```python
# In create_post endpoint
if request.current_user.status != 'admin' and request.current_user.last_post_time:
    # Check cooldown...
```

### Performance Impact
- Minimal: Only compares datetime values, no additional database queries
- Uses existing user object already loaded in request
- No additional indexes needed

## Testing

### Test Script
```bash
# Apply migration
python migrations/migrate_add_cooldown_tracking.py

# Then test in your application:
# 1. Create a post
# 2. Try to create another immediately (should get 429)
# 3. Wait 30+ seconds and try again (should succeed)
```

### cURL Examples
```bash
# Create a post (first time - success)
curl -X POST http://localhost:5000/api/posts/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello world!"}'

# Try immediately again (should fail with 429)
curl -X POST http://localhost:5000/api/posts/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Second post"}'
```

## Troubleshooting

### Column Already Exists Error
If you get migration errors, the columns might already exist. Run:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users';
```

### Cooldown Not Working
1. Verify migration ran successfully
2. Check `POST_COOLDOWN` and `COMMENT_COOLDOWN` environment variables
3. Ensure Flask app config loads them: `current_app.config.get('POST_COOLDOWN')`
4. Check database has the new columns

### Users Bypass Cooldown
Cooldown is enforced on server-side, cannot be bypassed from frontend. Check:
1. Did the migration run?
2. Are the environment variables set?
3. Check server logs for any errors

## Future Enhancements
- Progressive cooldown (increases with spam)
- Cooldown exemptions for trusted/verified users
- Admin panel to view/adjust user cooldowns
- Cooldown statistics and spam reports
- Dynamic cooldown based on user reputation/age
