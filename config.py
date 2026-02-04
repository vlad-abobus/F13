"""
Конфігурація для Freedom13
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Базова конфігурація"""
    
    # Secret keys
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or SECRET_KEY
    
    # JWT settings
    JWT_ACCESS_TOKEN_EXPIRES = 900  # 15 хвилин
    JWT_REFRESH_TOKEN_EXPIRES = 604800  # 7 днів
    
    # Database
    if os.environ.get('DATABASE_URL'):
        SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    elif os.environ.get('DB_PASSWORD'):
        # PostgreSQL
        DB_USER = os.environ.get('DB_USER', 'postgres')
        DB_PASSWORD = os.environ.get('DB_PASSWORD')
        DB_HOST = os.environ.get('DB_HOST', 'localhost')
        DB_PORT = os.environ.get('DB_PORT', '5432')
        DB_NAME = os.environ.get('DB_NAME', 'freedom13')
        SQLALCHEMY_DATABASE_URI = f'postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
    else:
        # SQLite для development (не для production!)
        basedir = Path(__file__).parent
        SQLALCHEMY_DATABASE_URI = f'sqlite:///{basedir / "instance" / "freedom13.db"}'
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,
        'max_overflow': 20,
        'pool_pre_ping': True,
        'pool_recycle': 3600,
    }
    
    # CORS
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')
    
    # File upload
    UPLOAD_DIR = Path(os.environ.get('UPLOAD_DIR', './uploads'))
    MAX_FILE_SIZE = int(os.environ.get('MAX_FILE_SIZE', 5242880))  # 5MB
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    
    # Cloudinary configuration
    # Підтримка CLOUDINARY_URL (формат: cloudinary://api_key:api_secret@cloud_name)
    # або окремі змінні для зворотної сумісності
    CLOUDINARY_URL = os.environ.get('CLOUDINARY_URL')
    
    # #region agent log
    with open('.cursor/debug.log', 'a', encoding='utf-8') as log_file:
        import json
        import time
        log_file.write(json.dumps({
            'location': 'config.py:56',
            'message': 'Cloudinary config initialization start',
            'data': {
                'has_cloudinary_url': bool(CLOUDINARY_URL),
                'cloudinary_url_preview': CLOUDINARY_URL[:80] + '...' if CLOUDINARY_URL and len(CLOUDINARY_URL) > 80 else CLOUDINARY_URL,
                'cloudinary_url_length': len(CLOUDINARY_URL) if CLOUDINARY_URL else 0,
                'has_separate_cloud_name': bool(os.environ.get('CLOUDINARY_CLOUD_NAME')),
                'separate_cloud_name': os.environ.get('CLOUDINARY_CLOUD_NAME'),
                'has_separate_api_key': bool(os.environ.get('CLOUDINARY_API_KEY')),
                'has_separate_api_secret': bool(os.environ.get('CLOUDINARY_API_SECRET'))
            },
            'timestamp': int(time.time() * 1000),
            'sessionId': 'debug-session',
            'runId': 'run1',
            'hypothesisId': 'H1,H3'
        }) + '\n')
    # #endregion
    
    if CLOUDINARY_URL:
        # Парсимо CLOUDINARY_URL: cloudinary://api_key:api_secret@cloud_name
        try:
            from urllib.parse import urlparse, unquote
            parsed = urlparse(CLOUDINARY_URL)
            # #region agent log
            with open('.cursor/debug.log', 'a', encoding='utf-8') as f:
                import json
                f.write(json.dumps({
                    'location': 'config.py:61',
                    'message': 'Parsing CLOUDINARY_URL',
                    'data': {
                        'cloudinary_url_preview': CLOUDINARY_URL[:50] + '...' if len(CLOUDINARY_URL) > 50 else CLOUDINARY_URL,
                        'parsed_scheme': parsed.scheme,
                        'parsed_netloc': parsed.netloc,
                        'has_at_in_netloc': '@' in parsed.netloc if parsed.netloc else False
                    },
                    'timestamp': int(__import__('time').time() * 1000),
                    'sessionId': 'debug-session',
                    'runId': 'run1',
                    'hypothesisId': 'A'
                }) + '\n')
            # #endregion
            # Формат: cloudinary://api_key:api_secret@cloud_name
            # parsed.netloc містить: api_key:api_secret@cloud_name
            # #region agent log
            with open('.cursor/debug.log', 'a', encoding='utf-8') as log_file:
                import json
                import time
                log_file.write(json.dumps({
                    'location': 'config.py:83',
                    'message': 'Before parsing CLOUDINARY_URL netloc',
                    'data': {
                        'parsed_netloc': parsed.netloc,
                        'parsed_scheme': parsed.scheme,
                        'parsed_path': parsed.path,
                        'has_at_in_netloc': '@' in parsed.netloc if parsed.netloc else False,
                        'has_colon_in_netloc': ':' in parsed.netloc if parsed.netloc else False
                    },
                    'timestamp': int(time.time() * 1000),
                    'sessionId': 'debug-session',
                    'runId': 'run1',
                    'hypothesisId': 'H1,H2'
                }) + '\n')
            # #endregion
            if '@' in parsed.netloc:
                # Розділяємо на auth частину та cloud_name
                auth_part, cloud_name = parsed.netloc.rsplit('@', 1)
                # #region agent log
                with open('.cursor/debug.log', 'a', encoding='utf-8') as log_file:
                    import json
                    import time
                    log_file.write(json.dumps({
                        'location': 'config.py:88',
                        'message': 'After rsplit on @',
                        'data': {
                            'auth_part': auth_part,
                            'cloud_name_raw': cloud_name,
                            'has_colon_in_auth': ':' in auth_part
                        },
                        'timestamp': int(time.time() * 1000),
                        'sessionId': 'debug-session',
                        'runId': 'run1',
                        'hypothesisId': 'H2'
                    }) + '\n')
                # #endregion
                if ':' in auth_part:
                    api_key, api_secret = auth_part.split(':', 1)
                    CLOUDINARY_CLOUD_NAME = unquote(cloud_name)
                    CLOUDINARY_API_KEY = unquote(api_key)
                    CLOUDINARY_API_SECRET = unquote(api_secret)
                    # #region agent log
                    with open('.cursor/debug.log', 'a', encoding='utf-8') as log_file:
                        import json
                        import time
                        log_file.write(json.dumps({
                            'location': 'config.py:95',
                            'message': 'CLOUDINARY_URL parsed successfully with auth',
                            'data': {
                                'cloud_name': CLOUDINARY_CLOUD_NAME,
                                'cloud_name_length': len(CLOUDINARY_CLOUD_NAME) if CLOUDINARY_CLOUD_NAME else 0,
                                'api_key_preview': CLOUDINARY_API_KEY[:10] + '...' if CLOUDINARY_API_KEY and len(CLOUDINARY_API_KEY) > 10 else CLOUDINARY_API_KEY,
                                'api_key_length': len(CLOUDINARY_API_KEY) if CLOUDINARY_API_KEY else 0,
                                'has_api_secret': bool(CLOUDINARY_API_SECRET),
                                'api_secret_length': len(CLOUDINARY_API_SECRET) if CLOUDINARY_API_SECRET else 0
                            },
                            'timestamp': int(time.time() * 1000),
                            'sessionId': 'debug-session',
                            'runId': 'run1',
                            'hypothesisId': 'H1,H2'
                        }) + '\n')
                    # #endregion
                else:
                    # Немає :, тільки cloud_name
                    CLOUDINARY_CLOUD_NAME = unquote(parsed.netloc)
                    CLOUDINARY_API_KEY = None
                    CLOUDINARY_API_SECRET = None
            else:
                # Немає @, використовуємо стандартний парсинг URL
                CLOUDINARY_CLOUD_NAME = unquote(parsed.netloc) if parsed.netloc else None
                CLOUDINARY_API_KEY = unquote(parsed.username) if parsed.username else None
                CLOUDINARY_API_SECRET = unquote(parsed.password) if parsed.password else None
        except Exception as e:
            # Якщо парсинг не вдався, використовуємо окремі змінні
            CLOUDINARY_CLOUD_NAME = os.environ.get('CLOUDINARY_CLOUD_NAME')
            CLOUDINARY_API_KEY = os.environ.get('CLOUDINARY_API_KEY')
            CLOUDINARY_API_SECRET = os.environ.get('CLOUDINARY_API_SECRET')
    else:
        # Використовуємо окремі змінні
        CLOUDINARY_CLOUD_NAME = os.environ.get('CLOUDINARY_CLOUD_NAME')
        CLOUDINARY_API_KEY = os.environ.get('CLOUDINARY_API_KEY')
        CLOUDINARY_API_SECRET = os.environ.get('CLOUDINARY_API_SECRET')
    
    # MikuGPT
    MIKUGPT_PYTHON_PATH = os.environ.get('MIKUGPT_PYTHON_PATH', 'python')
    MIKUGPT_SCRIPT_PATH = os.environ.get('MIKUGPT_SCRIPT_PATH', './MikuGPT_ver_1.0/main.py')
    MIKUGPT_EMOTIONS_DIR = Path('./MikuGPT_ver_1.0/emotions')
    
    # Server
    FLASK_ENV = os.environ.get('FLASK_ENV', 'development')
    DEBUG = FLASK_ENV == 'development'
    PORT = int(os.environ.get('PORT', 5000))
    HOST = os.environ.get('HOST', '127.0.0.1')
    
    # Redis (для кешування та Celery)
    REDIS_HOST = os.environ.get('REDIS_HOST', 'localhost')
    REDIS_PORT = int(os.environ.get('REDIS_PORT', 6379))
    REDIS_DB = int(os.environ.get('REDIS_DB', 0))
    REDIS_URL = f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"
    
    # Celery
    CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', REDIS_URL)
    CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', REDIS_URL)
    
    # Rate limiting
    RATELIMIT_STORAGE_URL = REDIS_URL
    RATELIMIT_DEFAULT = "200 per day, 50 per hour"
    
    # Cache
    CACHE_TYPE = 'RedisCache'
    CACHE_REDIS_URL = REDIS_URL
    CACHE_DEFAULT_TIMEOUT = 300
    
    # Scheduler
    ENABLE_SCHEDULER = os.environ.get('ENABLE_SCHEDULER', 'false').lower() == 'true'