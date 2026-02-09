"""
Маршруты администратора
"""
from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User
from app.models.post import Post
from app.models.html_page import HtmlPage
from app.models.translation import Translation
from app.models.ip_ban import IPBan
from app.models.miku_settings import MikuSettings
from app.models.moderation_log import ModerationLog
from app.middleware.auth import admin_required
from datetime import datetime, timedelta
import uuid

admin_bp = Blueprint('admin', __name__)

def log_moderation_action(admin_id, user_id, action, reason=None, details=None):
    """Вспомогательная функция для логирования всех действий модерации"""
    log_entry = ModerationLog(
        id=str(uuid.uuid4()),
        admin_id=admin_id,
        user_id=user_id,
        action=action,
        reason=reason,
        details=details
    )
    db.session.add(log_entry)
    db.session.commit()
    return log_entry

@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    """Получить список пользователей (только админ)"""
    users = User.query.all()
    return jsonify([user.to_dict() for user in users]), 200

@admin_bp.route('/users/<user_id>/ban', methods=['POST'])
@admin_required
def ban_user(user_id):
    """Заблокировать пользователя (только админ)"""
    user = User.query.get_or_404(user_id)
    user.is_banned = True
    db.session.commit()
    return jsonify({'message': 'Пользователь заблокирован'}), 200

@admin_bp.route('/users/<user_id>/unban', methods=['POST'])
@admin_required
def unban_user(user_id):
    """Разблокировать пользователя (только админ)"""
    user = User.query.get_or_404(user_id)
    user.is_banned = False
    db.session.commit()
    return jsonify({'message': 'Пользователь разблокирован'}), 200

@admin_bp.route('/users/<user_id>/make-admin', methods=['POST'])
@admin_required
def make_admin(user_id):
    """Сделать пользователя админом (только админ)"""
    user = User.query.get_or_404(user_id)
    if user.status == 'admin':
        return jsonify({'error': 'Пользователь уже администратор'}), 400
    user.status = 'admin'
    user.verification_type = 'red'
    user.verification_badge = 'ADM'
    db.session.commit()
    return jsonify({'message': 'Пользователь повышен до администратора', 'user': user.to_dict()}), 200

@admin_bp.route('/users/<user_id>/remove-admin', methods=['POST'])
@admin_required
def remove_admin(user_id):
    """Удалить статус админа у пользователя (только админ)"""
    user = User.query.get_or_404(user_id)
    if user.status != 'admin':
        return jsonify({'error': 'Пользователь не администратор'}), 400
    user.status = 'user'
    user.verification_type = 'none'
    user.verification_badge = None
    db.session.commit()
    log_moderation_action(request.current_user.id, user_id, 'remove_admin')
    return jsonify({'message': 'Пользователь понижен с администратора', 'user': user.to_dict()}), 200

@admin_bp.route('/users/<user_id>/warn', methods=['POST'])
@admin_required
def warn_user(user_id):
    """Выдать предупреждение пользователю (только админ)"""
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    reason = data.get('reason', 'Причина не указана')
    
    user.warning_count += 1
    db.session.commit()
    
    log_moderation_action(
        request.current_user.id, 
        user_id, 
        'warn',
        reason=reason,
        details={'warning_count': user.warning_count}
    )
    
    return jsonify({
        'message': f'Пользователю выдано предупреждение (всего предупреждений: {user.warning_count})',
        'warning_count': user.warning_count
    }), 200

@admin_bp.route('/users/<user_id>/kick', methods=['POST'])
@admin_required
def kick_user(user_id):
    """Временно заблокировать пользователя (только админ)"""
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    hours = data.get('hours', 24)
    reason = data.get('reason', 'Причина не указана')
    
    user.is_banned = True
    user.ban_until = datetime.utcnow() + timedelta(hours=hours)
    db.session.commit()
    
    log_moderation_action(
        request.current_user.id,
        user_id,
        'kick',
        reason=reason,
        details={'hours': hours, 'ban_until': user.ban_until.isoformat()}
    )
    
    return jsonify({
        'message': f'Пользователь заблокирован на {hours} часов',
        'ban_until': user.ban_until.isoformat()
    }), 200

@admin_bp.route('/users/<user_id>/restrict-posting', methods=['POST'])
@admin_required
def restrict_posting(user_id):
    """Ограничить пользователя от размещения (только админ)"""
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    reason = data.get('reason', 'Причина не указана')
    
    user.can_post = False
    db.session.commit()
    
    log_moderation_action(
        request.current_user.id,
        user_id,
        'restrict_posting',
        reason=reason
    )
    
    return jsonify({'message': 'Пользователь ограничен от размещения'}), 200

@admin_bp.route('/users/<user_id>/allow-posting', methods=['POST'])
@admin_required
def allow_posting(user_id):
    """Разрешить пользователю постить снова (только админ)"""
    user = User.query.get_or_404(user_id)
    user.can_post = True
    db.session.commit()
    
    log_moderation_action(request.current_user.id, user_id, 'allow_posting')
    
    return jsonify({'message': 'Пользователь теперь может постить'}), 200

@admin_bp.route('/users/<user_id>/notes', methods=['POST'])
@admin_required
def add_user_notes(user_id):
    """Добавить заметки администратора к пользователю (только админ)"""
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    notes = data.get('notes', '')
    
    user.admin_notes = notes
    db.session.commit()
    
    log_moderation_action(
        request.current_user.id,
        user_id,
        'add_notes',
        details={'notes_length': len(notes)}
    )
    
    return jsonify({'message': 'Заметки администратора обновлены', 'notes': user.admin_notes}), 200

@admin_bp.route('/users/<user_id>/history', methods=['GET'])
@admin_required
def get_user_moderation_history(user_id):
    """Получить историю модерации пользователя (только админ)"""
    user = User.query.get_or_404(user_id)
    history = ModerationLog.query.filter_by(user_id=user_id).order_by(ModerationLog.created_at.desc()).all()
    
    return jsonify({
        'user': user.to_dict(),
        'warning_count': user.warning_count,
        'admin_notes': user.admin_notes,
        'history': [log.to_dict() for log in history]
    }), 200

@admin_bp.route('/moderation-log', methods=['GET'])
@admin_required
def get_moderation_log():
    """Получить полный журнал модерации (только админ)"""
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 50, type=int), 100)
    
    pagination = ModerationLog.query.order_by(ModerationLog.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'logs': [log.to_dict() for log in pagination.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages
        }
    }), 200

@admin_bp.route('/posts', methods=['GET'])
@admin_required
def get_posts_for_moderation():
    """Получить посты для модерации (только админ)"""
    status = request.args.get('status', 'pending')
    posts = Post.query.filter_by(moderation_status=status).all()
    return jsonify([post.to_dict() for post in posts]), 200

@admin_bp.route('/posts/<post_id>/approve', methods=['POST'])
@admin_required
def approve_post(post_id):
    """Одобрить пост (только админ)"""
    post = Post.query.get_or_404(post_id)
    post.moderation_status = 'approved'
    db.session.commit()
    return jsonify(post.to_dict()), 200

@admin_bp.route('/posts/<post_id>/reject', methods=['POST'])
@admin_required
def reject_post(post_id):
    """Отклонить пост (только админ)"""
    post = Post.query.get_or_404(post_id)
    post.moderation_status = 'rejected'
    db.session.commit()
    return jsonify(post.to_dict()), 200

@admin_bp.route('/posts/<post_id>/delete', methods=['POST'])
@admin_required
def delete_post(post_id):
    """Удалить пост (только админ)"""
    post = Post.query.get_or_404(post_id)
    data = request.get_json()
    reason = data.get('reason', 'Причина не указана')
    
    post.is_deleted = True
    db.session.commit()
    
    # Логировать действие модерации
    log_moderation_action(
        request.current_user.id,
        post.user_id,
        'delete_post',
        reason=reason,
        details={'post_id': post_id, 'post_title': post.content[:100]}
    )
    
    return jsonify({'message': 'Пост удален'}), 200

@admin_bp.route('/users/<user_id>/mute', methods=['POST'])
@admin_required
def mute_user(user_id):
    """Отключить звук пользователю (только админ)"""
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    hours = data.get('hours', 24)  # По умолчанию 24 часа
    
    user.is_muted = True
    user.muted_until = datetime.utcnow() + timedelta(hours=hours)
    db.session.commit()
    return jsonify({'message': f'Пользователь отключен на {hours} часов', 'muted_until': user.muted_until.isoformat()}), 200

@admin_bp.route('/users/<user_id>/unmute', methods=['POST'])
@admin_required
def unmute_user(user_id):
    """Включить звук пользователю (только админ)"""
    user = User.query.get_or_404(user_id)
    user.is_muted = False
    user.muted_until = None
    db.session.commit()
    return jsonify({'message': 'Пользователь включен'}), 200

@admin_bp.route('/ip-bans', methods=['GET'])
@admin_required
def get_ip_bans():
    """Получить список блокировок IP (только админ)"""
    bans = IPBan.query.filter_by(is_active=True).all()
    return jsonify([ban.to_dict() for ban in bans]), 200

@admin_bp.route('/ip-bans', methods=['POST'])
@admin_required
def create_ip_ban():
    """Создать блокировку IP (только админ)"""
    data = request.get_json()
    ip_address = data.get('ip_address')
    reason = data.get('reason', '')
    hours = data.get('hours')  # None = постоянно
    
    if not ip_address:
        return jsonify({'error': 'IP адрес требуется'}), 400
    
    banned_until = None
    if hours:
        banned_until = datetime.utcnow() + timedelta(hours=hours)
    
    ban = IPBan(
        id=str(uuid.uuid4()),
        ip_address=ip_address,
        reason=reason,
        banned_by=request.current_user.id,
        banned_until=banned_until,
        is_active=True
    )
    
    db.session.add(ban)
    db.session.commit()
    return jsonify(ban.to_dict()), 201

@admin_bp.route('/ip-bans/<ban_id>', methods=['DELETE'])
@admin_required
def remove_ip_ban(ban_id):
    """Удалить блокировку IP (только админ)"""
    ban = IPBan.query.get_or_404(ban_id)
    ban.is_active = False
    db.session.commit()
    return jsonify({'message': 'Блокировка IP удалена'}), 200

@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_stats():
    """Получить статистику администратора"""
    from app.models.comment import Comment
    
    total_users = User.query.count()
    total_posts = Post.query.filter_by(is_deleted=False).count()
    total_comments = Comment.query.count()
    pending_posts = Post.query.filter_by(moderation_status='pending').count()
    banned_users = User.query.filter_by(is_banned=True).count()
    muted_users = User.query.filter_by(is_muted=True).count()
    active_ip_bans = IPBan.query.filter_by(is_active=True).count()
    
    return jsonify({
        'users': {
            'total': total_users,
            'banned': banned_users,
            'muted': muted_users
        },
        'posts': {
            'total': total_posts,
            'pending_moderation': pending_posts
        },
        'comments': {
            'total': total_comments
        },
            'ip_bans': {
                'active': active_ip_bans
            }
        }), 200

@admin_bp.route('/miku-settings', methods=['GET'])
@admin_required
def get_miku_settings():
    """Получить настройки автокомментариев Miku (только админ)"""
    settings = MikuSettings.get_settings()
    return jsonify(settings.to_dict()), 200

@admin_bp.route('/miku-settings', methods=['PUT'])
@admin_required
def update_miku_settings():
    """Обновить настройки автокомментариев Miku (только админ)"""
    settings = MikuSettings.get_settings()
    data = request.get_json()
    
    if 'is_enabled' in data:
        settings.is_enabled = bool(data['is_enabled'])
    if 'max_comments_per_day' in data:
        settings.max_comments_per_day = int(data['max_comments_per_day'])
    if 'personality_override' in data:
        settings.personality_override = data['personality_override'] if data['personality_override'] else None
    
    settings.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify(settings.to_dict()), 200

@admin_bp.route('/miku-settings/test', methods=['POST'])
@admin_required
def test_miku_comment():
    """Тестировать автокомментарий Miku (только админ)"""
    from app.services.miku_comment_service import miku_comment_service
    try:
        count = miku_comment_service.comment_on_own_posts()
        settings = MikuSettings.get_settings()
        return jsonify({
            'message': f'Miku прокомментировала {count} постов',
            'count': count,
            'personality': miku_comment_service.get_personality_for_today(),
            'settings': settings.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/miku-moderate-posts', methods=['POST'])
@admin_required
def miku_moderate_posts():
    """
    Запустить автоматическую модерацию постов Miku (только админ).

    Miku проверяет недавние посты со статусом 'pending' и устанавливает:
    - moderation_status: одобрено / предупреждение / отклонено
    - moderation_warning: текст с объяснением (для предупреждения/отклонения)
    """
    from app.services.miku_moderation_service import miku_moderation_service

    hours_back = request.args.get('hours_back', default=6, type=int)
    hours_back = max(1, min(hours_back, 48))

    try:
        processed = miku_moderation_service.moderate_recent_posts(hours_back=hours_back)
        return jsonify({
            'message': f'Miku отмодерировала {processed} постов',
            'processed': processed,
            'hours_back': hours_back,
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500