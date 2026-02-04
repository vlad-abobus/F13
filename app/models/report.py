"""
Report model
"""
from app import db
from datetime import datetime
import uuid

class Report(db.Model):
    """Report model"""
    __tablename__ = 'reports'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reporter_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    post_id = db.Column(db.String(36), db.ForeignKey('posts.id', ondelete='CASCADE'), nullable=True, index=True)
    comment_id = db.Column(db.String(36), db.ForeignKey('comments.id', ondelete='CASCADE'), nullable=True, index=True)
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='pending', nullable=False, index=True)  # pending, resolved, dismissed
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def to_dict(self):
        """Serialize to dictionary"""
        return {
            'id': self.id,
            'reporter_id': self.reporter_id,
            'post_id': self.post_id,
            'comment_id': self.comment_id,
            'reason': self.reason,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
