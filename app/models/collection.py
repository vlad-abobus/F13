"""
Collection models
"""
from app import db
from datetime import datetime
import uuid

class Collection(db.Model):
    """Collection model"""
    __tablename__ = 'collections'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    is_public = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    items = db.relationship('CollectionItem', backref='collection', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        """Serialize to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'is_public': self.is_public,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

class CollectionItem(db.Model):
    """Collection Item model"""
    __tablename__ = 'collection_items'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    collection_id = db.Column(db.String(36), db.ForeignKey('collections.id', ondelete='CASCADE'), nullable=False, index=True)
    gallery_id = db.Column(db.String(36), db.ForeignKey('gallery.id', ondelete='CASCADE'), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def to_dict(self):
        """Serialize to dictionary"""
        return {
            'id': self.id,
            'collection_id': self.collection_id,
            'gallery_id': self.gallery_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
