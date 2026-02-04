"""
Profile Posts routes (Wall posts like VK)
"""
from flask import Blueprint, request, jsonify
from app import db
from app.models.profile_post import ProfilePost
from app.models.user import User
from app.middleware.auth import token_required
from app.middleware.captcha import verify_captcha
from app.middleware.ip_ban import check_ip_ban
from app import limiter
from datetime import datetime
import uuid

profile_posts_bp = Blueprint('profile_posts', __name__)

@profile_posts_bp.route('/user/<username>', methods=['GET'])
def get_profile_posts(username):
    """Get wall posts for user profile"""
    user = User.query.filter_by(username=username).first_or_404()
    
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    
    posts = ProfilePost.query.filter_by(
        profile_user_id=user.id,
        is_deleted=False
    ).order_by(ProfilePost.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'posts': [post.to_dict() for post in posts.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': posts.total,
            'pages': posts.pages,
            'has_next': posts.has_next,
            'has_prev': posts.has_prev,
        }
    }), 200

@profile_posts_bp.route('/user/<username>', methods=['POST'])
@token_required
@limiter.limit("5 per minute")
@check_ip_ban
@verify_captcha
def create_profile_post(username):
    """Create post on user's wall"""
    profile_user = User.query.filter_by(username=username).first_or_404()
    data = request.get_json()
    
    content = data.get('content', '').strip()
    if not content:
        return jsonify({'error': 'Content is required'}), 400
    
    if len(content) > 5000:
        return jsonify({'error': 'Post is too long (max 5000 characters)'}), 400
    
    # Check if user is muted
    if request.current_user.is_muted:
        if request.current_user.muted_until and datetime.utcnow() < request.current_user.muted_until:
            return jsonify({
                'error': 'You are muted',
                'muted_until': request.current_user.muted_until.isoformat()
            }), 403
        else:
            request.current_user.is_muted = False
            request.current_user.muted_until = None
            db.session.commit()
    
    post = ProfilePost(
        id=str(uuid.uuid4()),
        profile_user_id=profile_user.id,
        author_id=request.current_user.id,
        content=content,
        image_url=data.get('image_url')
    )
    
    db.session.add(post)
    db.session.commit()
    
    return jsonify(post.to_dict()), 201

@profile_posts_bp.route('/<post_id>/like', methods=['POST'])
@token_required
def like_profile_post(post_id):
    """Like profile post"""
    post = ProfilePost.query.get_or_404(post_id)
    post.likes_count += 1
    db.session.commit()
    return jsonify(post.to_dict()), 200

@profile_posts_bp.route('/<post_id>', methods=['DELETE'])
@token_required
def delete_profile_post(post_id):
    """Delete profile post"""
    post = ProfilePost.query.get_or_404(post_id)
    
    # Only author or profile owner can delete
    if post.author_id != request.current_user.id and post.profile_user_id != request.current_user.id:
        if request.current_user.status != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403
    
    post.is_deleted = True
    db.session.commit()
    
    return jsonify({'message': 'Post deleted'}), 200
