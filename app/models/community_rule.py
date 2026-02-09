from app.database import db
from datetime import datetime
from sqlalchemy import Index


class CommunityRule(db.Model):
    """Community rules and guidelines for the forum"""
    __tablename__ = 'community_rules'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    order = db.Column(db.Integer, default=0)  # For ordering rules
    is_critical = db.Column(db.Boolean, default=False)  # Critical rules highlighted in red
    icon = db.Column(db.String(50), nullable=True)  # Emoji or icon name
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Indexes for quick lookups
    __table_args__ = (
        Index('idx_rules_order', 'order'),
        Index('idx_rules_critical', 'is_critical'),
    )
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'order': self.order,
            'is_critical': self.is_critical,
            'icon': self.icon,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def __repr__(self):
        return f'<CommunityRule {self.id}: {self.title}>'
