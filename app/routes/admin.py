"""
Admin routes
"""
from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User
from app.models.post import Post
from app.models.html_page import HtmlPage
from app.models.translation import Translation
from app.models.ip_ban import IPBan
from app.models.miku_settings import MikuSettings
from app.middleware.auth import admin_required
from datetime import datetime, timedelta
import uuid

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    """Get users list (admin only)"""
    users = User.query.all()
    return jsonify([user.to_dict() for user in users]), 200

@admin_bp.route('/users/<user_id>/ban', methods=['POST'])
@admin_required
def ban_user(user_id):
    """Ban user (admin only)"""
    user = User.query.get_or_404(user_id)
    user.is_banned = True
    db.session.commit()
    return jsonify({'message': 'User banned'}), 200

@admin_bp.route('/users/<user_id>/unban', methods=['POST'])
@admin_required
def unban_user(user_id):
    """Unban user (admin only)"""
    user = User.query.get_or_404(user_id)
    user.is_banned = False
    db.session.commit()
    return jsonify({'message': 'User unbanned'}), 200

@admin_bp.route('/posts', methods=['GET'])
@admin_required
def get_posts_for_moderation():
    """Get posts for moderation (admin only)"""
    status = request.args.get('status', 'pending')
    posts = Post.query.filter_by(moderation_status=status).all()
    return jsonify([post.to_dict() for post in posts]), 200

@admin_bp.route('/posts/<post_id>/approve', methods=['POST'])
@admin_required
def approve_post(post_id):
    """Approve post (admin only)"""
    post = Post.query.get_or_404(post_id)
    post.moderation_status = 'approved'
    db.session.commit()
    return jsonify(post.to_dict()), 200

@admin_bp.route('/posts/<post_id>/reject', methods=['POST'])
@admin_required
def reject_post(post_id):
    """Reject post (admin only)"""
    post = Post.query.get_or_404(post_id)
    post.moderation_status = 'rejected'
    db.session.commit()
    return jsonify(post.to_dict()), 200

@admin_bp.route('/users/<user_id>/mute', methods=['POST'])
@admin_required
def mute_user(user_id):
    """Mute user (admin only)"""
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    hours = data.get('hours', 24)  # Default 24 hours
    
    user.is_muted = True
    user.muted_until = datetime.utcnow() + timedelta(hours=hours)
    db.session.commit()
    return jsonify({'message': f'User muted for {hours} hours', 'muted_until': user.muted_until.isoformat()}), 200

@admin_bp.route('/users/<user_id>/unmute', methods=['POST'])
@admin_required
def unmute_user(user_id):
    """Unmute user (admin only)"""
    user = User.query.get_or_404(user_id)
    user.is_muted = False
    user.muted_until = None
    db.session.commit()
    return jsonify({'message': 'User unmuted'}), 200

@admin_bp.route('/ip-bans', methods=['GET'])
@admin_required
def get_ip_bans():
    """Get IP bans list (admin only)"""
    bans = IPBan.query.filter_by(is_active=True).all()
    return jsonify([ban.to_dict() for ban in bans]), 200

@admin_bp.route('/ip-bans', methods=['POST'])
@admin_required
def create_ip_ban():
    """Create IP ban (admin only)"""
    data = request.get_json()
    ip_address = data.get('ip_address')
    reason = data.get('reason', '')
    hours = data.get('hours')  # None = permanent
    
    if not ip_address:
        return jsonify({'error': 'IP address is required'}), 400
    
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
    """Remove IP ban (admin only)"""
    ban = IPBan.query.get_or_404(ban_id)
    ban.is_active = False
    db.session.commit()
    return jsonify({'message': 'IP ban removed'}), 200

@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_stats():
    """Get admin statistics"""
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
    """Get Miku auto-comment settings (admin only)"""
    settings = MikuSettings.get_settings()
    return jsonify(settings.to_dict()), 200

@admin_bp.route('/miku-settings', methods=['PUT'])
@admin_required
def update_miku_settings():
    """Update Miku auto-comment settings (admin only)"""
    settings = MikuSettings.get_settings()
    data = request.get_json()
    
    if 'is_enabled' in data:
        settings.is_enabled = bool(data['is_enabled'])
    if 'comment_interval_hours' in data:
        settings.comment_interval_hours = int(data['comment_interval_hours'])
    if 'max_comments_per_day' in data:
        settings.max_comments_per_day = int(data['max_comments_per_day'])
    if 'posts_age_days' in data:
        settings.posts_age_days = int(data['posts_age_days'])
    if 'personality_override' in data:
        settings.personality_override = data['personality_override'] if data['personality_override'] else None
    if 'enabled_days' in data:
        settings.enabled_days = str(data['enabled_days'])
    
    settings.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify(settings.to_dict()), 200

@admin_bp.route('/miku-settings/test', methods=['POST'])
@admin_required
def test_miku_comment():
    """Test Miku auto-comment (admin only)"""
    from app.services.miku_comment_service import miku_comment_service
    try:
        count = miku_comment_service.comment_on_own_posts()
        settings = MikuSettings.get_settings()
        return jsonify({
            'message': f'Miku commented on {count} posts',
            'count': count,
            'personality': miku_comment_service.get_personality_for_today(),
            'settings': settings.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
