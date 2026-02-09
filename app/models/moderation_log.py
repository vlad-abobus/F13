"""
Moderation Log model - track all admin actions
"""
from app import db
from datetime import datetime
import uuid

class ModerationLog(db.Model):
    """Moderation actions audit log"""
    __tablename__ = 'moderation_logs'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    admin_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    action = db.Column(db.String(50), nullable=False)  # ban, unban, warn, kick, mute, restrict, etc
    reason = db.Column(db.Text, nullable=True)
    details = db.Column(db.JSON, nullable=True)  # Extra info (duration, old_value, etc)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    admin = db.relationship('User', foreign_keys=[admin_id], backref='moderation_actions')
    user = db.relationship('User', foreign_keys=[user_id], backref='moderation_history')
    
    def to_dict(self):
        """Serialize to dictionary"""
        return {
            'id': self.id,
            'admin_id': self.admin_id,
            'admin_username': self.admin.username if self.admin else 'Unknown',
            'user_id': self.user_id,
            'user_username': self.user.username if self.user else 'Unknown',
            'action': self.action,
            'reason': self.reason,
            'details': self.details,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
    
    def __repr__(self):
        return f'<ModerationLog {self.action} on {self.user_id}>'
