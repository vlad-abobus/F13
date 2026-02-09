"""
Notification utilities for user engagement
"""
from app import db
from app.models.user import User
from datetime import datetime
import uuid

class NotificationManager:
    """Manage user notifications"""
    
    NOTIFICATION_TYPES = {
        'post_reply': 'Someone replied to your post',
        'post_mention': 'You were mentioned in a post',
        'post_like': 'Someone liked your post',
        'comment_reply': 'Someone replied to your comment',
        'user_follow': 'Someone started following you',
        'user_mention': 'You were mentioned',
        'system': 'System notification',
    }
    
    @staticmethod
    def should_notify_user(user_id, notification_type):
        """Check if user has notifications enabled for this type"""
        from app.models.user_preference import UserPreference
        
        prefs = UserPreference.query.filter_by(user_id=user_id).first()
        if not prefs or not prefs.notifications_enabled:
            return False
        
        # Map notification types to preference settings
        type_map = {
            'post_reply': prefs.notify_replies,
            'comment_reply': prefs.notify_replies,
            'post_mention': prefs.notify_mentions,
            'user_mention': prefs.notify_mentions,
            'post_like': prefs.notify_likes,
            'user_follow': prefs.notify_follows,
        }
        
        return type_map.get(notification_type, True)
    
    @staticmethod
    def log_activity(user_id, activity_type, related_id=None, details=None):
        """Log user activity for analytics"""
        # This would be expanded to track various user activities
        # For now, just update last activity timestamp
        user = User.query.get(user_id)
        if user:
            if activity_type == 'post':
                user.last_post_time = datetime.utcnow()
            elif activity_type == 'comment':
                user.last_comment_time = datetime.utcnow()
            db.session.commit()


class TextProcessor:
    """Text processing utilities"""
    
    @staticmethod
    def extract_mentions(text):
        """Extract @mentions from text"""
        import re
        mentions = re.findall(r'@(\w+)', text)
        return list(set(mentions))
    
    @staticmethod
    def extract_hashtags(text):
        """Extract #hashtags from text"""
        import re
        hashtags = re.findall(r'#(\w+)', text)
        return list(set(hashtags))
    
    @staticmethod
    def sanitize_html(text):
        """Remove/escape HTML from text"""
        from html import escape
        return escape(text)
    
    @staticmethod
    def truncate_text(text, length=100, suffix='...'):
        """Truncate text to length"""
        if len(text) <= length:
            return text
        return text[:length].rsplit(' ', 1)[0] + suffix
    
    @staticmethod
    def linkify_mentions(text):
        """Convert @mentions to links"""
        import re
        return re.sub(r'@(\w+)', r'[@\1]', text)
    
    @staticmethod
    def linkify_hashtags(text):
        """Convert #hashtags to links"""
        import re
        return re.sub(r'#(\w+)', r'[#\1]', text)


class DateTimeHelper:
    """DateTime utilities"""
    
    @staticmethod
    def format_time_ago(dt):
        """Format datetime as 'time ago'"""
        from datetime import datetime, timedelta
        
        if not dt:
            return 'Never'
        
        now = datetime.utcnow()
        diff = now - dt
        
        if diff < timedelta(minutes=1):
            return 'Just now'
        elif diff < timedelta(hours=1):
            mins = diff.seconds // 60
            return f'{mins}m ago'
        elif diff < timedelta(days=1):
            hours = diff.seconds // 3600
            return f'{hours}h ago'
        elif diff < timedelta(days=7):
            days = diff.days
            return f'{days}d ago'
        elif diff < timedelta(days=30):
            weeks = diff.days // 7
            return f'{weeks}w ago'
        elif diff < timedelta(days=365):
            months = diff.days // 30
            return f'{months}mo ago'
        else:
            years = diff.days // 365
            return f'{years}y ago'
    
    @staticmethod
    def is_recently_created(dt, hours=24):
        """Check if object was created recently"""
        from datetime import datetime, timedelta
        
        if not dt:
            return False
        
        return (datetime.utcnow() - dt) < timedelta(hours=hours)


class PaginationHelper:
    """Pagination utilities"""
    
    @staticmethod
    def validate_pagination_params(page=1, per_page=20, max_per_page=100):
        """Validate and normalize pagination parameters"""
        try:
            page = max(1, int(page))
            per_page = max(1, min(int(per_page), max_per_page))
        except (ValueError, TypeError):
            page = 1
            per_page = 20
        
        return page, per_page
    
    @staticmethod
    def add_pagination_headers(response, pagination):
        """Add pagination headers to response"""
        if hasattr(pagination, 'total'):
            response.headers['X-Total-Count'] = str(pagination.total)
            response.headers['X-Total-Pages'] = str(pagination.pages)
            response.headers['X-Current-Page'] = str(pagination.page)
            response.headers['X-Per-Page'] = str(pagination.per_page)
        
        return response


class APIResponseBuilder:
    """Build consistent API responses"""
    
    @staticmethod
    def success(data=None, message='Success', code=200):
        """Build success response"""
        response = {
            'success': True,
            'message': message,
        }
        if data is not None:
            response['data'] = data
        return response, code
    
    @staticmethod
    def error(message='Error', error_code='UNKNOWN_ERROR', code=400, details=None):
        """Build error response"""
        response = {
            'success': False,
            'message': message,
            'error_code': error_code,
        }
        if details:
            response['details'] = details
        return response, code
    
    @staticmethod
    def paginated(items, pagination, message='Success'):
        """Build paginated response"""
        return {
            'success': True,
            'message': message,
            'items': items,
            'pagination': {
                'page': pagination.page,
                'per_page': pagination.per_page,
                'total': pagination.total,
                'pages': pagination.pages,
            }
        }, 200
