"""
Gallery routes
"""
from flask import Blueprint, request, jsonify
from app import db
from app.models.gallery import Gallery
from app.models.post import Post
from app.middleware.auth import token_required
import json

gallery_bp = Blueprint('gallery', __name__)

@gallery_bp.route('/', methods=['GET'])
def get_gallery():
    """Get gallery images"""
    category = request.args.get('category')
    tag = request.args.get('tag')
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    
    query = Gallery.query.join(Post).filter(
        Post.is_deleted == False,
        Post.moderation_status == 'approved'
    )
    
    if category:
        query = query.filter(Gallery.category == category)
    
    if tag:
        # Filter by tag in post tags
        query = query.join(Post).filter(Post.tags.contains(f'"{tag}"'))
    
    pagination = query.order_by(Gallery.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    
    items = []
    for gallery_item in pagination.items:
        post = Post.query.get(gallery_item.post_id) if gallery_item.post_id else None
        items.append({
            'id': gallery_item.id,
            'image_url': gallery_item.image_url,
            'tags': post.tags_list if post else [],
            'is_nsfw': gallery_item.is_nsfw,
            'likes_count': gallery_item.likes_count,
            'created_at': gallery_item.created_at.isoformat() if gallery_item.created_at else None,
        })
    
    return jsonify({
        'items': items,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev,
        }
    }), 200

@gallery_bp.route('/tags', methods=['GET'])
def get_tags():
    """Get all tags"""
    # Extract unique tags from posts
    posts = Post.query.filter(
        Post.is_deleted == False,
        Post.moderation_status == 'approved',
        Post.tags.isnot(None)
    ).all()
    
    tags = set()
    for post in posts:
        if post.tags:
            try:
                post_tags = json.loads(post.tags) if isinstance(post.tags, str) else post.tags
                tags.update(post_tags)
            except:
                pass
    
    return jsonify(sorted(list(tags))), 200

@gallery_bp.route('/<item_id>/like', methods=['POST'])
@token_required
def like_gallery_item(item_id):
    """Like gallery item"""
    gallery_item = Gallery.query.get_or_404(item_id)
    
    # TODO: Implement GalleryLike model
    gallery_item.likes_count += 1
    db.session.commit()
    
    return jsonify(gallery_item.to_dict()), 200
