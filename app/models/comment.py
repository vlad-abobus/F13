"""
Comment model
"""
from app import db
from datetime import datetime
import uuid

class Comment(db.Model):
    """Comment model"""
    __tablename__ = 'comments'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    post_id = db.Column(db.String(36), db.ForeignKey('posts.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    parent_id = db.Column(db.String(36), db.ForeignKey('comments.id', ondelete='CASCADE'), nullable=True)
    content = db.Column(db.Text, nullable=False)
    likes_count = db.Column(db.Integer, default=0, nullable=False)
    is_deleted = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    replies = db.relationship('Comment', backref=db.backref('parent', remote_side=[id]), lazy='dynamic')
    
    def to_dict(self, include_author=True, include_replies=True):
        """Serialize to dictionary"""
        data = {
            'id': self.id,
            'post_id': self.post_id,
            'content': self.content,
            'likes_count': self.likes_count,
            'parent_id': self.parent_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_author:
            data['author'] = self.author.to_dict() if self.author else None
        if include_replies:
            data['replies'] = [reply.to_dict(include_author=True, include_replies=False) for reply in self.replies.filter_by(is_deleted=False).all()]
        return data
    
    def __repr__(self):
        return f'<Comment {self.id}>'
