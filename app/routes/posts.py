"""
Posts routes
"""
from flask import Blueprint, request, jsonify, current_app
from app import db
from app.models.post import Post
from app.middleware.auth import token_required
from app.middleware.captcha import verify_captcha
from app.middleware.ip_ban import check_ip_ban
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app import limiter
from datetime import datetime
import uuid

posts_bp = Blueprint('posts', __name__)

@posts_bp.route('/', methods=['GET'])
def get_posts():
    """Get posts list"""
    filter_type = request.args.get('filter', 'new')  # new, popular, following
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    
    query = Post.query.filter_by(is_deleted=False, moderation_status='approved')
    
    if filter_type == 'popular':
        query = query.order_by(Post.likes_count.desc(), Post.created_at.desc())
    elif filter_type == 'following':
        from app.models.follow import Follow
        from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
        
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
            if user_id:
                following_ids = [f.following_id for f in Follow.query.filter_by(follower_id=user_id).all()]
                following_ids.append(user_id)  # Include own posts
                if following_ids:
                    query = query.filter(Post.user_id.in_(following_ids))
                else:
                    # No following users, return empty
                    return jsonify({
                        'posts': [],
                        'pagination': {
                            'page': page,
                            'per_page': per_page,
                            'total': 0,
                            'pages': 0,
                            'has_next': False,
                            'has_prev': False,
                        }
                    }), 200
        except:
            pass
        query = query.order_by(Post.created_at.desc())
    else:  # new
        query = query.order_by(Post.created_at.desc())
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'posts': [post.to_dict() for post in pagination.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev,
        }
    }), 200

@posts_bp.route('/<post_id>', methods=['GET'])
def get_post(post_id):
    """Get single post"""
    post = Post.query.get_or_404(post_id)
    
    if post.is_deleted:
        return jsonify({'error': 'Post not found'}), 404
    
    post.views_count += 1
    db.session.commit()
    
    return jsonify(post.to_dict()), 200

@posts_bp.route('/', methods=['POST'])
@limiter.limit("5 per minute")  # Rate limit: 5 постів на хвилину
@check_ip_ban
@token_required
@verify_captcha
def create_post():
    """Create new post"""
    # Check if user is muted
    if request.current_user.is_muted:
        if request.current_user.muted_until and datetime.utcnow() < request.current_user.muted_until:
            return jsonify({
                'error': 'You are muted',
                'muted_until': request.current_user.muted_until.isoformat()
            }), 403
        else:
            # Mute expired, clear it
            request.current_user.is_muted = False
            request.current_user.muted_until = None
            db.session.commit()
    
    data = request.get_json()
    
    content = data.get('content', '').strip()
    if not content:
        return jsonify({'error': 'Content is required'}), 400
    
    # Update activity status
    request.current_user.activity_status = 'PST'
    request.current_user.activity_data = None

    post = Post(
        id=str(uuid.uuid4()),
        user_id=request.current_user.id,
        content=content,
        theme=data.get('theme'),
        tags_list=data.get('tags', []),
        image_url=data.get('image_url'),
        is_nsfw=data.get('is_nsfw', False),
        is_anonymous=data.get('is_anonymous', False),
        moderation_status='approved',  # Auto-approve posts for now
    )
    
    db.session.add(post)
    
    # Update gallery item if image_url provided
    if post.image_url:
        from app.models.gallery import Gallery
        gallery_item = Gallery.query.filter_by(image_url=post.image_url).first()
        if gallery_item:
            gallery_item.post_id = post.id
    
    db.session.commit()

    # Reset activity status after 30 seconds
    from threading import Timer
    from app.models.user import User
    
    # Capture app instance and user_id while still in request context
    app_instance = current_app._get_current_object()
    user_id = request.current_user.id
    
    def reset_activity():
        # Use application context instead of request context
        with app_instance.app_context():
            user = User.query.get(user_id)
            if user:
                user.activity_status = ''
                user.activity_data = None
                db.session.commit()

    Timer(30.0, reset_activity).start()
    
    return jsonify(post.to_dict()), 201

@posts_bp.route('/<post_id>/like', methods=['POST'])
@token_required
def like_post(post_id):
    """Like/unlike post"""
    post = Post.query.get_or_404(post_id)
    
    # TODO: Implement PostLike model for tracking who liked
    post.likes_count += 1
    db.session.commit()
    
    return jsonify(post.to_dict()), 200

# Старий endpoint для локального завантаження зображень видалено.
# Використовуйте /api/upload для завантаження через Cloudinary.
# Endpoint повертає secure_url та public_id, які можна використовувати в постах.

@posts_bp.route('/<post_id>/repost', methods=['POST'])
@token_required
def repost(post_id):
    """Repost a post"""
    original_post = Post.query.get_or_404(post_id)
    
    # Create repost
    repost = Post(
        id=str(uuid.uuid4()),
        user_id=request.current_user.id,
        content=f"RT: {original_post.content}",
        image_url=original_post.image_url,
        is_nsfw=original_post.is_nsfw,
    )
    
    original_post.reposts_count += 1
    db.session.add(repost)
    db.session.commit()
    
    return jsonify(repost.to_dict()), 201

@posts_bp.route('/<post_id>/report', methods=['POST'])
@token_required
def report_post(post_id):
    """Report a post"""
    from app.models.report import Report
    
    post = Post.query.get_or_404(post_id)
    data = request.get_json()
    reason = data.get('reason', '').strip()
    
    if not reason:
        return jsonify({'error': 'Reason is required'}), 400
    
    report = Report(
        id=str(uuid.uuid4()),
        reporter_id=request.current_user.id,
        post_id=post_id,
        reason=reason
    )
    
    db.session.add(report)
    db.session.commit()
    
    return jsonify({'message': 'Post reported'}), 201

@posts_bp.route('/<post_id>', methods=['DELETE'])
@token_required
def delete_post(post_id):
    """Delete post"""
    post = Post.query.get_or_404(post_id)
    
    if post.user_id != request.current_user.id and request.current_user.status != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    post.is_deleted = True
    db.session.commit()
    
    return jsonify({'message': 'Post deleted'}), 200
