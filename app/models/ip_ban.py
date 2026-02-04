"""
IP Ban model
"""
from app import db
from datetime import datetime
import uuid

class IPBan(db.Model):
    """IP Ban model for blocking IP addresses"""
    __tablename__ = 'ip_bans'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ip_address = db.Column(db.String(45), nullable=False, index=True)  # IPv6 can be up to 45 chars
    reason = db.Column(db.Text, nullable=True)
    banned_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    banned_until = db.Column(db.DateTime, nullable=True)  # None = permanent ban
    is_active = db.Column(db.Boolean, default=True, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def is_valid(self):
        """Check if ban is still active"""
        if not self.is_active:
            return False
        if self.banned_until and datetime.utcnow() > self.banned_until:
            return False
        return True
    
    def to_dict(self):
        """Serialize to dictionary"""
        return {
            'id': self.id,
            'ip_address': self.ip_address,
            'reason': self.reason,
            'banned_until': self.banned_until.isoformat() if self.banned_until else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
    
    def __repr__(self):
        return f'<IPBan {self.ip_address}>'
