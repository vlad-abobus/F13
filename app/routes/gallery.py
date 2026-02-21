"""
Gallery routes
"""
from flask import Blueprint, request, jsonify
from app import db
from app.models.gallery import Gallery
from app.models.post import Post
from app.middleware.auth import token_required
from app.middleware.captcha import verify_captcha
from sqlalchemy import or_
import json

gallery_bp = Blueprint('gallery', __name__)

@gallery_bp.route('/', methods=['GET'])
def get_gallery():
    """Get gallery images"""
    category = request.args.get('category')
    tag = request.args.get('tag')
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    
    # LEFT JOIN to include user-uploaded items (post_id=NULL)
    query = Gallery.query.outerjoin(Post)
    
    # Either: user-uploaded (post_id is NULL) OR post-linked with approved post
    query = query.filter(
        or_(
            Gallery.post_id.is_(None),
            (Post.is_deleted == False) & (Post.moderation_status == 'approved')
        )
    )
    
    if category:
        query = query.filter(Gallery.category == category)
    
    if tag:
        # Filter by tag in either gallery.tags or post.tags
        query = query.filter(
            or_(
                Gallery.tags.contains(f'"{tag}"'),
                Post.tags.contains(f'"{tag}"')
            )
        )
    
    pagination = query.distinct().order_by(Gallery.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    
    items = []
    for gallery_item in pagination.items:
        post = Post.query.get(gallery_item.post_id) if gallery_item.post_id else None
        # Get tags from gallery_item tags field or post tags
        tags = []
        if hasattr(gallery_item, 'tags') and gallery_item.tags:
            tags = gallery_item.tags_list
        elif post:
            tags = post.tags_list
        
        items.append({
            'id': gallery_item.id,
            'image_url': gallery_item.image_url,
            'post_id': gallery_item.post_id,
            'tags': tags,
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

@gallery_bp.route('/upload', methods=['POST'])
@token_required
@verify_captcha
def upload_to_gallery():
    """Upload image directly to gallery (without creating a post)"""
    from flask import request as flask_request
    
    data = request.get_json()
    current_user = flask_request.current_user
    
    if not current_user:
        return jsonify({'error': 'Authentication required'}), 401
    
    if not data.get('image_url'):
        return jsonify({'error': 'Image URL required'}), 400
    
    tags = data.get('tags', [])
    
    gallery_item = Gallery(
        image_url=data.get('image_url'),
        is_nsfw=data.get('is_nsfw', False),
        tags=json.dumps(tags),
        user_id=current_user.id,
        category='user-uploads'
    )
    
    db.session.add(gallery_item)
    db.session.commit()
    
    return jsonify(gallery_item.to_dict()), 201

@gallery_bp.route('/report', methods=['POST'])
@verify_captcha
def report_gallery_item():
    """Report inappropriate gallery item"""
    data = request.get_json()
    gallery_id = data.get('gallery_id')
    reason = data.get('reason')
    
    if not gallery_id or not reason:
        return jsonify({'error': 'Gallery ID and reason required'}), 400
    
    gallery_item = Gallery.query.get_or_404(gallery_id)
    
    # Log the report (in a real app, store in database)
    print(f"[REPORT] Gallery {gallery_id} reported for: {reason}")
    
    return jsonify({'message': 'Report received and will be reviewed'}), 200
