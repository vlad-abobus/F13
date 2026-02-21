"""
Маршруты аутентификации
"""
from flask import Blueprint, request, jsonify
from app import db, limiter
from app.models.user import User
from app.utils.password import hash_password, verify_password
from app.utils.jwt import generate_tokens
from app.middleware.captcha import verify_captcha
from app.middleware.bot_detection import detect_bot
from app.middleware.spam_detector import check_spam
from app.middleware.security_manager import SuspiciousActivityTracker
from flask_jwt_extended import create_refresh_token, get_jwt_identity, jwt_required
import uuid
import time
import traceback

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
@limiter.limit("5 per minute")  # Ограничение частоты регистрации для предотвращения злоупотреблений
@detect_bot
@verify_captcha
def register():
    """Регистрация пользователя"""

    try:
        data = request.get_json()

        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not username or not email or not password:
            return jsonify({'error': 'Отсутствуют обязательные поля'}), 400
        
        if len(password) < 6:
            return jsonify({'error': 'Пароль должен быть не менее 6 символов'}), 400

        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Имя пользователя уже существует'}), 400
        
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email уже существует'}), 400

        user = User(
            id=str(uuid.uuid4()),
            username=username,
            email=email,
            password_hash=hash_password(password)
        )
        
        db.session.add(user)
        db.session.commit()
        
        # Логировать новую регистрацию
        SuspiciousActivityTracker.log_security_event(
            user.id,
            'user_registered',
            description=f'New user registered from IP {request.remote_addr}'
        )

        access_token, refresh_token = generate_tokens(user.id)

        return jsonify({
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 201
    except Exception as e:
        
        return jsonify({'error': 'Ошибка регистрации', 'details': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
@limiter.limit("10 per minute")  # Ограничение попыток входа на IP
@detect_bot
@verify_captcha
def login():
    """Вход пользователя"""

    try:
        data = request.get_json()

        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Отсутствуют учетные данные'}), 400

        user = User.query.filter_by(username=username).first()

        if not user or not verify_password(password, user.password_hash):
            # Логировать неудачную попытку входа
            SuspiciousActivityTracker.log_failed_login(username)
            return jsonify({'error': 'Неверные учетные данные'}), 401
        
        if user.is_banned:
            return jsonify({'error': 'Учетная запись заблокирована'}), 403

        access_token, refresh_token = generate_tokens(user.id)
        
        # Логировать успешный вход
        SuspiciousActivityTracker.log_security_event(
            user.id,
            'successful_login',
            description=f'User logged in from IP {request.remote_addr}'
        )

        return jsonify({
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 200
    except Exception as e:
        
        return jsonify({'error': 'Ошибка входа', 'details': str(e)}), 500

@auth_bp.route('/refresh', methods=['POST'])
@limiter.limit("30 per minute")  # Предотвратить злоупотребление токеном обновления
@jwt_required(refresh=True)
def refresh():
    """Обновить токен доступа"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.is_banned:
        return jsonify({'error': 'Недействительный токен'}), 401
    
    access_token, _ = generate_tokens(user.id)
    
    return jsonify({
        'access_token': access_token
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Получить текущего пользователя"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'Пользователь не найден'}), 404
    
    return jsonify(user.to_dict()), 200
