"""
Upload routes для завантаження зображень через Cloudinary
"""
from flask import Blueprint, request, jsonify, current_app
from app import db
from app.models.image import Image
from app.middleware.auth import token_required
from app import limiter
import cloudinary
import cloudinary.uploader
import cloudinary.api
from datetime import datetime
from io import BytesIO

upload_bp = Blueprint('upload', __name__)


@upload_bp.route('/upload', methods=['POST'])
@token_required
@limiter.limit("10 per minute")  # Rate limiting для завантаження
def upload_image():
    """
    Endpoint для завантаження зображення через Cloudinary.
    
    Приймає файл з фронтенду, завантажує його в Cloudinary,
    зберігає метадані (secure_url, public_id) в PostgreSQL.
    
    Returns:
        JSON з secure_url та public_id
    """
    # Перевірка наявності файлу
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Валідація типу файлу
    allowed_extensions = current_app.config.get('ALLOWED_EXTENSIONS', {'png', 'jpg', 'jpeg', 'gif', 'webp'})
    if '.' not in file.filename:
        return jsonify({'error': 'Invalid file type'}), 400
    
    file_ext = file.filename.rsplit('.', 1)[1].lower()
    if file_ext not in allowed_extensions:
        return jsonify({'error': f'Invalid file type. Allowed: {", ".join(allowed_extensions)}'}), 400
    
    # Валідація розміру файлу
    # Використовуємо безпечний спосіб перевірки розміру
    try:
        file.seek(0, 2)  # Переміщення в кінець файлу
        file_size = file.tell()
        file.seek(0)  # Повернення на початок
    except (AttributeError, IOError, OSError):
        # Якщо файл не підтримує seek, читаємо весь файл в пам'ять для перевірки
        file_data = file.read()
        file_size = len(file_data)
        # Створюємо новий файловий об'єкт з даних
        file = BytesIO(file_data)
        file.filename = request.files['file'].filename  # Зберігаємо оригінальне ім'я файлу
    
    max_size = current_app.config.get('MAX_FILE_SIZE', 5242880)  # 5MB за замовчуванням
    if file_size > max_size:
        return jsonify({'error': f'File too large. Max size: {max_size / 1024 / 1024:.1f}MB'}), 400
    
    # Перевірка наявності Cloudinary конфігурації
    # Спочатку перевіряємо CLOUDINARY_URL, потім окремі змінні
    cloudinary_url = current_app.config.get('CLOUDINARY_URL')
    cloud_name = current_app.config.get('CLOUDINARY_CLOUD_NAME')
    api_key = current_app.config.get('CLOUDINARY_API_KEY')
    api_secret = current_app.config.get('CLOUDINARY_API_SECRET')
    
    try:
        # Налаштування Cloudinary
        if cloudinary_url:
            # Використовуємо CLOUDINARY_URL (найпростіший спосіб)
            # cloudinary.config() автоматично читає CLOUDINARY_URL з os.environ
            import os
            # Встановлюємо в os.environ, якщо ще не встановлено
            if 'CLOUDINARY_URL' not in os.environ:
                os.environ['CLOUDINARY_URL'] = cloudinary_url
            cloudinary.config()
        elif all([cloud_name, api_key, api_secret]):
            # Використовуємо окремі змінні
            cloudinary.config(
                cloud_name=cloud_name,
                api_key=api_key,
                api_secret=api_secret
            )
        else:
            return jsonify({
                'error': 'Cloudinary configuration missing. Please set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET'
            }), 500
        
        # Завантаження файлу в Cloudinary
        # Використовуємо secure=True для отримання HTTPS URL
        upload_result = cloudinary.uploader.upload(
            file,
            folder='freedom13',  # Папка в Cloudinary для організації
            use_filename=True,
            unique_filename=True,
            overwrite=False,
            resource_type='image',
            secure=True  # Отримуємо secure_url (HTTPS)
        )
        
        # Отримуємо secure_url та public_id з результату
        secure_url = upload_result.get('secure_url')
        public_id = upload_result.get('public_id')
        
        if not secure_url or not public_id:
            return jsonify({'error': 'Failed to upload image to Cloudinary'}), 500
        
        # Зберігаємо метадані в PostgreSQL
        image_record = Image(
            url=secure_url,
            public_id=public_id,
            created_at=datetime.utcnow()
        )
        
        db.session.add(image_record)
        db.session.commit()
        
        # Повертаємо результат
        return jsonify({
            'secure_url': secure_url,
            'public_id': public_id,
            'id': image_record.id,
            'created_at': image_record.created_at.isoformat()
        }), 200
        
    except Exception as e:
        # Обробка помилок (Cloudinary, БД, тощо)
        db.session.rollback()
        import traceback
        error_msg = str(e)
        error_traceback = traceback.format_exc()
        
        # Логування помилки
        current_app.logger.error(f'Upload error: {error_msg}\n{error_traceback}')
        
        # Перевірка типу помилки для більш інформативного повідомлення
        if 'cloudinary' in error_msg.lower() or 'upload' in error_msg.lower():
            return jsonify({'error': f'Failed to upload image to Cloudinary: {error_msg}'}), 500
        
        # Загальна помилка - include traceback in debug mode
        if current_app.config.get('DEBUG', False):
            return jsonify({
                'error': 'Internal server error',
                'message': error_msg,
                'traceback': error_traceback
            }), 500
        
        # Загальна помилка
        return jsonify({'error': 'Internal server error'}), 500
