"""
Badge models
"""
from app import db
from datetime import datetime
import uuid

class Badge(db.Model):
    """Badge model"""
    __tablename__ = 'badges'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text, nullable=True)
    icon = db.Column(db.String(10), nullable=False)  # emoji
    rarity = db.Column(db.String(20), nullable=False)  # common, rare, epic
    
    def to_dict(self):
        """Serialize to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'icon': self.icon,
            'rarity': self.rarity
        }

class UserBadge(db.Model):
    """User-Badge relationship"""
    __tablename__ = 'user_badges'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    badge_id = db.Column(db.String(36), db.ForeignKey('badges.id', ondelete='CASCADE'), nullable=False)
    awarded_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    awarded_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    
    badge = db.relationship('Badge', backref='user_badges')
    
    __table_args__ = (
        db.UniqueConstraint('user_id', 'badge_id', name='unique_user_badge'),
    )
    
    def to_dict(self):
        """Serialize to dictionary"""
        return {
            'id': self.id,
            'badge': self.badge.to_dict() if self.badge else None,
            'awarded_at': self.awarded_at.isoformat() if self.awarded_at else None,
        }
