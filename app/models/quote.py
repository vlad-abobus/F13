"""
Quote model
"""
from app import db
from datetime import datetime
import uuid

class Quote(db.Model):
    """Quote model"""
    __tablename__ = 'quotes'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    text = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(20), nullable=False)  # ironic, motivational
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def to_dict(self):
        """Serialize to dictionary"""
        return {
            'id': self.id,
            'text': self.text,
            'type': self.type,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
