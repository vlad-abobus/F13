"""
User bookmarks model for saving favorite posts
"""
from app import db
from datetime import datetime
import uuid

class UserBookmark(db.Model):
    """User bookmarks for saving favorite posts"""
    __tablename__ = 'user_bookmarks'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    post_id = db.Column(db.String(36), db.ForeignKey('posts.id'), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = db.relationship('User', backref='bookmarks')
    post = db.relationship('Post', backref='bookmarked_by')
    
    __table_args__ = (
        db.UniqueConstraint('user_id', 'post_id', name='unique_user_bookmark'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'post_id': self.post_id,
            'created_at': self.created_at.isoformat(),
        }
