"""
Miku Auto Comment Settings model
"""
from app import db
from datetime import datetime
import uuid

class MikuSettings(db.Model):
    """Settings for Miku auto-comment feature"""
    __tablename__ = 'miku_settings'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    is_enabled = db.Column(db.Boolean, default=True, nullable=False)
    comment_interval_hours = db.Column(db.Integer, default=24, nullable=False)  # How often to comment
    max_comments_per_day = db.Column(db.Integer, default=5, nullable=False)  # Max comments per day
    posts_age_days = db.Column(db.Integer, default=7, nullable=False)  # Comment on posts from last N days
    personality_override = db.Column(db.String(50), nullable=True)  # Override day-based personality
    enabled_days = db.Column(db.String(20), default='0123456', nullable=False)  # Days of week (0=Monday, 6=Sunday)
    last_run_at = db.Column(db.DateTime, nullable=True)
    last_comments_count = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    @classmethod
    def get_settings(cls):
        """Get or create default settings"""
        settings = cls.query.first()
        if not settings:
            settings = cls(
                id=str(uuid.uuid4()),
                is_enabled=True,
                comment_interval_hours=24,
                max_comments_per_day=5,
                posts_age_days=7,
                enabled_days='0123456'
            )
            db.session.add(settings)
            db.session.commit()
        return settings
    
    def to_dict(self):
        """Serialize to dictionary"""
        return {
            'id': self.id,
            'is_enabled': self.is_enabled,
            'comment_interval_hours': self.comment_interval_hours,
            'max_comments_per_day': self.max_comments_per_day,
            'posts_age_days': self.posts_age_days,
            'personality_override': self.personality_override,
            'enabled_days': self.enabled_days,
            'last_run_at': self.last_run_at.isoformat() if self.last_run_at else None,
            'last_comments_count': self.last_comments_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def __repr__(self):
        return f'<MikuSettings enabled={self.is_enabled}>'
