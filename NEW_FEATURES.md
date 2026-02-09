# New Features & Improvements Documentation

## Overview
This document describes the new features and improvements added to Freedom13.

## 1. Search & Discovery Features

### Search Endpoints

#### Search Posts
```
GET /api/search/posts?q=query&emotion=HP&sort_by=popular&page=1&per_page=20
```

**Parameters:**
- `q`: Search query
- `emotion`: Filter by emotion (HP, AG, NT)
- `sort_by`: new, popular, trending, relevant
- `date_range`: Filter by days (e.g., 7, 30)
- `author`: Filter by username
- `min_likes`: Minimum likes
- `max_likes`: Maximum likes
- `page`: Page number
- `per_page`: Items per page (max 100)

#### Search Users
```
GET /api/search/users?q=username&page=1&per_page=20
```

#### Get Trending Posts
```
GET /api/search/trending?emotion=HP&days=7&limit=20
```

#### Get Recommended Posts
```
GET /api/search/recommended?limit=20
```
*Requires authentication*

### Bookmarks
Save favorite posts for later viewing.

```
GET /api/search/bookmarks                    # Get all bookmarks
POST /api/search/bookmarks/<post_id>         # Add bookmark
DELETE /api/search/bookmarks/<post_id>       # Remove bookmark
GET /api/search/bookmarks/<post_id>/check    # Check if bookmarked
```

---

## 2. User Preferences & Personalization

### Manage User Preferences
```
GET /api/preferences                         # Get preferences
PUT /api/preferences                         # Update preferences
POST /api/preferences/reset                  # Reset to defaults
```

### Preference Options

```javascript
{
  "preferred_emotions": ["HP", "AG"],
  "preferred_languages": "en",
  "show_explicit": false,
  "notifications": {
    "enabled": true,
    "replies": true,
    "mentions": true,
    "likes": false,
    "follows": true
  },
  "privacy": {
    "show_profile": true,
    "allow_messages": true,
    "show_activity": true
  },
  "display": {
    "theme": "dark",
    "posts_per_page": 20,
    "compact_mode": false
  }
}
```

---

## 3. Admin Analytics & Reporting

### Dashboard
```
GET /api/analytics/dashboard
```

Returns comprehensive admin dashboard data.

### Specific Analytics

```
GET /api/analytics/users        # User statistics
GET /api/analytics/content      # Content statistics
GET /api/analytics/moderation   # Moderation activity (days param)
GET /api/analytics/engagement   # User engagement metrics (days param)
GET /api/analytics/health       # System health status
```

### Statistics Included

**User Stats:**
- Total users, active users (7 days)
- Banned/muted users count
- Admin users, verified users
- Verification rate

**Content Stats:**
- Total posts by status (approved, pending, rejected)
- Comments count
- Average likes/comments per post
- Top emotions/themes

**Moderation Stats:**
- Actions by type and admin
- Most problematic users
- Activity trends over time

**Engagement Metrics:**
- Daily active users
- Posts per day
- Comments per day
- Trend analysis

**System Health:**
- Database connection status
- Pending moderation items
- Muted users percentage
- System alerts

---

## 4. Enhanced Security Features

### Input Validation
- Username validation (alphanumeric, no reserved names)
- Email format validation
- Post/comment content validation
- URL and profanity detection
- Spam keyword detection

### Rate Limiting Helpers
- Post cooldown checks
- IP-based rate limiting
- Cooldown remaining time calculation

### Content Moderation
- Duplicate content detection
- Content quality/risk scoring
- Profanity detection
- Harmful URL detection

---

## 5. Performance Optimizations

### Caching System
- Trending posts cache (15 min)
- User stats cache (30 min)
- Content stats cache (30 min)
- Post data cache (1 hour)
- User profile cache (6 hours)

### Query Optimization
- Optimized trending posts query
- Efficient user feed queries
- Minimized data transfer for search
- Index-friendly filters

---

## 6. Utility Services

### Text Processing
- Extract mentions (@username)
- Extract hashtags (#tag)
- HTML sanitization
- Text truncation
- Mention/hashtag linkification

### DateTime Utilities
- "Time ago" formatting
- Recent content detection
- DateTime arithmetic helpers

### Pagination Helpers
- Pagination parameter validation
- Response header management
- Consistent pagination format

### API Response Builder
- Standardized success responses
- Standardized error responses
- Paginated response formatting

---

## Database Models Added

### UserBookmark
Store user's bookmarked posts
```sql
- id (UUID)
- user_id (FK)
- post_id (FK)
- created_at
- Unique constraint on (user_id, post_id)
```

### UserPreference
Store user preferences and settings
```sql
- id (UUID)
- user_id (FK, unique)
- Emotion preferences
- Language preferences
- Notification settings
- Privacy settings
- Display preferences
- created_at, updated_at
```

---

## API Documentation Examples

### Search with Filters
```bash
# Search for manga posts from popular users in last 7 days
GET /api/search/posts?q=manga&emotion=HP&sort_by=trending&date_range=7

# Search users by partial username
GET /api/search/users?q=miku

# Get trending posts in last 30 days
GET /api/search/trending?days=30&limit=50
```

### Bookmarks
```bash
# Save a post
POST /api/search/bookmarks/post123

# Get all bookmarks
GET /api/search/bookmarks?page=1&per_page=20

# Check if post is bookmarked
GET /api/search/bookmarks/post123/check

# Remove bookmark
DELETE /api/search/bookmarks/post123
```

### Preferences
```bash
# Get my preferences
GET /api/preferences

# Update notification settings
PUT /api/preferences
{
  "notifications": {
    "replies": true,
    "mentions": true,
    "likes": false
  }
}

# Set preferred theme
PUT /api/preferences
{
  "display": {
    "theme": "light"
  }
}
```

### Admin Analytics
```bash
# Get complete dashboard
GET /api/analytics/dashboard

# Get engagement metrics for last 14 days
GET /api/analytics/engagement?days=14

# Get moderation stats
GET /api/analytics/moderation?days=7

# Check system health
GET /api/analytics/health
```

---

## Integration Notes

1. All new endpoints follow existing authentication patterns
2. Error handling uses standard formats
3. Pagination uses consistent structure
4. Caching is transparent to API consumers
5. Analytics endpoints are restricted to admins only

## Future Enhancements

- Real-time notifications WebSocket support
- Advanced ML-based recommendations
- User activity feed
- Custom dashboard widgets
- Export analytics to CSV/PDF
- Scheduled report emails
- A/B testing framework
- Advanced search filters with saved searches
