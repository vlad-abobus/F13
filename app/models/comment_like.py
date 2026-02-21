"""
CommentLike model - tracks which users have liked which comments (one like per user)
"""
from app import db
from datetime import datetime
import uuid

class CommentLike(db.Model):
    """CommentLike - one user can like one comment only once"""
    __tablename__ = 'comment_likes'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    comment_id = db.Column(db.String(36), db.ForeignKey('comments.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Unique constraint: one user can like one comment only once
    __table_args__ = (db.UniqueConstraint('comment_id', 'user_id', name='uq_comment_user_like'),)
    
    def to_dict(self):
        """Serialize to dictionary"""
        return {
            'id': self.id,
            'comment_id': self.comment_id,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
