"""
Security utilities for enhanced protection
"""
from flask import request
import re
from app.models.ip_spam_log import IPSpamLog
from app import db
from datetime import datetime, timedelta
import hashlib

class SecurityValidator:
    """Input validation and sanitization"""
    
    # Dangerous URL patterns
    DANGEROUS_URLS = [
        r'javascript:',
        r'data:text/html',
        r'vbscript:',
        r'file://',
    ]
    
    # Spam patterns
    SPAM_KEYWORDS = [
        'viagra', 'casino', 'forex', 'crypto', 'bitcoin',
        'click here', 'free money', 'guaranteed', 'limited time',
        'act now', 'don\'t miss', 'buy now', 'order now',
    ]
    
    @staticmethod
    def validate_post_content(title, text):
        """Validate post content for security issues"""
        errors = []
        
        # Length validation
        if not title or len(title.strip()) < 3:
            errors.append("Title too short (min 3 chars)")
        elif len(title) > 500:
            errors.append("Title too long (max 500 chars)")
        
        if not text or len(text.strip()) < 5:
            errors.append("Content too short (min 5 chars)")
        elif len(text) > 10000:
            errors.append("Content too long (max 10000 chars)")
        
        # Check for dangerous URLs
        combined = f"{title} {text}".lower()
        for pattern in SecurityValidator.DANGEROUS_URLS:
            if re.search(pattern, combined):
                errors.append("Content contains suspicious URLs")
                break
        
        # Check for spam keywords (flag, don't block)
        spam_count = 0
        for keyword in SecurityValidator.SPAM_KEYWORDS:
            if keyword.lower() in combined:
                spam_count += 1
        
        if spam_count > 3:
            errors.append("Content appears to be spam")
        
        # Check for excessive links
        link_count = len(re.findall(r'http[s]?://', combined))
        if link_count > 5:
            errors.append("Too many links (max 5)")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'spam_score': spam_count,
        }
    
    @staticmethod
    def validate_username(username):
        """Validate username"""
        errors = []
        
        if not username or len(username.strip()) < 3:
            errors.append("Username too short (min 3 chars)")
        elif len(username) > 50:
            errors.append("Username too long (max 50 chars)")
        
        # Only alphanumeric, underscore, hyphen
        if not re.match(r'^[a-zA-Z0-9_-]+$', username):
            errors.append("Username contains invalid characters")
        
        # Check for reserved names
        reserved = ['admin', 'root', 'system', 'miku', 'bot']
        if username.lower() in reserved:
            errors.append("Username is reserved")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
        }
    
    @staticmethod
    def validate_email(email):
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))


class RateLimitHelper:
    """Rate limiting helpers"""
    
    @staticmethod
    def get_user_ip():
        """Get user IP from request"""
        # Check for forwarded IPs (proxy)
        if request.headers.get('X-Forwarded-For'):
            return request.headers.get('X-Forwarded-For').split(',')[0].strip()
        elif request.headers.get('X-Real-IP'):
            return request.headers.get('X-Real-IP')
        return request.remote_addr
    
    @staticmethod
    def get_ip_hash(ip):
        """Get hash of IP for anonymization"""
        return hashlib.sha256(ip.encode()).hexdigest()[:16]
    
    @staticmethod
    def check_post_cooldown(user_id, cooldown_seconds=300):
        """Check if user can post based on cooldown"""
        from app.models.user import User
        
        user = User.query.get(user_id)
        if not user or not user.last_post_time:
            return True
        
        time_since_last = datetime.utcnow() - user.last_post_time
        return time_since_last.total_seconds() >= cooldown_seconds
    
    @staticmethod
    def get_cooldown_remaining(user_id, cooldown_seconds=300):
        """Get remaining cooldown time in seconds"""
        from app.models.user import User
        
        user = User.query.get(user_id)
        if not user or not user.last_post_time:
            return 0
        
        time_since_last = datetime.utcnow() - user.last_post_time
        remaining = cooldown_seconds - time_since_last.total_seconds()
        return max(0, int(remaining))


class ContentModerationHelper:
    """Content moderation utilities"""
    
    # Profanity patterns (basic - should be replaced with ML)
    PROFANITY_PATTERNS = [
        r'\bf[u\*]ck',
        r'\bsh[i\*]t',
        r'\ba[s\*]s\b',
    ]
    
    @staticmethod
    def contains_profanity(text):
        """Check if text contains profanity"""
        text_lower = text.lower()
        for pattern in ContentModerationHelper.PROFANITY_PATTERNS:
            if re.search(pattern, text_lower):
                return True
        return False
    
    @staticmethod
    def detect_duplicate_content(user_id, content_hash, time_window_minutes=60):
        """Detect if user is posting duplicate content"""
        from app.models.post import Post
        
        cutoff_time = datetime.utcnow() - timedelta(minutes=time_window_minutes)
        
        # For now, check for exact text matches (simple approach)
        # Could use fuzzy matching for more sophisticated detection
        recent_posts = Post.query.filter(
            Post.user_id == user_id,
            Post.created_at >= cutoff_time
        ).all()
        
        for post in recent_posts:
            if hashlib.md5(post.text.encode()).hexdigest() == content_hash:
                return True
        
        return False
    
    @staticmethod
    def calculate_content_score(title, text):
        """
        Calculate content quality/risk score
        Returns: {'quality': 0-100, 'risk': 0-100, 'needs_moderation': bool}
        """
        score = {
            'quality': 50,
            'risk': 0,
            'needs_moderation': False,
        }
        
        # Quality factors
        if len(title.strip()) >= 10:
            score['quality'] += 10
        if len(text.strip()) >= 100:
            score['quality'] += 10
        
        # Risk factors
        if ContentModerationHelper.contains_profanity(f"{title} {text}"):
            score['risk'] += 30
            score['needs_moderation'] = True
        
        if len(text.split()) > 500:  # Very long posts
            score['risk'] += 5
        
        # Cap scores
        score['quality'] = min(score['quality'], 100)
        score['risk'] = min(score['risk'], 100)
        
        return score
