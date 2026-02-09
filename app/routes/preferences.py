"""
User preferences routes
"""
from flask import Blueprint, request, jsonify
from app import db
from app.models.user_preference import UserPreference
from app.models.user import User
from app.middleware.auth import token_required
from flask_jwt_extended import get_jwt_identity
import uuid

preferences_bp = Blueprint('preferences', __name__)

def get_or_create_preferences(user_id):
    """Get or create user preferences"""
    prefs = UserPreference.query.filter_by(user_id=user_id).first()
    if not prefs:
        prefs = UserPreference(
            id=str(uuid.uuid4()),
            user_id=user_id
        )
        db.session.add(prefs)
        db.session.commit()
    return prefs

@preferences_bp.route('', methods=['GET'])
@token_required
def get_preferences():
    """Get current user's preferences"""
    user_id = get_jwt_identity()
    prefs = get_or_create_preferences(user_id)
    return jsonify(prefs.to_dict()), 200

@preferences_bp.route('', methods=['PUT'])
@token_required
def update_preferences():
    """Update current user's preferences"""
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    prefs = get_or_create_preferences(user_id)
    
    # Content preferences
    if 'preferred_emotions' in data:
        prefs.preferred_emotions = ','.join(data['preferred_emotions']) if isinstance(data['preferred_emotions'], list) else data['preferred_emotions']
    if 'preferred_languages' in data:
        prefs.preferred_languages = data['preferred_languages']
    if 'show_explicit' in data:
        prefs.show_explicit = data['show_explicit']
    
    # Notification preferences
    if 'notifications' in data:
        notif = data['notifications']
        if 'enabled' in notif:
            prefs.notifications_enabled = notif['enabled']
        if 'replies' in notif:
            prefs.notify_replies = notif['replies']
        if 'mentions' in notif:
            prefs.notify_mentions = notif['mentions']
        if 'likes' in notif:
            prefs.notify_likes = notif['likes']
        if 'follows' in notif:
            prefs.notify_follows = notif['follows']
    
    # Privacy preferences
    if 'privacy' in data:
        privacy = data['privacy']
        if 'show_profile' in privacy:
            prefs.show_profile = privacy['show_profile']
        if 'allow_messages' in privacy:
            prefs.allow_messages = privacy['allow_messages']
        if 'show_activity' in privacy:
            prefs.show_activity = privacy['show_activity']
    
    # Display preferences
    if 'display' in data:
        display = data['display']
        if 'theme' in display:
            prefs.theme = display['theme']
        if 'posts_per_page' in display:
            prefs.posts_per_page = min(max(display['posts_per_page'], 10), 100)  # 10-100
        if 'compact_mode' in display:
            prefs.compact_mode = display['compact_mode']
    
    db.session.commit()
    return jsonify({'message': 'Preferences updated', 'preferences': prefs.to_dict()}), 200

@preferences_bp.route('/reset', methods=['POST'])
@token_required
def reset_preferences():
    """Reset preferences to default"""
    user_id = get_jwt_identity()
    
    prefs = UserPreference.query.filter_by(user_id=user_id).first()
    if prefs:
        db.session.delete(prefs)
        db.session.commit()
    
    # Create new default preferences
    new_prefs = get_or_create_preferences(user_id)
    return jsonify({'message': 'Preferences reset', 'preferences': new_prefs.to_dict()}), 200

@preferences_bp.route('/theme', methods=['GET', 'PUT'])
@token_required
def manage_theme():
    """Get or update user theme preference"""
    user_id = get_jwt_identity()
    prefs = get_or_create_preferences(user_id)
    
    if request.method == 'PUT':
        data = request.get_json() or {}
        if 'theme' in data and data['theme'] in ['dark', 'light']:
            prefs.theme = data['theme']
            db.session.commit()
            return jsonify({'message': 'Theme updated', 'theme': prefs.theme}), 200
        return jsonify({'error': 'Invalid theme'}), 400
    
    return jsonify({'theme': prefs.theme}), 200

@preferences_bp.route('/notifications', methods=['GET', 'PUT'])
@token_required
def manage_notifications():
    """Get or update notification preferences"""
    user_id = get_jwt_identity()
    prefs = get_or_create_preferences(user_id)
    
    if request.method == 'PUT':
        data = request.get_json() or {}
        for key in ['enabled', 'replies', 'mentions', 'likes', 'follows']:
            if key in data:
                setattr(prefs, f'notify_{key}', data[key])
        db.session.commit()
    
    return jsonify({
        'enabled': prefs.notifications_enabled,
        'replies': prefs.notify_replies,
        'mentions': prefs.notify_mentions,
        'likes': prefs.notify_likes,
        'follows': prefs.notify_follows,
    }), 200
