"""
Comments routes
"""
from flask import Blueprint, request, jsonify
from app import db
from app.models.comment import Comment
from app.models.post import Post
from app.middleware.auth import token_required
from app.middleware.captcha import verify_captcha
from app.middleware.ip_ban import check_ip_ban
from app import limiter
from datetime import datetime
import uuid

comments_bp = Blueprint('comments', __name__)

@comments_bp.route('/post/<post_id>', methods=['GET'])
def get_comments(post_id):
    """Get comments for post"""
    post = Post.query.get_or_404(post_id)
    
    # Get top-level comments (no parent)
    comments = Comment.query.filter_by(
        post_id=post_id,
        parent_id=None,
        is_deleted=False
    ).order_by(Comment.created_at.asc()).all()
    
    return jsonify([comment.to_dict() for comment in comments]), 200

@comments_bp.route('/', methods=['POST'])
@token_required
@limiter.limit("10 per minute")
@check_ip_ban
@verify_captcha
def create_comment():
    """Create new comment"""
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
    
    post_id = data.get('post_id')
    content = data.get('content', '').strip()
    parent_id = data.get('parent_id')
    
    if not post_id or not content:
        return jsonify({'error': 'Post ID and content are required'}), 400
    
    if len(content) > 5000:
        return jsonify({'error': 'Comment is too long (max 5000 characters)'}), 400
    
    post = Post.query.get_or_404(post_id)
    
    comment = Comment(
        id=str(uuid.uuid4()),
        post_id=post_id,
        user_id=request.current_user.id,
        parent_id=parent_id,
        content=content
    )
    
    post.comments_count += 1
    db.session.add(comment)
    db.session.commit()
    
    return jsonify(comment.to_dict()), 201

@comments_bp.route('/<comment_id>/like', methods=['POST'])
@token_required
def like_comment(comment_id):
    """Like comment"""
    comment = Comment.query.get_or_404(comment_id)
    
    # TODO: Implement CommentLike model
    comment.likes_count += 1
    db.session.commit()
    
    return jsonify(comment.to_dict()), 200

@comments_bp.route('/<comment_id>', methods=['DELETE'])
@token_required
def delete_comment(comment_id):
    """Delete comment"""
    comment = Comment.query.get_or_404(comment_id)
    
    if comment.user_id != request.current_user.id and request.current_user.status != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    comment.is_deleted = True
    comment.post.comments_count -= 1
    db.session.commit()
    
    return jsonify({'message': 'Comment deleted'}), 200
