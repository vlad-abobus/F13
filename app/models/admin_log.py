"""
Admin Log model
"""
from app import db
from datetime import datetime
import uuid
import json

class AdminLog(db.Model):
    """Admin Log model"""
    __tablename__ = 'admin_logs'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    admin_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    action = db.Column(db.String(50), nullable=False)
    target_type = db.Column(db.String(50), nullable=False)  # user, post, comment, etc.
    target_id = db.Column(db.String(36), nullable=False)
    details = db.Column(db.Text, nullable=True)  # JSON string
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    @property
    def details_dict(self):
        """Get details as dict"""
        if not self.details:
            return {}
        try:
            return json.loads(self.details)
        except:
            return {}
    
    @details_dict.setter
    def details_dict(self, value):
        """Set details from dict"""
        self.details = json.dumps(value) if value else None
    
    def to_dict(self):
        """Serialize to dictionary"""
        return {
            'id': self.id,
            'admin_id': self.admin_id,
            'action': self.action,
            'target_type': self.target_type,
            'target_id': self.target_id,
            'details': self.details_dict,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
