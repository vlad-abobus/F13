"""
Feedback model
"""
from app import db
from datetime import datetime


class Feedback(db.Model):
    __tablename__ = 'feedback'
    
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(20), nullable=False, default='bug')  # 'bug' or 'feature'
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    email = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'title': self.title,
            'description': self.description,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }
