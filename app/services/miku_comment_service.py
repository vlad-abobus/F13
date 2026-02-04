"""
Miku Auto Comment Service
Generates comments on Miku's own posts once per day
"""
from app import db
from app.models.post import Post
from app.models.comment import Comment
from app.models.user import User
# MikuInteraction is no longer used - interactions are not saved
from app.models.miku_settings import MikuSettings
from app.services.miku_service import MikuService
from datetime import datetime, timedelta
import uuid
import random

class MikuCommentService:
    """Service for Miku to automatically comment on her own posts"""
    
    def __init__(self):
        self.miku_service = MikuService()
        
        # Different personalities for different days of week
        self.day_personalities = {
            0: 'Дередере',  # Monday
            1: 'Цундере',  # Tuesday
            2: 'Дандере',  # Wednesday
            3: 'Яндере',  # Thursday
            4: 'Кудере',  # Friday
            5: 'Дередере',  # Saturday
            6: 'Дередере',  # Sunday
        }
    
    def get_miku_user(self):
        """Get or create Miku user account"""
        miku = User.query.filter_by(username='MikuGPT').first()
        if not miku:
            # Create Miku user if doesn't exist
            from app.utils.password import hash_password
            miku = User(
                id=str(uuid.uuid4()),
                username='MikuGPT',
                email='miku@freedom13.com',
                password_hash=hash_password('miku_secret_password'),
                status='verified',
                verification_type='purple',
                bio='🎵 AI Assistant powered by GPT-4 🎵'
            )
            db.session.add(miku)
            db.session.commit()
        return miku
    
    def get_personality_for_today(self):
        """Get personality based on day of week or settings override"""
        settings = MikuSettings.get_settings()
        if settings.personality_override:
            return settings.personality_override
        
        day_of_week = datetime.utcnow().weekday()
        return self.day_personalities.get(day_of_week, 'Дередере')
    
    def has_commented_today(self, post_id: str, miku_user_id: str) -> bool:
        """Check if Miku has already commented on this post today"""
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        existing_comment = Comment.query.filter_by(
            post_id=post_id,
            user_id=miku_user_id
        ).filter(
            Comment.created_at >= today_start
        ).first()
        
        return existing_comment is not None
    
    def get_previous_comments_for_learning(self, limit: int = 10):
        """Get previous comments from Miku to learn from"""
        comments = Comment.query.join(User).filter(
            User.username == 'MikuGPT'
        ).order_by(Comment.created_at.desc()).limit(limit).all()
        
        return [c.content for c in comments]
    
    def generate_comment(self, post_content: str, personality: str) -> str:
        """Generate a comment based on post content"""
        # Get previous comments for context
        previous_comments = self.get_previous_comments_for_learning(5)
        context = "\n".join(previous_comments[-3:]) if previous_comments else ""
        
        # Create prompt for Miku
        prompt = f"""Ты комментируешь свой собственный пост. 

Пост: {post_content[:500]}

Твоя задача:
- Написать короткий комментарий (1-3 предложения)
- Быть в характере {personality}
- Показать интерес к посту
- Использовать эмодзи если уместно

Предыдущие комментарии для контекста:
{context}

Напиши комментарий:"""
        
        try:
            response = self.miku_service.generate_response(
                user_id=self.get_miku_user().id,
                message=prompt,
                personality=personality,
                emotion_set='A',
                flirt_enabled=False,
                nsfw_enabled=False,
                rp_enabled=False
            )
            
            comment_text = response.get('response', 'Цікавий пост! ♪')
            # Limit comment length
            if len(comment_text) > 500:
                comment_text = comment_text[:500] + '...'
            
            return comment_text
        except Exception as e:
            # Fallback comment
            fallback_comments = {
                'Дередере': 'Цікавий пост! ♪',
                'Цундере': 'Хм... непогано.',
                'Дандере': '...цікаво...',
                'Яндере': 'Дуже цікаво...',
                'Кудере': 'Непогано написано.'
            }
            return fallback_comments.get(personality, 'Цікавий пост!')
    
    def comment_on_own_posts(self):
        """Comment on Miku's own posts based on settings"""
        settings = MikuSettings.get_settings()
        
        # Check if enabled
        if not settings.is_enabled:
            return 0
        
        # Check if should run today
        day_of_week = str(datetime.utcnow().weekday())
        if day_of_week not in settings.enabled_days:
            return 0
        
        # Check interval (if last run was too recent)
        if settings.last_run_at:
            hours_since_last_run = (datetime.utcnow() - settings.last_run_at).total_seconds() / 3600
            if hours_since_last_run < settings.comment_interval_hours:
                return 0
        
        miku_user = self.get_miku_user()
        personality = self.get_personality_for_today()
        
        # Get Miku's posts from last N days (from settings)
        days_ago = datetime.utcnow() - timedelta(days=settings.posts_age_days)
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        miku_posts = Post.query.filter_by(
            user_id=miku_user.id,
            is_deleted=False,
            moderation_status='approved'
        ).filter(
            Post.created_at >= days_ago
        ).order_by(Post.created_at.desc()).limit(settings.max_comments_per_day).all()
        
        commented_count = 0
        
        for post in miku_posts:
            # Check if already commented today
            if self.has_commented_today(post.id, miku_user.id):
                continue
            
            # Check daily limit
            if commented_count >= settings.max_comments_per_day:
                break
            
            # Generate comment
            comment_text = self.generate_comment(post.content, personality)
            
            # Create comment
            comment = Comment(
                id=str(uuid.uuid4()),
                post_id=post.id,
                user_id=miku_user.id,
                content=comment_text,
                parent_id=None
            )
            
            post.comments_count += 1
            db.session.add(comment)
            commented_count += 1
            
            # Interactions are NOT saved to database
        
        # Update settings
        settings.last_run_at = datetime.utcnow()
        settings.last_comments_count = commented_count
        db.session.commit()
        
        return commented_count

# Global instance
miku_comment_service = MikuCommentService()
