"""
MikuInteraction model
"""
from app import db
from datetime import datetime
import uuid

class MikuInteraction(db.Model):
    """MikuInteraction model"""
    __tablename__ = 'miku_interactions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    post_id = db.Column(db.String(36), db.ForeignKey('posts.id', ondelete='CASCADE'), nullable=True, index=True)
    comment_id = db.Column(db.String(36), db.ForeignKey('comments.id', ondelete='CASCADE'), nullable=True, index=True)
    response_text = db.Column(db.Text, nullable=False)
    emotion = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    def to_dict(self):
        """Serialize to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'post_id': self.post_id,
            'comment_id': self.comment_id,
            'response_text': self.response_text,
            'emotion': self.emotion,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
