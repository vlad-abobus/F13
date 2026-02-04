"""
Users routes
"""
from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User
from app.models.post import Post
from app.middleware.auth import token_required
from app.utils.password import hash_password
import uuid

users_bp = Blueprint('users', __name__)

@users_bp.route('/<username>', methods=['GET'])
def get_user(username):
    """Get user profile"""
    user = User.query.filter_by(username=username).first_or_404()
    
    return jsonify(user.to_dict()), 200

@users_bp.route('/<username>/posts', methods=['GET'])
def get_user_posts(username):
    """Get user posts"""
    user = User.query.filter_by(username=username).first_or_404()
    
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    
    query = Post.query.filter_by(
        user_id=user.id,
        is_deleted=False,
        moderation_status='approved'
    ).order_by(Post.created_at.desc())
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'posts': [post.to_dict() for post in pagination.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages,
        }
    }), 200

@users_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile():
    """
    Update user profile.
    
    Тепер підтримує avatar_url з Cloudinary (secure_url).
    Завантаження файлів відбувається через /api/upload endpoint.
    """
    data = request.get_json()
    
    user = request.current_user
    
    if 'bio' in data:
        user.bio = data['bio']
    if 'language' in data:
        user.language = data['language']
    if 'avatar_url' in data:
        # Оновлюємо avatar_url з Cloudinary secure_url
        user.avatar_url = data['avatar_url']
    
    db.session.commit()
    
    return jsonify(user.to_dict()), 200

# Старий endpoint для локального завантаження аватара видалено.
# Використовуйте /api/upload для завантаження через Cloudinary,
# потім оновіть профіль через PUT /api/users/profile з avatar_url.

@users_bp.route('/<user_id>/follow', methods=['POST'])
@token_required
def follow_user(user_id):
    """Follow/unfollow user"""
    from app.models.follow import Follow
    
    if user_id == request.current_user.id:
        return jsonify({'error': 'Cannot follow yourself'}), 400
    
    target_user = User.query.get_or_404(user_id)
    
    existing_follow = Follow.query.filter_by(
        follower_id=request.current_user.id,
        following_id=user_id
    ).first()
    
    if existing_follow:
        db.session.delete(existing_follow)
        action = 'unfollowed'
    else:
        follow = Follow(
            id=str(uuid.uuid4()),
            follower_id=request.current_user.id,
            following_id=user_id
        )
        db.session.add(follow)
        action = 'followed'
    
    db.session.commit()
    
    return jsonify({'message': f'User {action}', 'action': action}), 200
