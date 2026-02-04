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
    
    # #region agent log
    with open('.cursor/debug.log', 'a', encoding='utf-8') as f:
        import json
        f.write(json.dumps({
            'location': 'app/routes/upload.py:57',
            'message': 'Cloudinary config values before setup',
            'data': {
                'has_cloudinary_url': bool(cloudinary_url),
                'cloudinary_url_preview': cloudinary_url[:50] + '...' if cloudinary_url and len(cloudinary_url) > 50 else cloudinary_url,
                'cloud_name': cloud_name,
                'has_api_key': bool(api_key),
                'has_api_secret': bool(api_secret),
                'api_key_preview': api_key[:10] + '...' if api_key and len(api_key) > 10 else api_key
            },
            'timestamp': int(datetime.utcnow().timestamp() * 1000),
            'sessionId': 'debug-session',
            'runId': 'run1',
            'hypothesisId': 'A'
        }) + '\n')
    # #endregion
    
    try:
        # Налаштування Cloudinary
        if cloudinary_url:
            # Використовуємо CLOUDINARY_URL (найпростіший спосіб)
            # cloudinary.config() автоматично читає CLOUDINARY_URL з os.environ
            import os
            # Встановлюємо в os.environ, якщо ще не встановлено
            if 'CLOUDINARY_URL' not in os.environ:
                os.environ['CLOUDINARY_URL'] = cloudinary_url
            # #region agent log
            with open('.cursor/debug.log', 'a', encoding='utf-8') as f:
                import json
                f.write(json.dumps({
                    'location': 'app/routes/upload.py:71',
                    'message': 'Before cloudinary.config() with CLOUDINARY_URL',
                    'data': {
                        'cloudinary_url_in_env': 'CLOUDINARY_URL' in os.environ,
                        'cloudinary_url_value_preview': os.environ.get('CLOUDINARY_URL', '')[:50] + '...' if len(os.environ.get('CLOUDINARY_URL', '')) > 50 else os.environ.get('CLOUDINARY_URL', '')
                    },
                    'timestamp': int(datetime.utcnow().timestamp() * 1000),
                    'sessionId': 'debug-session',
                    'runId': 'run1',
                    'hypothesisId': 'C'
                }) + '\n')
            # #endregion
            cloudinary.config()
            # #region agent log
            with open('.cursor/debug.log', 'a', encoding='utf-8') as log_file:
                import json
                config_obj = cloudinary.config()
                log_file.write(json.dumps({
                    'location': 'app/routes/upload.py:118',
                    'message': 'After cloudinary.config() with CLOUDINARY_URL',
                    'data': {
                        'cloudinary_config_cloud_name': getattr(config_obj, 'cloud_name', None),
                        'cloudinary_config_api_key': getattr(config_obj, 'api_key', None)[:10] + '...' if getattr(config_obj, 'api_key', None) and len(getattr(config_obj, 'api_key', None)) > 10 else getattr(config_obj, 'api_key', None),
                        'has_cloudinary_config_api_secret': bool(getattr(config_obj, 'api_secret', None)),
                        'os_env_cloudinary_url': os.environ.get('CLOUDINARY_URL', '')[:80] + '...' if len(os.environ.get('CLOUDINARY_URL', '')) > 80 else os.environ.get('CLOUDINARY_URL', '')
                    },
                    'timestamp': int(datetime.utcnow().timestamp() * 1000),
                    'sessionId': 'debug-session',
                    'runId': 'run1',
                    'hypothesisId': 'H4'
                }) + '\n')
            # #endregion
        elif all([cloud_name, api_key, api_secret]):
            # Використовуємо окремі змінні
            # #region agent log
            with open('.cursor/debug.log', 'a', encoding='utf-8') as f:
                import json
                f.write(json.dumps({
                    'location': 'app/routes/upload.py:74',
                    'message': 'Before cloudinary.config() with separate vars',
                    'data': {
                        'cloud_name': cloud_name,
                        'api_key_preview': api_key[:10] + '...' if api_key and len(api_key) > 10 else api_key,
                        'has_api_secret': bool(api_secret)
                    },
                    'timestamp': int(datetime.utcnow().timestamp() * 1000),
                    'sessionId': 'debug-session',
                    'runId': 'run1',
                    'hypothesisId': 'A'
                }) + '\n')
            # #endregion
            cloudinary.config(
                cloud_name=cloud_name,
                api_key=api_key,
                api_secret=api_secret
            )
            # #region agent log
            with open('.cursor/debug.log', 'a', encoding='utf-8') as log_file:
                import json
                config_obj = cloudinary.config()
                log_file.write(json.dumps({
                    'location': 'app/routes/upload.py:156',
                    'message': 'After cloudinary.config() with separate vars',
                    'data': {
                        'passed_cloud_name': cloud_name,
                        'cloudinary_config_cloud_name': getattr(config_obj, 'cloud_name', None),
                        'passed_api_key_preview': api_key[:10] + '...' if api_key and len(api_key) > 10 else api_key,
                        'cloudinary_config_api_key_preview': getattr(config_obj, 'api_key', None)[:10] + '...' if getattr(config_obj, 'api_key', None) and len(getattr(config_obj, 'api_key', None)) > 10 else getattr(config_obj, 'api_key', None),
                        'has_cloudinary_config_api_secret': bool(getattr(config_obj, 'api_secret', None))
                    },
                    'timestamp': int(datetime.utcnow().timestamp() * 1000),
                    'sessionId': 'debug-session',
                    'runId': 'run1',
                    'hypothesisId': 'H4'
                }) + '\n')
            # #endregion
        else:
            return jsonify({
                'error': 'Cloudinary configuration missing. Please set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET'
            }), 500
        
        # Завантаження файлу в Cloudinary
        # Використовуємо secure=True для отримання HTTPS URL
        # #region agent log
        with open('.cursor/debug.log', 'a', encoding='utf-8') as log_file:
            import json
            config_obj = cloudinary.config()
            # Test API connection by trying to ping Cloudinary
            try:
                ping_result = cloudinary.api.ping()
                ping_success = True
                ping_error = None
            except Exception as ping_e:
                ping_success = False
                ping_error = str(ping_e)
            log_file.write(json.dumps({
                'location': 'app/routes/upload.py:164',
                'message': 'Before cloudinary.uploader.upload()',
                'data': {
                    'cloudinary_config_cloud_name': getattr(config_obj, 'cloud_name', None),
                    'cloudinary_config_api_key_preview': getattr(config_obj, 'api_key', None)[:10] + '...' if getattr(config_obj, 'api_key', None) and len(getattr(config_obj, 'api_key', None)) > 10 else getattr(config_obj, 'api_key', None),
                    'has_cloudinary_config_api_secret': bool(getattr(config_obj, 'api_secret', None)),
                    'file_filename': file.filename if hasattr(file, 'filename') else None,
                    'cloudinary_ping_success': ping_success,
                    'cloudinary_ping_error': ping_error
                },
                'timestamp': int(datetime.utcnow().timestamp() * 1000),
                'sessionId': 'debug-session',
                'runId': 'run1',
                'hypothesisId': 'H6'
            }) + '\n')
        # #endregion
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
        
        # #region agent log
        try:
            with open('.cursor/debug.log', 'a', encoding='utf-8') as log_file:
                import json
                log_file.write(json.dumps({
                    'location': 'app/routes/upload.py:190',
                    'message': 'Upload exception caught',
                    'data': {
                        'error_type': type(e).__name__,
                        'error_message': error_msg,
                        'error_traceback': error_traceback,
                        'cloudinary_url': cloudinary_url[:50] + '...' if cloudinary_url and len(cloudinary_url) > 50 else cloudinary_url if 'cloudinary_url' in locals() else None,
                        'cloud_name': cloud_name if 'cloud_name' in locals() else None,
                        'has_api_key': bool(api_key) if 'api_key' in locals() else None
                    },
                    'timestamp': int(datetime.utcnow().timestamp() * 1000),
                    'sessionId': 'debug-session',
                    'runId': 'run1',
                    'hypothesisId': 'A'
                }) + '\n')
        except Exception:
            pass  # Don't fail if logging fails
        # #endregion
        
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
