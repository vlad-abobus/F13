"""
Flash Game model
"""
from app import db
from datetime import datetime
import uuid

class FlashGame(db.Model):
    """Flash Game model - supports both Ruffle (SWF) and HTML5/WebGL (iframe)"""
    __tablename__ = 'flash_games'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(200), nullable=False)
    swf_url = db.Column(db.String(500), nullable=True)  # For Ruffle Flash games
    iframe_url = db.Column(db.String(500), nullable=True)  # For HTML5/WebGL games
    thumbnail = db.Column(db.String(500), nullable=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def to_dict(self):
        """Serialize to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'swf_url': self.swf_url,
            'iframe_url': self.iframe_url,
            'thumbnail': self.thumbnail,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'game_type': 'flash' if self.swf_url else 'html5',
        }
    
    def __repr__(self):
        return f'<FlashGame {self.title}>'
