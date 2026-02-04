"""
Post model
"""
from app import db
from datetime import datetime
import uuid
import json

class Post(db.Model):
    """Post model"""
    __tablename__ = 'posts'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    content = db.Column(db.Text, nullable=False)
    theme = db.Column(db.String(50), nullable=True)
    tags = db.Column(db.Text, nullable=True)  # JSON array string
    image_url = db.Column(db.String(500), nullable=True)
    is_nsfw = db.Column(db.Boolean, default=False, nullable=False)
    is_anonymous = db.Column(db.Boolean, default=False, nullable=False)
    likes_count = db.Column(db.Integer, default=0, nullable=False)
    comments_count = db.Column(db.Integer, default=0, nullable=False)
    reposts_count = db.Column(db.Integer, default=0, nullable=False)
    views_count = db.Column(db.Integer, default=0, nullable=False)
    is_pinned = db.Column(db.Boolean, default=False, nullable=False)
    is_deleted = db.Column(db.Boolean, default=False, nullable=False)
    moderation_status = db.Column(db.String(20), default='pending', nullable=False, index=True)  # pending, approved, warned, rejected
    moderation_warning = db.Column(db.Text, nullable=True)
    moderation_checked_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    __table_args__ = (
        db.Index('idx_post_popular', 'moderation_status', 'likes_count', 'created_at'),
    )
    
    @property
    def tags_list(self):
        """Get tags as list"""
        if not self.tags:
            return []
        try:
            return json.loads(self.tags)
        except:
            return []
    
    @tags_list.setter
    def tags_list(self, value):
        """Set tags from list"""
        if value:
            self.tags = json.dumps(value)
        else:
            self.tags = None
    
    def to_dict(self, include_author=True):
        """Serialize to dictionary"""
        data = {
            'id': self.id,
            'content': self.content,
            'theme': self.theme,
            'tags': self.tags_list,
            'image_url': self.image_url,
            'is_nsfw': self.is_nsfw,
            'is_anonymous': self.is_anonymous,
            'likes_count': self.likes_count,
            'comments_count': self.comments_count,
            'reposts_count': self.reposts_count,
            'views_count': self.views_count,
            'is_pinned': self.is_pinned,
            'moderation_status': self.moderation_status,
            'moderation_warning': self.moderation_warning,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_author and not self.is_anonymous:
            data['author'] = self.author.to_dict() if self.author else None
        return data
    
    def __repr__(self):
        return f'<Post {self.id}>'
