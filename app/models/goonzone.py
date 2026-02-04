"""
GoonZone models (Polls, News, Docs, Rules)
"""
from app import db
from datetime import datetime
import uuid
import json

class GoonZonePoll(db.Model):
    """Poll model"""
    __tablename__ = 'goonzone_polls'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    options = db.Column(db.Text, nullable=False)  # JSON array string
    votes = db.Column(db.Text, nullable=False)  # JSON dict string
    expires_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    @property
    def options_list(self):
        """Get options as list"""
        try:
            return json.loads(self.options)
        except:
            return []
    
    @options_list.setter
    def options_list(self, value):
        """Set options from list"""
        self.options = json.dumps(value)
    
    @property
    def votes_dict(self):
        """Get votes as dict"""
        try:
            return json.loads(self.votes)
        except:
            return {}
    
    @votes_dict.setter
    def votes_dict(self, value):
        """Set votes from dict"""
        self.votes = json.dumps(value)
    
    def to_dict(self):
        """Serialize to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'options': self.options_list,
            'votes': self.votes_dict,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

class GoonZoneNews(db.Model):
    """News model"""
    __tablename__ = 'goonzone_news'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    is_pinned = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def to_dict(self):
        """Serialize to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'is_pinned': self.is_pinned,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

class GoonZoneDoc(db.Model):
    """Documentation model"""
    __tablename__ = 'goonzone_docs'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def to_dict(self):
        """Serialize to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'slug': self.slug,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

class GoonZoneRule(db.Model):
    """Rule model"""
    __tablename__ = 'goonzone_rules'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    order = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def to_dict(self):
        """Serialize to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'order': self.order,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
