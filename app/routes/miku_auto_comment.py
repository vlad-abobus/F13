"""
Miku Auto Comment routes
"""
from flask import Blueprint, jsonify
from app import db
from app.services.miku_comment_service import miku_comment_service
from app.middleware.auth import admin_required

miku_auto_bp = Blueprint('miku_auto', __name__)

@miku_auto_bp.route('/comment-on-posts', methods=['POST'])
@admin_required
def trigger_auto_comment():
    """Manually trigger Miku to comment on her posts (admin only)"""
    try:
        count = miku_comment_service.comment_on_own_posts()
        return jsonify({
            'message': f'Miku commented on {count} posts',
            'count': count,
            'personality': miku_comment_service.get_personality_for_today()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
