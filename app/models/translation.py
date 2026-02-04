"""
Translation model
"""
from app import db
from datetime import datetime
import uuid

class Translation(db.Model):
    """Translation model for i18n"""
    __tablename__ = 'translations'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    key = db.Column(db.String(255), nullable=False, index=True)
    language = db.Column(db.String(10), nullable=False, index=True)  # ru, uk, kz, en
    value = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(100), nullable=True, index=True)  # common, pages, buttons, etc.
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    __table_args__ = (db.UniqueConstraint('key', 'language', name='_key_language_uc'),)
    
    def to_dict(self):
        """Serialize to dictionary"""
        return {
            'id': self.id,
            'key': self.key,
            'language': self.language,
            'value': self.value,
            'category': self.category,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def __repr__(self):
        return f'<Translation {self.key} ({self.language})>'
