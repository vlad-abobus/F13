"""
Flask Application Factory
"""
from flask import Flask, send_from_directory, request
import os
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_caching import Cache
from flask_talisman import Talisman
import redis
from pathlib import Path

# Initialize extensions
db = SQLAlchemy()
jwt = JWTManager()
limiter = Limiter(key_func=get_remote_address)
cache = Cache()

def create_app(config_class):
    """Application Factory"""
    app = Flask(__name__, static_folder=None)
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    
    # CORS
    CORS(app, origins=app.config['CORS_ORIGINS'], supports_credentials=True)
    
    # Talisman (security headers)
    Talisman(
        app,
        force_https=False,  # True для production
        strict_transport_security=True,
        content_security_policy={
            'default-src': "'self'",
            'script-src': "'self' 'unsafe-inline' 'unsafe-eval'",  # Для Ruffle
            'img-src': "'self' data: https: res.cloudinary.com",  # Дозволяємо зображення з Cloudinary
            'style-src': "'self' 'unsafe-inline'",
            'connect-src': "'self' https://api.cloudinary.com http://127.0.0.1:* localhost:*",  # Дозволяємо запити до Cloudinary API та локальну телеметрію
        }
    )
    
    # Redis connection
    try:
        redis_client = redis.Redis(
            host=app.config['REDIS_HOST'],
            port=app.config['REDIS_PORT'],
            db=app.config['REDIS_DB'],
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2
        )
        redis_client.ping()
        app.config['REDIS_AVAILABLE'] = True
    except Exception as e:
        app.config['REDIS_AVAILABLE'] = False
        redis_client = None
        # Use memory storage if Redis is not available
        app.config['RATELIMIT_STORAGE_URL'] = 'memory://'
        app.logger.warning(f"Redis not available: {e}. Using in-memory storage.")
    
    # Limiter (rate limiting)
    # Flask-Limiter 3.x reads RATELIMIT_STORAGE_URL and RATELIMIT_DEFAULT from app.config
    limiter.init_app(app)
    
    # Cache
    if app.config.get('REDIS_AVAILABLE'):
        cache.init_app(app, config={
            'CACHE_TYPE': app.config['CACHE_TYPE'],
            'CACHE_REDIS_URL': app.config['CACHE_REDIS_URL'],
            'CACHE_DEFAULT_TIMEOUT': app.config['CACHE_DEFAULT_TIMEOUT']
        })
    else:
        cache.init_app(app, config={'CACHE_TYPE': 'SimpleCache'})
    
    # Create upload directories
    upload_dir = Path(app.config['UPLOAD_DIR'])
    (upload_dir / 'avatars').mkdir(parents=True, exist_ok=True)
    (upload_dir / 'posts').mkdir(parents=True, exist_ok=True)
    
    # Register blueprints
    from app.routes import main, auth, posts, comments, users, miku, goonzone, gallery, flash, i18n, captcha, admin, pages, rules
    from app.routes import miku_auto_comment, profile_posts, upload, miku_admin_request, search, analytics, preferences, reports, feedback
    from app.routes import voluntary_ban
    
    app.register_blueprint(main.main_bp)
    app.register_blueprint(auth.auth_bp, url_prefix='/api/auth')
    app.register_blueprint(posts.posts_bp, url_prefix='/api/posts')
    app.register_blueprint(comments.comments_bp, url_prefix='/api/comments')
    app.register_blueprint(users.users_bp, url_prefix='/api/users')
    app.register_blueprint(miku.miku_bp, url_prefix='/api/miku')
    app.register_blueprint(miku_auto_comment.miku_auto_bp, url_prefix='/api/miku-auto')
    app.register_blueprint(goonzone.goonzone_bp, url_prefix='/api/goonzone')
    app.register_blueprint(gallery.gallery_bp, url_prefix='/api/gallery')
    app.register_blueprint(flash.flash_bp, url_prefix='/api/flash')
    app.register_blueprint(i18n.i18n_bp, url_prefix='/api/i18n')
    app.register_blueprint(captcha.captcha_bp, url_prefix='/api/captcha')
    app.register_blueprint(reports.reports_bp, url_prefix='/api/reports')
    app.register_blueprint(admin.admin_bp, url_prefix='/api/admin')
    app.register_blueprint(pages.pages_bp, url_prefix='/api/pages')
    app.register_blueprint(voluntary_ban.voluntary_bp, url_prefix='/api')
    app.register_blueprint(profile_posts.profile_posts_bp, url_prefix='/api/profile-posts')
    app.register_blueprint(upload.upload_bp, url_prefix='/api')
    app.register_blueprint(miku_admin_request.miku_admin_request_bp, url_prefix='/api')
    app.register_blueprint(search.search_bp, url_prefix='/api/search')
    app.register_blueprint(analytics.analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(preferences.preferences_bp, url_prefix='/api/preferences')
    app.register_blueprint(rules.rules_bp, url_prefix='/api/rules')
    app.register_blueprint(feedback.feedback_bp, url_prefix='/api/feedback')
    
    # Static files routes (must be before React app route)
    @app.route('/ruffle/<path:filename>')
    def serve_ruffle(filename):
        """Serve Ruffle files with proper MIME types
        
        NOTE: Uses the newer Ruffle build stored in `ruf_vld/`.
        The public URL stays `/ruffle/...` so the frontend does not need changes.
        """
        from flask import jsonify, request
        # Use absolute path from app root
        base_dir = Path(__file__).parent.parent
        # Use new Ruffle build directory
        ruffle_path = base_dir / 'ruf_vld'
        file_path = ruffle_path / filename
        
        # Debug logging
        import logging
        logging.basicConfig(level=logging.DEBUG)
        logger = logging.getLogger(__name__)
        logger.debug(f"Ruffle request: filename={filename}, path={str(file_path)}, exists={file_path.exists()}")
        
        if not file_path.exists() or not file_path.is_file():
            logger.error(f"Ruffle file not found: {str(file_path)}")
            return jsonify({'error': 'File not found', 'path': str(file_path), 'requested': filename}), 404
        
        response = send_from_directory(str(ruffle_path), filename)
        # Set correct MIME type for WASM files
        if filename.endswith('.wasm'):
            response.headers['Content-Type'] = 'application/wasm'
        elif filename.endswith('.js'):
            response.headers['Content-Type'] = 'application/javascript'
        elif filename.endswith('.js.map'):
            response.headers['Content-Type'] = 'application/json'
        logger.debug(f"Ruffle file served: {filename}, MIME: {response.headers.get('Content-Type')}")
        return response

    # Dynamic ban page for blocked IPs - serve before SPA
    from app.models.ip_ban import IPBan
    from flask import render_template

    @app.before_request
    def check_ip_ban_and_serve_page():
        # Only apply to non-API, non-static asset requests (the SPA and page requests)
        path = request.path or ''
        if path.startswith('/api') or path.startswith('/ruffle') or path.startswith('/games') or path.startswith('/uploads') or path.startswith('/static') or path.startswith('/favicon.ico'):
            return None

        ip = request.remote_addr
        try:
            ban = IPBan.query.filter_by(ip_address=ip, is_active=True).first()
        except Exception:
            ban = None

        if ban and ban.is_valid():
            # Render a friendly banned page (different for voluntary bans)
            reason = ban.reason or 'Причина не указана.'
            return render_template('banned.html', reason=reason, is_voluntary=getattr(ban, 'is_voluntary', False)), 403
    
    @app.route('/games/<path:filename>')
    def serve_games(filename):
        """Serve game SWF files"""
        from flask import jsonify, request
        # Use absolute path from app root
        base_dir = Path(__file__).parent.parent
        games_path = base_dir / 'games'
        file_path = games_path / filename
        
        # Debug logging
        import logging
        logging.basicConfig(level=logging.DEBUG)
        logger = logging.getLogger(__name__)
        logger.debug(f"Game request: filename={filename}, path={str(file_path)}, exists={file_path.exists()}")
        
        # Log to debug file
        try:
            import json
            log_entry = {
                'location': 'app/__init__.py:serve_games',
                'message': 'Game file request',
                'data': {
                    'filename': filename,
                    'path': str(file_path),
                    'exists': file_path.exists(),
                    'method': request.method
                },
                'timestamp': int(__import__('time').time() * 1000),
                'sessionId': 'debug-session',
                'runId': 'run1',
                'hypothesisId': 'C'
            }
            with open('.cursor/debug.log', 'a', encoding='utf-8') as f:
                f.write(json.dumps(log_entry) + '\n')
        except Exception:
            pass
        
        if not file_path.exists() or not file_path.is_file():
            logger.error(f"Game file not found: {str(file_path)}")
            # List available files for debugging
            available_files = [f.name for f in games_path.iterdir() if f.is_file()] if games_path.exists() else []
            return jsonify({
                'error': 'File not found', 
                'path': str(file_path), 
                'requested': filename,
                'available_files': available_files
            }), 404
        
        response = send_from_directory(str(games_path), filename)
        if filename.endswith('.swf'):
            response.headers['Content-Type'] = 'application/x-shockwave-flash'
        logger.debug(f"Game file served: {filename}, MIME: {response.headers.get('Content-Type')}")
        return response
    
    @app.route('/uploads/<path:filename>')
    def serve_uploads(filename):
        """
        Serve uploaded files (avatars, posts, etc.)
        
        ПРИМІТКА: Цей endpoint залишається для зворотної сумісності зі старими URL.
        Нові завантаження використовують Cloudinary через /api/upload.
        """
        from flask import jsonify
        import logging
        import time
        import json
        logger = logging.getLogger(__name__)
        
        upload_path = Path(app.config['UPLOAD_DIR'])
        file_path = upload_path / filename
        
        # #region agent log
        try:
            with open('.cursor/debug.log', 'a', encoding='utf-8') as log_file:
                log_file.write(json.dumps({
                    'location': 'app/__init__.py:serve_uploads',
                    'message': 'Serving upload file request',
                    'data': {
                        'filename': filename,
                        'upload_path': str(upload_path),
                        'file_path': str(file_path),
                        'file_exists': file_path.exists(),
                        'is_file': file_path.is_file() if file_path.exists() else False,
                        'upload_dir_exists': upload_path.exists()
                    },
                    'timestamp': int(time.time() * 1000),
                    'sessionId': 'debug-session',
                    'runId': 'run1',
                    'hypothesisId': 'H1'
                }) + '\n')
        except Exception:
            pass
        # #endregion
        
        logger.debug(f"Serving upload: filename={filename}, upload_path={upload_path}, file_path={file_path}, exists={file_path.exists()}")
        
        # Ensure path is within upload directory (security)
        try:
            file_path.resolve().relative_to(upload_path.resolve())
        except ValueError:
            logger.warning(f"Invalid upload path: {filename}")
            return jsonify({'error': 'Invalid path'}), 403
        
        if not file_path.exists() or not file_path.is_file():
            # Файл не знайдено - можливо, це старий URL, який тепер в Cloudinary
            logger.warning(f"Upload file not found: {file_path} (можливо, файл мігрувався в Cloudinary)")
            # Повертаємо 404, щоб frontend міг обробити через SafeImage
            return jsonify({'error': 'File not found. This file may have been migrated to Cloudinary.'}), 404
        
        # Set proper MIME type
        from mimetypes import guess_type
        mimetype, _ = guess_type(str(file_path))
        logger.debug(f"Serving file: {filename}, mimetype={mimetype}")
        return send_from_directory(str(upload_path), filename, mimetype=mimetype)
    
    @app.route('/logo.png')
    def serve_logo():
        """Serve logo"""
        from flask import jsonify
        base_dir = Path(__file__).parent.parent
        logo_path = base_dir / 'logo.png'
        if not logo_path.exists():
            return jsonify({'error': 'Logo not found'}), 404
        return send_from_directory(str(base_dir), 'logo.png')

    # Serve React app in production (if dist exists)
    # This must be last to not interfere with static file routes
    client_dist = Path(__file__).parent.parent / 'client' / 'dist'
    if client_dist.exists():
        @app.route('/', defaults={'path': ''})
        @app.route('/<path:path>')
        def serve_react(path):
            """Serve React app"""
            # Don't intercept static file routes - let Flask handle them
            # These routes are handled by specific Flask routes above
            if path.startswith(('ruffle/', 'games/', 'uploads/', 'api/', 'logo.png')):
                from flask import abort
                abort(404)
            if path and (client_dist / path).exists():
                return send_from_directory(client_dist, path)
            return send_from_directory(client_dist, 'index.html')
    
    # Health check
    @app.route('/api/health')
    def health_check():
        """Health check endpoint"""
        db_status = 'ok'
        try:
            db.session.execute(db.text('SELECT 1'))
        except Exception:
            db_status = 'error'
        
        redis_status = 'ok' if app.config.get('REDIS_AVAILABLE') else 'unavailable'
        
        return {
            'status': 'ok' if db_status == 'ok' else 'degraded',
            'database': db_status,
            'redis': redis_status,
            'version': '1.0.0'
        }, 200 if db_status == 'ok' else 503
    
    # Ensure SQLite file directory exists (when using file-based SQLite)
    try:
        uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
        if uri and uri.startswith('sqlite') and ':memory:' not in uri:
            # Extract path portion after the sqlite URI prefix
            db_path_raw = uri
            if ':///' in uri:
                db_path_raw = uri.split(':///', 1)[1]
            else:
                db_path_raw = uri.split('://', 1)[1]
            try:
                db_file = Path(db_path_raw)
                db_file.parent.mkdir(parents=True, exist_ok=True)
            except Exception:
                pass
    except Exception:
        pass

    # Initialize database
    with app.app_context():
        from app.database import init_db
        # Initialize DB only when not running migrations/scripts that skip it
        if not os.environ.get('SKIP_INIT_DB'):
            init_db()
    
    # Initialize scheduler (only in production or if enabled)
    if app.config.get('ENABLE_SCHEDULER', False):
        from app.tasks.scheduler import init_scheduler
        try:
            init_scheduler()
            app.logger.info("✅ Scheduler initialized")
        except Exception as e:
            app.logger.warning(f"Scheduler initialization failed: {e}")
    
    # Error handlers to prevent 502 Bad Gateway from cloudflare
    @app.errorhandler(500)
    def handle_500_error(error):
        """Handle 500 errors gracefully"""
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"500 Internal Server Error: {error}", exc_info=True)
        
        # Return a safe response instead of crashing
        return {
            'status': 'error',
            'message': 'Internal server error',
            'error': str(error)
        }, 500
    
    @app.errorhandler(502)
    def handle_502_error(error):
        """Handle 502 errors"""
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"502 Bad Gateway: {error}")
        
        return {
            'status': 'error',
            'message': 'Bad Gateway - service temporarily unavailable',
            'error': str(error)
        }, 502
    
    @app.errorhandler(503)
    def handle_503_error(error):
        """Handle 503 errors"""
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"503 Service Unavailable: {error}")
        
        return {
            'status': 'error',
            'message': 'Service temporarily unavailable',
            'error': str(error)
        }, 503
    
    return app
