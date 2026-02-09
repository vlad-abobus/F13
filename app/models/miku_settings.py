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
    max_comments_per_day = db.Column(db.Integer, default=5, nullable=False)  # Max comments per day
    personality_override = db.Column(db.String(50), nullable=True)  # Override day-based personality
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
                max_comments_per_day=5
            )
            db.session.add(settings)
            db.session.commit()
        return settings
    
    def to_dict(self):
        """Serialize to dictionary"""
        return {
            'id': self.id,
            'is_enabled': self.is_enabled,
            'max_comments_per_day': self.max_comments_per_day,
            'personality_override': self.personality_override,
            'last_run_at': self.last_run_at.isoformat() if self.last_run_at else None,
            'last_comments_count': self.last_comments_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def __repr__(self):
        return f'<MikuSettings enabled={self.is_enabled}>'
