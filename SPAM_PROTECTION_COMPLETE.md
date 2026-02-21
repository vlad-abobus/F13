# Complete Spam Protection System Documentation

## Overview
This document describes the comprehensive spam protection system implemented to prevent abuse on F13. It includes multiple layers of protection:

1. **Time-based Cooldowns** - Prevent rapid-fire posts/comments
2. **Content Analysis** - Detect spam keywords and suspicious patterns
3. **Duplication Detection** - Prevent repeated identical content
4. **URL Limiting** - Restrict link spam
5. **IP-based Tracking** - Log and block spam from specific IPs
6. **CAPTCHA on Reports** - Prevent false report spam

---

## 1. Time-based Cooldowns

### Overview
Users must wait a minimum time between creating posts and comments.

### Configuration
```env
# In .env file
POST_COOLDOWN=30              # Seconds between posts (default: 30)
COMMENT_COOLDOWN=10           # Seconds between comments (default: 10)
```

### Implementation
- **Database**: Uses `last_post_time` and `last_comment_time` columns in `users` table
- **Status Code**: Returns **429 Too Many Requests** when cooldown active
- **Response**:
```json
{
  "error": "Please wait 15 seconds before posting again",
  "cooldown": 30,
  "seconds_remaining": 15
}
```

### Frontend Handling
```typescript
async function createPost(content: string) {
  const response = await fetch('/api/posts/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  });

  if (response.status === 429) {
    const { seconds_remaining } = await response.json();
    disableSubmitFor(seconds_remaining); // Disable button for N seconds
  }
}
```

---

## 2. Content Analysis & Spam Scoring

### SpamDetector Service
Location: `app/services/spam_detector.py`

### Features

#### 2.1 Spam Keyword Detection
Detects common spam keywords including:
- Cryptocurrency scams (bitcoin, ethereum, crypto, NFT)
- Financial fraud (nigerian prince, wire transfer)
- Adult content (explicit keywords)
- Phishing (verify account, suspicious activity)
- Generic spam (click here, act now, congratulations won)
- Ukrainian/Russian spam keywords

**Example Usage**:
```python
from app.services.spam_detector import SpamDetector

keywords = SpamDetector.check_spam_keywords("Free Bitcoin! Click here now!")
# Returns: ['bitcoin', 'free bitcoin', 'click here']
```

#### 2.2 URL Detection & Limiting
- Counts full URLs (`http://`, `https://`)
- Detects short links (`bit.ly`, `tinyurl`, `goo.gl`, etc.)
- Configurable limits per post/comment

**Configuration**:
```env
SPAM_MAX_URLS_PER_POST=2      # Max URLs in posts
SPAM_MAX_URLS_PER_COMMENT=1   # Max URLs in comments
```

**Example Usage**:
```python
# Count URLs
url_counts = SpamDetector.count_urls(content)
# Returns: {'full_urls': 2, 'short_links': 1, 'total_urls': 3}

# Check if excessive
is_spam = SpamDetector.check_excessive_urls(content, max_urls=2)
```

#### 2.3 Spam Scoring System
Calculates a spam score (0-20+) based on multiple factors:

| Factor | Points | Trigger |
|--------|--------|---------|
| Spam keyword | 2 per keyword | Found spam keywords |
| Excessive URLs | 5 | More than max allowed |
| Excessive capitals | 3 | >30% uppercase |
| Repeated chars | 2 | 4+ repeated chars (aaaaa) |
| Short + URL | 3 | <20 chars + has URL |

**Spam Levels**:
- `score < 3`: **safe** - auto-approved
- `score 3-6`: **suspicious** - auto-approved but logged
- `score >= 7`: **likely_spam** - flagged for manual review

**Usage**:
```python
analysis = SpamDetector.get_spam_score(content, user_id)
# Returns:
# {
#   'score': 8,
#   'level': 'likely_spam',
#   'reasons': ['Too many URLs: 3', 'Short content with URLs (link spam)']
# }
```

---

## 3. Content Duplication Detection

### How It Works
Prevents users from posting the same content multiple times in a short period.

### Configuration
```env
DUPLICATE_CHECK_MINUTES=5     # Time window in minutes (default: 5)
```

### Database
Checks both `posts` and `comments` tables for identical normalized content within the time window.

### Example
**Attempt 1**: "Hello world" ✓ Allowed
**Attempt 2** (5 seconds later): "Hello world" ✗ Blocked with:
```json
{
  "error": "You recently posted the same content. Please try something different.",
  "type": "duplicate_content"
}
```

---

## 4. URL Limiting

### Post vs Comment Limits
Posts allow more URLs (default 2) while comments are stricter (default 1).

### Configuration
```env
SPAM_MAX_URLS_PER_POST=2
SPAM_MAX_URLS_PER_COMMENT=1
```

### Error Response
```json
{
  "error": "Too many URLs in post (max 2, found 3)",
  "type": "excessive_urls",
  "max_urls": 2,
  "found_urls": 3
}
```

### Detected URL Types
- Full URLs: `http://example.com`, `https://example.com`
- Short links: `bit.ly/abc123`, `tinyurl.com/xyz`
- Masked links: `goo.gl`, `ow.ly`, `linktr.ee`

---

## 5. IP-based Spam Tracking

### IPSpamLog Model
Location: `app/models/ip_spam_log.py`

### Features
- Logs all spam attempts with IP address
- Tracks event type (post, comment, report, failed_captcha)
- Records spam score and reason for blocking
- Stores content preview for analysis
- Includes user agent and referrer information

### Database
Table: `ip_spam_logs`

**Columns**:
- `id`: Unique ID
- `ip_address`: Source IP (IPv4 or IPv6)
- `user_id`: Associated user (null for anonymous attempts)
- `event_type`: Type of event
- `spam_score`: Calculated spam score
- `blocked`: Whether action was blocked
- `reason`: Why it was blocked
- `content_preview`: First 200 chars of content
- `created_at`: Timestamp

### Admin Features
Admins can view spam patterns by IP to identify coordinated attacks:

```python
from app.models.ip_spam_log import IPSpamLog
from datetime import datetime, timedelta

# Find spam from IP in last 24 hours
spam_logs = IPSpamLog.query.filter_by(
    ip_address='192.168.1.1'
).filter(
    IPSpamLog.created_at >= datetime.utcnow() - timedelta(hours=24)
).all()

for log in spam_logs:
    print(f"{log.event_type}: {log.reason} (score: {log.spam_score})")
```

---

## 6. CAPTCHA on Report Submission

### Why
Prevents malicious users from flooding reports to silence legitimate content.

### Implementation
The `@verify_captcha` decorator is now applied to:
- **POST /api/posts/<post_id>/report** - Requires CAPTCHA to report a post

### Frontend Example
```typescript
async function reportPost(postId: string, reason: string, captchaToken: string) {
  const response = await fetch(`/api/posts/${postId}/report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      reason,
      captcha_token: captchaToken  // Required
    })
  });

  if (response.status === 403) {
    // CAPTCHA verification failed
    console.error('CAPTCHA verification failed');
  }
}
```

---

## 7. Moderation Status Based on Spam Score

### Auto-Moderation
Posts are automatically assigned moderation status:
- **Score < 7**: `moderation_status = 'approved'` (visible immediately)
- **Score >= 7**: `moderation_status = 'pending'` (requires admin review)

### Configuration
```env
SPAM_FLAG_THRESHOLD=7        # Score at which to flag for review
```

### Admin Review
Admins can view pending posts and:
- ✓ Approve (make public)
- ✗ Reject (hide from public)
- ⚠️ Warn (approve + warn user)

---

## 8. Configuration Summary

All spam protection settings in `.env`:

```env
# ===== COOLDOWNS =====
POST_COOLDOWN=30
COMMENT_COOLDOWN=10

# ===== SPAM DETECTION =====
SPAM_MAX_URLS_PER_POST=2
SPAM_MAX_URLS_PER_COMMENT=1
SPAM_KEYWORD_THRESHOLD=2          # Not currently used
SPAM_FLAG_THRESHOLD=7             # Auto-flag at this score
DUPLICATE_CHECK_MINUTES=5

# ===== IP BANNING =====
# Managed through admin panel
# IPBan table: ip_bans
```

---

## 9. Database Migrations

### Run Migrations
```bash
# Add cooldown tracking fields
python migrations/migrate_add_cooldown_tracking.py

# Add spam protection features
python migrations/migrate_spam_protection.py
```

### Tables Created
1. **users** (modified)
   - Added: `last_post_time` (TIMESTAMP)
   - Added: `last_comment_time` (TIMESTAMP)

2. **ip_spam_logs** (new)
   - Tracks all spam attempts by IP

---

## 10. API Response Codes

| Code | Meaning | Condition |
|------|---------|-----------|
| 200 | OK | Request successful |
| 201 | Created | Post/comment created |
| 400 | Bad Request | Duplicate, excessive URLs, etc. |
| 403 | Forbidden | Muted, CAPTCHA failed |
| 429 | Too Many Requests | Cooldown active |

---

## 11. Frontend Integration Examples

### Example 1: Post Form with Cooldown Display
```typescript
interface PostFormState {
  content: string;
  secondsRemaining: number;
  isSubmitting: boolean;
}

export function PostForm() {
  const [state, setState] = React.useState<PostFormState>({
    content: '',
    secondsRemaining: 0,
    isSubmitting: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state.secondsRemaining > 0) return;

    setState(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      const response = await fetch('/api/posts/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: state.content }),
        // Add captcha if needed
      });

      if (response.status === 429) {
        const data = await response.json();
        // Start cooldown timer
        setState(prev => ({
          ...prev,
          secondsRemaining: data.seconds_remaining,
          isSubmitting: false
        }));
        
        // Countdown timer
        const timer = setInterval(() => {
          setState(prev => {
            const newValue = Math.max(0, prev.secondsRemaining - 1);
            if (newValue === 0) clearInterval(timer);
            return { ...prev, secondsRemaining: newValue };
          });
        }, 1000);
        return;
      }

      if (!response.ok) throw new Error('Failed to create post');
      
      // Success
      setState({ content: '', secondsRemaining: 0, isSubmitting: false });
      // Refresh feed, etc.
    } catch (error) {
      console.error(error);
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const isDisabled = state.secondsRemaining > 0 || state.isSubmitting;
  const buttonText = state.secondsRemaining > 0 
    ? `Wait ${state.secondsRemaining}s`
    : state.isSubmitting ? 'Posting...' : 'Post';

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={state.content}
        onChange={(e) => setState(prev => ({ ...prev, content: e.target.value }))}
        placeholder="What's on your mind?"
        disabled={false}
      />
      <button type="submit" disabled={isDisabled}>
        {buttonText}
      </button>
    </form>
  );
}
```

### Example 2: Error Handling
```typescript
async function createPost(content: string, onError: (error: SpamError) => void) {
  const response = await fetch('/api/posts/', {
    method: 'POST',
    body: JSON.stringify({ content })
  });

  if (!response.ok) {
    const error = await response.json();
    
    // Type-specific error handling
    switch (error.type) {
      case 'duplicate_content':
        onError({ type: 'duplicate', message: error.error });
        break;
      case 'excessive_urls':
        onError({ 
          type: 'url_limit',
          message: `Max ${error.max_urls} URLs allowed (${error.found_urls} found)`
        });
        break;
      default:
        onError({ type: 'general', message: error.error });
    }
  }
}
```

---

## 12. Monitoring & Analytics

### View Recent Spam Attempts
```python
from app.models.ip_spam_log import IPSpamLog
from datetime import datetime, timedelta

# Last 100 spam attempts
recent = IPSpamLog.query.order_by(
    IPSpamLog.created_at.desc()
).limit(100).all()

# Group by IP
from collections import defaultdict
by_ip = defaultdict(list)
for log in recent:
    by_ip[log.ip_address].append(log)

for ip, attempts in by_ip.items():
    blocked_count = sum(1 for a in attempts if a.blocked)
    print(f"{ip}: {blocked_count}/{len(attempts)} blocked")
```

### Spam Score Distribution
```python
from sqlalchemy import func

scores = db.session.query(
    IPSpamLog.spam_score,
    func.count(IPSpamLog.id).label('count')
).group_by(
    IPSpamLog.spam_score
).all()

for score, count in scores:
    print(f"Score {score}: {count} events")
```

---

## 13. Troubleshooting

### Issue: Cooldown Not Working
1. Check migration ran: `python migrations/migrate_add_cooldown_tracking.py`
2. Verify env variables set: `POST_COOLDOWN`, `COMMENT_COOLDOWN`
3. Check database has columns: `last_post_time`, `last_comment_time` in `users`

### Issue: Spam Detection Too Strict
Adjust config:
```env
SPAM_FLAG_THRESHOLD=10        # Increase to be less strict
SPAM_MAX_URLS_PER_POST=5     # Increase URL limit
```

### Issue: False Positives
- Check `SPAM_KEYWORDS` list in `spam_detector.py`
- Remove language-specific keywords if needed
- Increase `DUPLICATE_CHECK_MINUTES` for longer windows

### Issue: CAPTCHA Not Working on Reports
- Verify `@verify_captcha` decorator applied
- Check CAPTCHA endpoint configuration
- Ensure frontend sends `captcha_token` in request body

---

## 14. Best Practices

### For Admins
1. **Regular Review**: Check `ip_spam_logs` weekly for patterns
2. **IP Banning**: Use admin panel to ban problematic IPs
3. **Keyword Updates**: Update spam keywords as new scams emerge
4. **False Positives**: Monitor rejected posts and adjust thresholds

### For Users
1. **Original Content**: Post unique, valuable content
2. **Fewer Links**: Limit URLs to essential ones
3. **Wait Between Posts**: Respect cooldown timers
4. **Honest Reports**: Only report genuinely inappropriate content

### For Developers
1. **URLs Checked**: Both direct and shortened links
2. **Case Insensitive**: Keyword matching is case-insensitive
3. **Normalized Comparison**: Duplication uses normalized text
4. **Whitespace Handling**: Content trimmed before checks

---

## 15. Future Enhancements

- [ ] Progressive cooldown (increases with repeated spam)
- [ ] User reputation system
- [ ] Machine learning for spam detection
- [ ] Content pattern analysis
- [ ] Coordinated spam detection (multiple accounts)
- [ ] User whitelist for trusted post types
- [ ] Admin dashboard for spam analytics
- [ ] Automatic IP blocking after threshold
- [ ] Content auto-moderation by keywords
