"""
IP-based spam tracking model
Tracks post/comment attempts from IP addresses to detect spam patterns
"""
from app import db
from datetime import datetime
import uuid

class IPSpamLog(db.Model):
    """Log spam attempts and suspicious activity from IP addresses"""
    __tablename__ = 'ip_spam_logs'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ip_address = db.Column(db.String(45), nullable=False, index=True)  # IPv6 can be up to 45 chars
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True, index=True)
    
    # Spam event details
    event_type = db.Column(db.String(50), nullable=False)  # 'post', 'comment', 'report', 'failed_captcha'
    spam_score = db.Column(db.Integer, default=0)  # Spam analysis score
    blocked = db.Column(db.Boolean, default=False)  # Was the action blocked?
    reason = db.Column(db.String(255), nullable=True)  # Why was it blocked?
    
    # Content for analysis
    content_hash = db.Column(db.String(64), nullable=True)  # SHA256 of content for duplicate detection
    content_preview = db.Column(db.String(200), nullable=True)  # First 200 chars of content
    
    # Request context
    user_agent = db.Column(db.String(500), nullable=True)
    referer = db.Column(db.String(500), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    __table_args__ = (
        db.Index('idx_ip_spam_search', 'ip_address', 'created_at'),
        db.Index('idx_user_spam_search', 'user_id', 'created_at'),
    )
    
    def to_dict(self):
        """Serialize to dictionary"""
        return {
            'id': self.id,
            'ip_address': self.ip_address,
            'user_id': self.user_id,
            'event_type': self.event_type,
            'spam_score': self.spam_score,
            'blocked': self.blocked,
            'reason': self.reason,
            'content_preview': self.content_preview,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
    
    def __repr__(self):
        return f'<IPSpamLog {self.ip_address} - {self.event_type}>'
