"""
User model
"""
from app import db
from datetime import datetime
import uuid

class User(db.Model):
    """User model"""
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    avatar_url = db.Column(db.String(500), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), default='user', nullable=False)  # user, verified, admin
    verification_type = db.Column(db.String(20), default='none', nullable=False)  # none, blue, purple, red
    verification_badge = db.Column(db.String(3), nullable=True)
    activity_status = db.Column(db.String(3), default='', nullable=False)  # GRY, PST, MIK, ''
    activity_data = db.Column(db.String(200), nullable=True)
    language = db.Column(db.String(10), default='ru', nullable=False)  # ru, uk, kz, en
    is_banned = db.Column(db.Boolean, default=False, nullable=False)
    is_muted = db.Column(db.Boolean, default=False, nullable=False)
    muted_until = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    posts = db.relationship('Post', backref='author', lazy='dynamic', cascade='all, delete-orphan')
    comments = db.relationship('Comment', backref='author', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self, include_email=False):
        """Serialize to dictionary"""
        data = {
            'id': self.id,
            'username': self.username,
            'avatar_url': self.avatar_url,
            'bio': self.bio,
            'status': self.status,
            'verification_type': self.verification_type,
            'verification_badge': self.verification_badge,
            'activity_status': self.activity_status,
            'activity_data': self.activity_data,
            'language': self.language,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_email:
            data['email'] = self.email
        return data
    
    def __repr__(self):
        return f'<User {self.username}>'
