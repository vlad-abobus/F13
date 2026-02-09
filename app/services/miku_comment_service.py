"""
Сервис автоматических комментариев Miku
Генерирует комментарии к собственным постам один раз в день
"""
from app import db
from app.models.post import Post
from app.models.comment import Comment
from app.models.user import User
# MikuInteraction больше не используется - взаимодействия не сохраняются
from app.models.miku_settings import MikuSettings
from app.services.miku_service import MikuService
from datetime import datetime, timedelta
import uuid
import random

class MikuCommentService:
    """Сервис для автоматических комментариев Miku к постам"""
    
    def __init__(self):
        self.miku_service = MikuService()
        
        # Разные личности для разных дней недели
        self.day_personalities = {
            0: 'Дередере',  # Понедельник
            1: 'Цундере',  # Вторник
            2: 'Дандере',  # Среда
            3: 'Яндере',  # Четверг
            4: 'Кудере',  # Пятница
            5: 'Дередере',  # Суббота
            6: 'Дередере',  # Воскресенье
        }
    
    def get_miku_user(self):
        """Получить или создать учетную запись пользователя Miku"""
        miku = User.query.filter_by(username='MikuGPT').first()
        if not miku:
            # Создать пользователя Miku если его нет
            from app.utils.password import hash_password
            miku = User(
                id=str(uuid.uuid4()),
                username='MikuGPT',
                email='miku@freedom13.com',
                password_hash=hash_password('miku_secret_password'),
                status='verified',
                verification_type='purple',
                bio='🎵 AI помощник на базе GPT-4 🎵'
            )
            db.session.add(miku)
            db.session.commit()
        return miku
    
    def get_personality_for_today(self):
        """Получить личность на основе дня недели или переопределения настроек"""
        settings = MikuSettings.get_settings()
        if settings.personality_override:
            return settings.personality_override
        
        day_of_week = datetime.utcnow().weekday()
        return self.day_personalities.get(day_of_week, 'Дередере')
    
    def has_commented_today(self, post_id: str, miku_user_id: str) -> bool:
        """Проверить, прокомментировала ли Miku этот пост сегодня"""
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        existing_comment = Comment.query.filter_by(
            post_id=post_id,
            user_id=miku_user_id
        ).filter(
            Comment.created_at >= today_start
        ).first()
        
        return existing_comment is not None
    
    def get_previous_comments_for_learning(self, limit: int = 10):
        """Получить предыдущие комментарии Miku для обучения"""
        comments = Comment.query.join(User).filter(
            User.username == 'MikuGPT'
        ).order_by(Comment.created_at.desc()).limit(limit).all()
        
        return [c.content for c in comments]
    
    def generate_comment(self, post_content: str, personality: str) -> str:
        """Генерировать комментарий на основе содержания поста"""
        # Получить предыдущие комментарии для контекста
        previous_comments = self.get_previous_comments_for_learning(5)
        context = "\n".join(previous_comments[-3:]) if previous_comments else ""
        
        # Ограничить содержание поста для промпта
        post_preview = post_content[:300] if post_content else "пост"
        
        # Создать промпт для Miku
        prompt = f"""Ты комментариуешь пост одного из пользователей сайта. 

Пост: {post_preview}

Твоя задача:
- Написать короткий комментарий (1-3 предложения)
- Быть в характере {personality}
- Показать интерес к посту
- Использовать эмодзи если уместно
- НЕ повторять предыдущие комментарии

Предыдущие примеры твоих комментариев:
{context}

Напиши новый комментарий:"""
        
        try:
            response = self.miku_service.generate_response(
                user_id=self.get_miku_user().id,
                message=prompt,
                personality=personality,
                flirt_enabled=False,
                nsfw_enabled=False,
                rp_enabled=False
            )
            
            comment_text = response.get('response', '').strip() if response else ''
            
            # Убедиться, что у нас есть комментарий
            if not comment_text or len(comment_text.strip()) == 0:
                fallback_comments = {
                    'Дередере': 'Интересный пост! ♪',
                    'Цундере': 'Хм... неплохо.',
                    'Дандере': '...интересно...',
                    'Яндере': 'Очень интересно...',
                    'Кудере': 'Неплохо написано.'
                }
                comment_text = fallback_comments.get(personality, 'Интересный пост!')
            
            # Ограничить длину комментария
            if len(comment_text) > 500:
                comment_text = comment_text[:497] + '...'
            
            return comment_text
        except Exception as e:
            # Резервный комментарий при любой ошибке
            fallback_comments = {
                'Дередере': 'Интересный пост! ♪',
                'Цундере': 'Хм... неплохо.',
                'Дандере': '...интересно...',
                'Яндере': 'Очень интересно...',
                'Кудере': 'Неплохо написано.'
            }
            return fallback_comments.get(personality, 'Интересный пост!')
    
    def comment_on_single_post(self, post_id: str) -> bool:
        """
        Немедленно прокомментировать одинарный пост.
        Используется для автоматических комментариев при создании нового поста.
        """
        settings = MikuSettings.get_settings()
        
        # Проверить если включено
        if not settings.is_enabled:
            return False
        
        # Проверить ежедневный лимит
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_comments = Comment.query.join(User).filter(
            User.username == 'MikuGPT',
            Comment.created_at >= today_start
        ).count()
        
        if today_comments >= settings.max_comments_per_day:
            return False
        
        miku_user = self.get_miku_user()
        
        # Проверить, если уже прокомментировано на этот пост
        if self.has_commented_today(post_id, miku_user.id):
            return False
        
        post = Post.query.get(post_id)
        if not post or post.is_deleted or post.moderation_status != 'approved':
            return False
        
        # Не комментировать собственные посты Miku
        if post.user_id == miku_user.id:
            return False
        
        personality = self.get_personality_for_today()
        comment_text = self.generate_comment(post.content, personality)
        
        # Создать комментарий
        comment = Comment(
            id=str(uuid.uuid4()),
            post_id=post.id,
            user_id=miku_user.id,
            content=comment_text,
            parent_id=None
        )
        
        post.comments_count += 1
        db.session.add(comment)
        db.session.commit()
        
        return True
    
    def comment_on_own_posts(self):
        """
        Комментировать недавние одобренные посты на основе настроек.

        Исторически этот метод работал только с постами самой Miku,
        теперь он проходит по всем не удаленным, одобренным постам
        (кроме постов MikuGPT), чтобы Miku могла участвовать в жизни сообщества.
        """
        settings = MikuSettings.get_settings()
        
        # Проверить если включено
        if not settings.is_enabled:
            return 0
        
        miku_user = self.get_miku_user()
        personality = self.get_personality_for_today()
        
        # Получить посты за последние 7 дней
        days_ago = datetime.utcnow() - timedelta(days=7)
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Берем одобренные посты любых пользователей, кроме самой Miku,
        # за последние 7 дней
        miku_posts = (
            Post.query.filter_by(
                is_deleted=False,
                moderation_status='approved',
            )
            .filter(Post.user_id != miku_user.id)
            .filter(Post.created_at >= days_ago)
            .order_by(Post.created_at.desc())
            .limit(settings.max_comments_per_day)
            .all()
        )
        
        # Считать комментарии за сегодня
        today_comments = Comment.query.join(User).filter(
            User.username == 'MikuGPT',
            Comment.created_at >= today_start
        ).count()
        
        commented_count = 0
        
        for post in miku_posts:
            # Проверить ежедневный лимит
            if today_comments + commented_count >= settings.max_comments_per_day:
                break
            
            # Проверить, если уже прокомментировано сегодня
            if self.has_commented_today(post.id, miku_user.id):
                continue
            
            # Создать комментарий с надлежащей проверкой
            comment_text = self.generate_comment(post.content, personality)
            if not comment_text or len(comment_text.strip()) < 1:
                continue
            
            comment = Comment(
                id=str(uuid.uuid4()),
                post_id=post.id,
                user_id=miku_user.id,
                content=comment_text.strip(),
                parent_id=None
            )
            
            post.comments_count += 1
            db.session.add(comment)
            commented_count += 1
        
        # Обновить настройки
        settings.last_run_at = datetime.utcnow()
        settings.last_comments_count = commented_count
        db.session.commit()
        
        return commented_count

# Глобальный экземпляр
miku_comment_service = MikuCommentService()
