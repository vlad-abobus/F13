"""
Gallery model
"""
from app import db
from datetime import datetime
import uuid

class Gallery(db.Model):
    """Gallery model"""
    __tablename__ = 'gallery'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    post_id = db.Column(db.String(36), db.ForeignKey('posts.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    image_url = db.Column(db.String(500), nullable=False)
    category = db.Column(db.String(50), nullable=True, index=True)
    is_nsfw = db.Column(db.Boolean, default=False, nullable=False)
    likes_count = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    def to_dict(self):
        """Serialize to dictionary"""
        return {
            'id': self.id,
            'post_id': self.post_id,
            'user_id': self.user_id,
            'image_url': self.image_url,
            'category': self.category,
            'is_nsfw': self.is_nsfw,
            'likes_count': self.likes_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
