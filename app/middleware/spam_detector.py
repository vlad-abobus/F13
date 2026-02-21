"""
Spam Detector - детектирование спама и вредоносного контента
"""

import re
import logging
from datetime import datetime, timedelta
from app import db
from app.models.user import User
from app.models.post import Post
from app.models.comment import Comment

logger = logging.getLogger(__name__)


class SpamPatterns:
    """Паттерны для детектирования спама"""
    
    # Паттерны для спама
    SPAM_KEYWORDS = [
        r'click here', r'buy now', r'limited offer', r'act now',
        r'viagra', r'casino', r'forex', r'crypto', r'nft',
        r'discount.*%', r'sale.*%', r'promotion',
        r'free money', r'earn cash', r'make money fast'
    ]
    
    SPAM_URLS = [
        r'bit\.ly', r'tinyurl', r'short\.link',
        r'affiliate', r'referral', r'promo'
    ]
    
    # Паттерны для phishing
    PHISHING_KEYWORDS = [
        r'confirm.*password', r'verify.*account', r'click.*link',
        r'update.*payment', r'unusual.*activity',
        r'suspend.*account', r'limited.*time'
    ]
    
    # Паттерны для малware
    MALWARE_KEYWORDS = [
        r'\.exe', r'\.bat', r'\.cmd', r'\.ps1',
        r'cmd\.exe', r'powershell', r'registry', r'system32'
    ]
    
    # Слова для культурного контроля
    PROFANITY_KEYWORDS = [
        r'ass', r'damn', r'hell', r'shit'  # Примеры, добавьте более полный список
    ]


class SpamDetector:
    """Класс для детектирования спама"""
    
    @staticmethod
    def clean_text(text: str) -> str:
        """Очистить текст от спец символов"""
        text = re.sub(r'[^a-zA-Z0-9\s]', '', text.lower())
        return text
    
    @staticmethod
    def extract_urls(text: str) -> list:
        """Извлечь URL из текста"""
        urls = re.findall(r'https?://[^\s]+', text)
        return urls
    
    @staticmethod
    def check_spam_content(text: str) -> dict:
        """Проверить контент на спам"""
        checks = {
            'is_spam': False,
            'reasons': [],
            'score': 0
        }
        
        if not text or len(text) < 3:
            return checks
        
        text_lower = text.lower()
        
        # Проверка 1: Ключевые слова спама
        for pattern in SpamPatterns.SPAM_KEYWORDS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                checks['score'] += 15
                checks['reasons'].append(f'Spam keyword detected: {pattern}')
        
        # Проверка 2: Подозрительные URL
        urls = SpamDetector.extract_urls(text)
        if urls:
            for url in urls:
                for pattern in SpamPatterns.SPAM_URLS:
                    if re.search(pattern, url, re.IGNORECASE):
                        checks['score'] += 20
                        checks['reasons'].append(f'Suspicious URL: {url}')
                        checks['is_spam'] = True
        
        # Проверка 3: Phishing попытки
        for pattern in SpamPatterns.PHISHING_KEYWORDS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                checks['score'] += 25
                checks['reasons'].append(f'Phishing attempt: {pattern}')
                checks['is_spam'] = True
        
        # Проверка 4: Malware сигнатуры
        for pattern in SpamPatterns.MALWARE_KEYWORDS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                checks['score'] += 30
                checks['reasons'].append(f'Malware signature: {pattern}')
                checks['is_spam'] = True
        
        # Проверка 5: Профанность
        for pattern in SpamPatterns.PROFANITY_KEYWORDS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                checks['score'] += 10
                checks['reasons'].append(f'Profanity detected: {pattern}')
        
        # Проверка 6: Повторяющиеся символы
        if re.search(r'(.)\1{5,}', text):  # Более 5 повторений
            checks['score'] += 10
            checks['reasons'].append('Excessive character repetition')
        
        # Проверка 7: Капслок
        uppercase_ratio = sum(1 for c in text if c.isupper()) / len(text) if text else 0
        if uppercase_ratio > 0.8:
            checks['score'] += 5
            checks['reasons'].append('Excessive uppercase letters')
        
        # Определяем если это спам
        if checks['score'] > 40:
            checks['is_spam'] = True
        
        return checks
    
    @staticmethod
    def check_user_spam_behavior(user_id: str) -> dict:
        """Проверить поведение пользователя на спам"""
        checks = {
            'is_spammer': False,
            'reasons': [],
            'score': 0
        }
        
        user = User.query.get(user_id)
        if not user:
            return checks
        
        # Проверка 1: Много постов за короткий время
        recent_posts = Post.query.filter(
            Post.user_id == user_id,
            Post.created_at >= datetime.utcnow() - timedelta(hours=1)
        ).count()
        
        if recent_posts > 10:
            checks['score'] += 20
            checks['reasons'].append(f'Too many posts in 1 hour: {recent_posts}')
        
        # Проверка 2: Много комментариев за короткий время
        recent_comments = Comment.query.filter(
            Comment.user_id == user_id,
            Comment.created_at >= datetime.utcnow() - timedelta(hours=1)
        ).count()
        
        if recent_comments > 30:
            checks['score'] += 20
            checks['reasons'].append(f'Too many comments in 1 hour: {recent_comments}')
        
        # Проверка 3: Проверить если много одинаковых постов
        recent_posts_content = db.session.query(Post.content).filter(
            Post.user_id == user_id,
            Post.created_at >= datetime.utcnow() - timedelta(days=1)
        ).all()
        
        if len(recent_posts_content) > 3:
            contents = [p[0] for p in recent_posts_content]
            unique_contents = set(contents)
            
            if len(unique_contents) < len(contents) * 0.3:  # Менее 30% уникального контента
                checks['score'] += 30
                checks['reasons'].append('Duplicate content detected')
                checks['is_spammer'] = True
        
        # Проверка 4: Всегда ссылки в постах
        link_posts = Post.query.filter(
            Post.user_id == user_id,
            Post.created_at >= datetime.utcnow() - timedelta(days=1)
        ).all()
        
        link_count = sum(1 for p in link_posts if 'http' in (p.content or '').lower())
        if len(link_posts) > 5 and link_count / len(link_posts) > 0.9:
            checks['score'] += 25
            checks['reasons'].append('Posts mostly contain links')
            checks['is_spammer'] = True
        
        if checks['score'] > 40:
            checks['is_spammer'] = True
        
        return checks
    
    @staticmethod
    def check_cross_post_spam(user_id: str, content: str) -> dict:
        """Проверить если пользователь спамит один контент везде"""
        checks = {
            'is_cross_spam': False,
            'reasons': [],
            'score': 0
        }
        
        # Проверить если этот контент уже был опубликован
        similar_posts = Post.query.filter(
            Post.user_id == user_id,
            Post.content == content,
            Post.created_at >= datetime.utcnow() - timedelta(days=7)
        ).count()
        
        if similar_posts > 2:
            checks['is_cross_spam'] = True
            checks['score'] += 30
            checks['reasons'].append(f'Same content posted {similar_posts} times in 7 days')
        
        return checks
    
    @staticmethod
    def log_spam_report(user_id: str, content_type: str, reason: str, details: dict = None):
        """Логировать отчет о спаме"""
        logger.warning({
            'event': 'spam_detected',
            'user_id': user_id,
            'content_type': content_type,
            'reason': reason,
            'details': details or {},
            'timestamp': datetime.utcnow().isoformat()
        })


def check_spam(content_field='content'):
    """Декоратор для проверки спама"""
    from functools import wraps
    
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            from flask import request
            
            data = request.get_json() or {}
            content = data.get(content_field, '')
            user_id = getattr(request, 'current_user', {}).id if hasattr(request, 'current_user') else None
            
            # Проверка на спам контент
            spam_check = SpamDetector.check_spam_content(content)
            
            if spam_check['is_spam']:
                logger.warning(f"🚫 Спам обнаружен от пользователя {user_id}: {spam_check['reasons']}")
                SpamDetector.log_spam_report(user_id, f.__name__, 'Spam content', spam_check)
                
                return {
                    'error': 'Your content was flagged as spam.',
                    'reasons': spam_check['reasons']
                }, 400
            
            # Проверка поведения пользователя
            if user_id:
                behavior_check = SpamDetector.check_user_spam_behavior(user_id)
                
                if behavior_check['is_spammer']:
                    logger.warning(f"🚫 Спаммер обнаружен {user_id}: {behavior_check['reasons']}")
                    SpamDetector.log_spam_report(user_id, 'user_behavior', 'Spam behavior', behavior_check)
                    
                    return {
                        'error': 'Your account has been flagged for spam behavior.',
                        'reasons': behavior_check['reasons']
                    }, 429
            
            return f(*args, **kwargs)
        
        return decorated
    return decorator
