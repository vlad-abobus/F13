"""
Spam prevention and detection service
"""
import re
from datetime import datetime, timedelta
from app import db
from app.models.post import Post
from app.models.comment import Comment
from app.models.user import User
from app.models.ip_ban import IPBan

# List of common spam keywords/phrases
SPAM_KEYWORDS = {
    # Cryptocurrency spam
    'bitcoin', 'ethereum', 'crypto', 'nft', 'blockchain', 'wallet',
    'free bitcoin', 'earn crypto', 'buy bitcoin', 'mining',
    # Financial scams
    'nigerian prince', 'western union', 'money transfer', 'wire transfer',
    'paypal verified', 'click here now', 'limited time offer',
    # Adult content spam
    'xxx', 'porn', 'sex cam', 'adult cam', 'hot singles',
    # Malware/phishing
    'click link', 'verify account', 'confirm identity', 'update payment',
    'suspicious activity', 'unusual activity', 'click here immediately',
    # Generic spam
    'congratulations won', 'claim prize', 'click here', 'http', 'www',
    'best prices', 'act now', 'urgent', 'call now', 'contact now',
    # Russian/Ukrainian spam keywords
    'заработок', 'вклады', 'инвестиции', 'богатство', 'успех',
    'быстрые деньги', 'легкие деньги', 'без вложений',
}

# URL regex pattern
URL_PATTERN = re.compile(
    r'https?://(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&/=]*)',
    re.IGNORECASE
)

# Short link patterns (bit.ly, tinyurl, etc.)
SHORT_LINK_PATTERN = re.compile(
    r'(?:bit\.ly|tinyurl|goo\.gl|ow\.ly|is\.gd|short\.link|linktr\.ee)[\w/]*',
    re.IGNORECASE
)


class SpamDetector:
    """Spam detection and prevention utility class"""
    
    @staticmethod
    def normalize_text(text: str) -> str:
        """Normalize text for comparison"""
        return text.strip().lower()
    
    @staticmethod
    def check_duplicate_content(user_id: str, content: str, minutes: int = 5) -> bool:
        """
        Check if user posted identical or similar content recently
        Args:
            user_id: User ID
            content: Post/comment content
            minutes: Time window to check (default 5 minutes)
        Returns:
            True if duplicate found, False otherwise
        """
        normalized_content = SpamDetector.normalize_text(content)
        time_threshold = datetime.utcnow() - timedelta(minutes=minutes)
        
        # Check recent posts
        recent_posts = Post.query.filter_by(
            user_id=user_id,
            is_deleted=False
        ).filter(
            Post.created_at >= time_threshold
        ).all()
        
        for post in recent_posts:
            if SpamDetector.normalize_text(post.content) == normalized_content:
                return True
        
        # Check recent comments
        recent_comments = Comment.query.filter_by(
            user_id=user_id,
            is_deleted=False
        ).filter(
            Comment.created_at >= time_threshold
        ).all()
        
        for comment in recent_comments:
            if SpamDetector.normalize_text(comment.content) == normalized_content:
                return True
        
        return False
    
    @staticmethod
    def check_spam_keywords(content: str) -> list:
        """
        Check if content contains common spam keywords
        Args:
            content: Post/comment content
        Returns:
            List of spam keywords found, empty list if none
        """
        text_lower = content.lower()
        found_keywords = []
        
        for keyword in SPAM_KEYWORDS:
            # Use word boundaries for whole word matching
            pattern = r'\b' + re.escape(keyword) + r'\b'
            if re.search(pattern, text_lower):
                found_keywords.append(keyword)
        
        return found_keywords
    
    @staticmethod
    def count_urls(content: str) -> dict:
        """
        Count URLs and short links in content
        Args:
            content: Post/comment content
        Returns:
            Dict with 'full_urls' and 'short_links' counts
        """
        full_urls = len(URL_PATTERN.findall(content))
        short_links = len(SHORT_LINK_PATTERN.findall(content))
        
        return {
            'full_urls': full_urls,
            'short_links': short_links,
            'total_urls': full_urls + short_links
        }
    
    @staticmethod
    def check_excessive_urls(content: str, max_urls: int = 2) -> bool:
        """
        Check if content has too many URLs
        Args:
            content: Post/comment content
            max_urls: Maximum allowed URLs (default 2)
        Returns:
            True if excessive URLs found, False otherwise
        """
        url_counts = SpamDetector.count_urls(content)
        return url_counts['total_urls'] > max_urls
    
    @staticmethod
    def get_spam_score(content: str, user_id: str = None) -> dict:
        """
        Calculate spam score for content
        Args:
            content: Post/comment content
            user_id: User ID (optional, for additional checks)
        Returns:
            Dict with 'score', 'level', and 'reasons'
        """
        score = 0
        reasons = []
        
        # Check spam keywords (2 points each)
        spam_keywords = SpamDetector.check_spam_keywords(content)
        if spam_keywords:
            score += len(spam_keywords) * 2
            reasons.append(f"Spam keywords detected: {', '.join(spam_keywords[:3])}")
        
        # Check excessive URLs (5 points)
        url_counts = SpamDetector.count_urls(content)
        if url_counts['total_urls'] > 2:
            score += 5
            reasons.append(f"Too many URLs: {url_counts['total_urls']}")
        
        # Check for excessive caps (1 point per 10%)
        if len(content) > 10:
            caps_ratio = sum(1 for c in content if c.isupper()) / len(content)
            if caps_ratio > 0.3:  # More than 30% caps
                score += 3
                reasons.append("Excessive capitals")
        
        # Check for repeated characters (1 point)
        if re.search(r'(.)\1{3,}', content):  # 4+ repeated chars
            score += 2
            reasons.append("Repeated characters")
        
        # Check short content with URLs (1 point)
        if len(content) < 20 and url_counts['total_urls'] > 0:
            score += 3
            reasons.append("Short content with URLs (link spam)")
        
        # Determine spam level
        if score < 3:
            level = 'safe'
        elif score < 7:
            level = 'suspicious'
        else:
            level = 'likely_spam'
        
        return {
            'score': score,
            'level': level,
            'reasons': reasons
        }


class IPSpamTracker:
    """Track spam patterns from IP addresses"""
    
    @staticmethod
    def track_post_attempt(ip_address: str, user_id: str, success: bool = True) -> dict:
        """
        Track post attempts from IP
        Args:
            ip_address: IP address making the request
            user_id: User ID
            success: Whether the post was successful
        Returns:
            Dict with spam status
        """
        from app.models.ip_ban import IPBan
        
        # Check if IP is already banned
        ban = IPBan.query.filter_by(ip_address=ip_address).first()
        if ban and ban.is_active:
            time_remaining = (ban.expires_at - datetime.utcnow()).total_seconds()
            if time_remaining > 0:
                return {
                    'blocked': True,
                    'reason': 'IP temporarily blocked due to spam',
                    'expires_in': int(time_remaining)
                }
            else:
                # Ban expired
                ban.is_active = False
                db.session.commit()
        
        # Track failed attempts (CAPTCHA failures, etc.)
        if not success:
            # TODO: Implement failed attempt tracking
            # Consider banning after N failed attempts
            pass
        
        return {
            'blocked': False
        }
    
    @staticmethod
    def check_spam_flood(ip_address: str, minutes: int = 10) -> dict:
        """
        Check for spam flood from single IP
        Args:
            ip_address: IP address to check
            minutes: Time window to check
        Returns:
            Dict with flood status
        """
        time_threshold = datetime.utcnow() - timedelta(minutes=minutes)
        
        # Count posts from this IP in time window
        posts_count = Post.query.join(User).filter(
            User.ip_address == ip_address,
            Post.created_at >= time_threshold
        ).count() if hasattr(User, 'ip_address') else 0
        
        # This would need to be tracked in a separate table
        # For now, return basic threshold
        threshold = 10  # Max 10 posts per 10 minutes from one IP
        
        return {
            'flooded': posts_count > threshold,
            'count': posts_count,
            'threshold': threshold
        }
