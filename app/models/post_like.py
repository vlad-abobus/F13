"""
PostLike model - tracks which users have liked which posts (one like per user)
"""
from app import db
from datetime import datetime
import uuid

class PostLike(db.Model):
    """PostLike - one user can like one post only once"""
    __tablename__ = 'post_likes'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    post_id = db.Column(db.String(36), db.ForeignKey('posts.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Unique constraint: one user can like one post only once
    __table_args__ = (db.UniqueConstraint('post_id', 'user_id', name='uq_post_user_like'),)
    
    def to_dict(self):
        """Serialize to dictionary"""
        return {
            'id': self.id,
            'post_id': self.post_id,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
