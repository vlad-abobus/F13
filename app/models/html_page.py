"""
HTML Page model
"""
from app import db
from datetime import datetime
import uuid

class HtmlPage(db.Model):
    """HTML Page model for editable pages"""
    __tablename__ = 'html_pages'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug = db.Column(db.String(255), unique=True, nullable=False, index=True)  # e.g., 'about', 'rules', 'privacy'
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)  # HTML content
    language = db.Column(db.String(10), default='ru', nullable=False)  # ru, uk, kz, en
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    updated_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    
    def to_dict(self):
        """Serialize to dictionary"""
        return {
            'id': self.id,
            'slug': self.slug,
            'title': self.title,
            'content': self.content,
            'language': self.language,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'updated_by': self.updated_by,
        }
    
    def __repr__(self):
        return f'<HtmlPage {self.slug} ({self.language})>'
