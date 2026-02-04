"""
Image model для зберігання метаданих зображень з Cloudinary
"""
from app.database import db
from datetime import datetime


class Image(db.Model):
    """
    Модель для зберігання метаданих зображень з Cloudinary.
    
    Зберігає ТІЛЬКИ:
    - secure_url: HTTPS URL для доступу до зображення
    - public_id: унікальний ідентифікатор в Cloudinary
    - created_at: час створення запису
    
    Саме зображення зберігається в Cloudinary, не в PostgreSQL.
    """
    __tablename__ = 'images'
    
    id = db.Column(db.Integer, primary_key=True)
    url = db.Column(db.Text, nullable=False, comment='HTTPS secure_url з Cloudinary')
    public_id = db.Column(db.Text, nullable=False, unique=True, comment='Унікальний public_id з Cloudinary')
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f'<Image {self.id}: {self.public_id}>'
    
    def to_dict(self):
        """Серіалізація в словник для JSON відповіді"""
        return {
            'id': self.id,
            'url': self.url,
            'public_id': self.public_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
