"""
HTML Pages routes
"""
from flask import Blueprint, request, jsonify
from app import db
from app.models.html_page import HtmlPage
from app.middleware.auth import admin_required, token_required

pages_bp = Blueprint('pages', __name__)

@pages_bp.route('/<slug>', methods=['GET'])
def get_page(slug):
    """Get HTML page by slug"""
    lang = request.args.get('lang', 'ru')
    
    page = HtmlPage.query.filter_by(slug=slug, language=lang, is_active=True).first()
    if not page:
        # Try to get default language (ru)
        page = HtmlPage.query.filter_by(slug=slug, language='ru', is_active=True).first()
    
    if not page:
        return jsonify({'error': 'Page not found'}), 404
    
    return jsonify(page.to_dict()), 200

@pages_bp.route('/list', methods=['GET'])
@admin_required
def list_pages():
    """List all pages (admin only)"""
    pages = HtmlPage.query.all()
    return jsonify([page.to_dict() for page in pages]), 200

@pages_bp.route('/', methods=['POST'])
@admin_required
def create_page():
    """Create new HTML page (admin only)"""
    data = request.get_json()
    
    slug = data.get('slug')
    title = data.get('title')
    content = data.get('content')
    language = data.get('language', 'ru')
    
    if not all([slug, title, content]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Check if page with same slug and language exists
    existing = HtmlPage.query.filter_by(slug=slug, language=language).first()
    if existing:
        return jsonify({'error': 'Page with this slug and language already exists'}), 400
    
    page = HtmlPage(
        slug=slug,
        title=title,
        content=content,
        language=language,
        updated_by=request.current_user.id
    )
    db.session.add(page)
    db.session.commit()
    
    return jsonify(page.to_dict()), 201

@pages_bp.route('/<page_id>', methods=['PUT'])
@admin_required
def update_page(page_id):
    """Update HTML page (admin only)"""
    page = HtmlPage.query.get_or_404(page_id)
    data = request.get_json()
    
    if 'title' in data:
        page.title = data['title']
    if 'content' in data:
        page.content = data['content']
    if 'is_active' in data:
        page.is_active = data['is_active']
    if 'language' in data:
        page.language = data['language']
    
    page.updated_by = request.current_user.id
    db.session.commit()
    
    return jsonify(page.to_dict()), 200

@pages_bp.route('/<page_id>', methods=['DELETE'])
@admin_required
def delete_page(page_id):
    """Delete HTML page (admin only)"""
    page = HtmlPage.query.get_or_404(page_id)
    db.session.delete(page)
    db.session.commit()
    
    return jsonify({'message': 'Page deleted'}), 200
