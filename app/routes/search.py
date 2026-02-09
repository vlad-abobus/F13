"""
Search and discovery routes
"""
from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User
from app.models.post import Post
from app.models.user_bookmark import UserBookmark
from app.middleware.auth import token_required
from app.services.search_service import SearchService
from flask_jwt_extended import get_jwt_identity
import uuid

search_bp = Blueprint('search', __name__)

@search_bp.route('/posts', methods=['GET'])
def search_posts():
    """
    Search for posts
    Query params: q (query), emotion, sort_by (new/popular/trending/relevant), 
    date_range, author, min_likes, max_likes, page, per_page
    """
    query = request.args.get('q', '').strip()
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    
    filters = {}
    if request.args.get('emotion'):
        filters['emotion'] = request.args.get('emotion')
    if request.args.get('sort_by'):
        filters['sort_by'] = request.args.get('sort_by')
    if request.args.get('date_range'):
        filters['date_range'] = request.args.get('date_range', type=int)
    if request.args.get('author'):
        filters['author'] = request.args.get('author')
    if request.args.get('min_likes'):
        filters['min_likes'] = request.args.get('min_likes', type=int)
    if request.args.get('max_likes'):
        filters['max_likes'] = request.args.get('max_likes', type=int)
    
    result = SearchService.search_posts(query, filters, page, per_page)
    return jsonify(result), 200

@search_bp.route('/users', methods=['GET'])
def search_users():
    """
    Search for users
    Query params: q (query), page, per_page
    """
    query = request.args.get('q', '').strip()
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    
    if not query or len(query) < 2:
        return jsonify({'error': 'Query too short (min 2 chars)'}), 400
    
    result = SearchService.search_users(query, page, per_page)
    return jsonify(result), 200

@search_bp.route('/trending', methods=['GET'])
def get_trending():
    """
    Get trending posts
    Query params: emotion, days, limit
    """
    emotion = request.args.get('emotion')
    days = request.args.get('days', 7, type=int)
    limit = min(request.args.get('limit', 20, type=int), 100)
    
    posts = SearchService.get_trending_posts(emotion, days, limit)
    return jsonify({'posts': posts, 'count': len(posts)}), 200

@search_bp.route('/recommended', methods=['GET'])
@token_required
def get_recommended():
    """
    Get recommended posts for current user
    Query params: limit
    """
    user_id = get_jwt_identity()
    limit = min(request.args.get('limit', 20, type=int), 100)
    
    posts = SearchService.get_recommended_posts(user_id, limit)
    return jsonify({'posts': posts, 'count': len(posts)}), 200

# Bookmarks endpoints
@search_bp.route('/bookmarks', methods=['GET'])
@token_required
def get_bookmarks():
    """Get user's bookmarked posts"""
    user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    
    query = UserBookmark.query.filter_by(user_id=user_id).order_by(
        UserBookmark.created_at.desc()
    )
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'bookmarks': [b.to_dict() for b in pagination.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages,
        }
    }), 200

@search_bp.route('/bookmarks/<post_id>', methods=['POST'])
@token_required
def add_bookmark(post_id):
    """Bookmark a post"""
    user_id = get_jwt_identity()
    
    # Check if post exists
    post = Post.query.get_or_404(post_id)
    
    # Check if already bookmarked
    existing = UserBookmark.query.filter_by(
        user_id=user_id,
        post_id=post_id
    ).first()
    
    if existing:
        return jsonify({'error': 'Already bookmarked'}), 400
    
    bookmark = UserBookmark(
        id=str(uuid.uuid4()),
        user_id=user_id,
        post_id=post_id
    )
    db.session.add(bookmark)
    db.session.commit()
    
    return jsonify({'message': 'Bookmarked', 'bookmark': bookmark.to_dict()}), 201

@search_bp.route('/bookmarks/<post_id>', methods=['DELETE'])
@token_required
def remove_bookmark(post_id):
    """Remove a bookmark"""
    user_id = get_jwt_identity()
    
    bookmark = UserBookmark.query.filter_by(
        user_id=user_id,
        post_id=post_id
    ).first_or_404()
    
    db.session.delete(bookmark)
    db.session.commit()
    
    return jsonify({'message': 'Bookmark removed'}), 200

@search_bp.route('/bookmarks/<post_id>/check', methods=['GET'])
@token_required
def check_bookmark(post_id):
    """Check if a post is bookmarked"""
    user_id = get_jwt_identity()
    
    bookmarked = UserBookmark.query.filter_by(
        user_id=user_id,
        post_id=post_id
    ).first() is not None
    
    return jsonify({'bookmarked': bookmarked}), 200
