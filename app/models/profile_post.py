"""
Profile Post model - for wall posts (like VK)
"""
from app import db
from datetime import datetime
import uuid

class ProfilePost(db.Model):
    """Post on user's profile wall"""
    __tablename__ = 'profile_posts'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    profile_user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)  # Owner of profile
    author_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)  # Who wrote the post
    content = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String(500), nullable=True)
    likes_count = db.Column(db.Integer, default=0, nullable=False)
    comments_count = db.Column(db.Integer, default=0, nullable=False)
    is_deleted = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    profile_user = db.relationship('User', foreign_keys=[profile_user_id], backref='wall_posts')
    author = db.relationship('User', foreign_keys=[author_id], backref='written_wall_posts')
    
    def to_dict(self, include_author=True):
        """Serialize to dictionary"""
        data = {
            'id': self.id,
            'profile_user_id': self.profile_user_id,
            'content': self.content,
            'image_url': self.image_url,
            'likes_count': self.likes_count,
            'comments_count': self.comments_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_author:
            data['author'] = self.author.to_dict() if self.author else None
        return data
    
    def __repr__(self):
        return f'<ProfilePost {self.id}>'
