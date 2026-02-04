"""
Authentication middleware
"""
from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models.user import User
import time
import traceback

def token_required(f):
    """Decorator for protected routes"""
    @wraps(f)
    def decorated(*args, **kwargs):
        # #region agent log
        with open('.cursor/debug.log', 'a', encoding='utf-8') as log_file:
            import json
            auth_header = request.headers.get('Authorization', '')
            log_file.write(json.dumps({
                'location': 'app/middleware/auth.py:14',
                'message': 'Token required check entry',
                'data': {
                    'has_auth_header': bool(auth_header),
                    'auth_header_preview': auth_header[:20] + '...' if len(auth_header) > 20 else auth_header,
                    'endpoint': request.endpoint
                },
                'timestamp': int(__import__('time').time() * 1000),
                'sessionId': 'debug-session',
                'runId': 'run1',
                'hypothesisId': 'B'
            }) + '\n')
        # #endregion

        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()

            user = User.query.get(user_id)
            if not user or user.is_banned:
                # #region agent log
                with open('.cursor/debug.log', 'a', encoding='utf-8') as log_file:
                    import json
                    log_file.write(json.dumps({
                        'location': 'app/middleware/auth.py:21',
                        'message': 'User not found or banned',
                        'data': {
                            'user_id': user_id,
                            'user_exists': user is not None,
                            'is_banned': user.is_banned if user else None
                        },
                        'timestamp': int(__import__('time').time() * 1000),
                        'sessionId': 'debug-session',
                        'runId': 'run1',
                        'hypothesisId': 'B'
                    }) + '\n')
                # #endregion
                return jsonify({'error': 'Unauthorized'}), 401
            request.current_user = user
            # #region agent log
            with open('.cursor/debug.log', 'a', encoding='utf-8') as log_file:
                import json
                log_file.write(json.dumps({
                    'location': 'app/middleware/auth.py:24',
                    'message': 'Token validated successfully',
                    'data': {
                        'user_id': user_id,
                        'username': user.username if user else None
                    },
                    'timestamp': int(__import__('time').time() * 1000),
                    'sessionId': 'debug-session',
                    'runId': 'run1',
                    'hypothesisId': 'B'
                }) + '\n')
            # #endregion

        except Exception as e:
            # #region agent log
            with open('.cursor/debug.log', 'a', encoding='utf-8') as log_file:
                import json
                log_file.write(json.dumps({
                    'location': 'app/middleware/auth.py:28',
                    'message': 'Token validation exception',
                    'data': {
                        'error_type': type(e).__name__,
                        'error_message': str(e)
                    },
                    'timestamp': int(__import__('time').time() * 1000),
                    'sessionId': 'debug-session',
                    'runId': 'run1',
                    'hypothesisId': 'B'
                }) + '\n')
            # #endregion
            return jsonify({'error': 'Invalid token'}), 401
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    """Decorator for admin-only routes"""
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if request.current_user.status != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated
