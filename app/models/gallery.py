"""
Gallery model
"""
from app import db
from datetime import datetime
import uuid
import json

class Gallery(db.Model):
    """Gallery model"""
    __tablename__ = 'gallery'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    post_id = db.Column(db.String(36), db.ForeignKey('posts.id', ondelete='CASCADE'), nullable=True, index=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    image_url = db.Column(db.String(500), nullable=False)
    category = db.Column(db.String(50), nullable=True, index=True)
    is_nsfw = db.Column(db.Boolean, default=False, nullable=False)
    tags = db.Column(db.Text, nullable=True)  # JSON string of tags
    likes_count = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    @property
    def tags_list(self):
        """Get tags as list"""
        if not self.tags:
            return []
        try:
            tags = json.loads(self.tags) if isinstance(self.tags, str) else self.tags
            return tags if isinstance(tags, list) else []
        except:
            return []
    
    def to_dict(self):
        """Serialize to dictionary"""
        return {
            'id': self.id,
            'post_id': self.post_id,
            'user_id': self.user_id,
            'image_url': self.image_url,
            'category': self.category,
            'is_nsfw': self.is_nsfw,
            'tags': self.tags_list,
            'likes_count': self.likes_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
