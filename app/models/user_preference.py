"""
User preferences model
"""
from app import db
from datetime import datetime
import uuid

class UserPreference(db.Model):
    """User preferences for personalization"""
    __tablename__ = 'user_preferences'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, unique=True, index=True)
    
    # Content preferences
    preferred_emotions = db.Column(db.String(200), default='')  # Comma-separated emotion tags
    preferred_languages = db.Column(db.String(100), default='ru')  # Preferred content language
    show_explicit = db.Column(db.Boolean, default=False)  # Show mature content
    
    # Notification preferences
    notifications_enabled = db.Column(db.Boolean, default=True)
    notify_replies = db.Column(db.Boolean, default=True)
    notify_mentions = db.Column(db.Boolean, default=True)
    notify_likes = db.Column(db.Boolean, default=False)  # Too noisy by default
    notify_follows = db.Column(db.Boolean, default=True)
    
    # Privacy preferences
    show_profile = db.Column(db.Boolean, default=True)
    allow_messages = db.Column(db.Boolean, default=True)
    show_activity = db.Column(db.Boolean, default=True)
    
    # Display preferences
    theme = db.Column(db.String(20), default='dark')  # dark, light
    posts_per_page = db.Column(db.Integer, default=20)
    compact_mode = db.Column(db.Boolean, default=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = db.relationship('User', backref='preferences', uselist=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'preferred_emotions': self.preferred_emotions.split(',') if self.preferred_emotions else [],
            'preferred_languages': self.preferred_languages,
            'show_explicit': self.show_explicit,
            'notifications': {
                'enabled': self.notifications_enabled,
                'replies': self.notify_replies,
                'mentions': self.notify_mentions,
                'likes': self.notify_likes,
                'follows': self.notify_follows,
            },
            'privacy': {
                'show_profile': self.show_profile,
                'allow_messages': self.allow_messages,
                'show_activity': self.show_activity,
            },
            'display': {
                'theme': self.theme,
                'posts_per_page': self.posts_per_page,
                'compact_mode': self.compact_mode,
            },
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }
