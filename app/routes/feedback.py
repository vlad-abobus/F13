"""
Feedback endpoints
"""
from flask import Blueprint, request, jsonify
from app.models.feedback import Feedback
from app import db
from app.middleware.auth import token_required, admin_required

feedback_bp = Blueprint('feedback', __name__)


@feedback_bp.route('/', methods=['POST'])
def create_feedback():
    """Create feedback/bug report without authentication"""
    data = request.get_json() or {}
    
    feedback_type = (data.get('type') or 'bug').strip()
    title = (data.get('title') or '').strip()
    description = (data.get('description') or '').strip()
    email = (data.get('email') or '').strip()
    
    # Validate required fields
    if not title:
        return jsonify({'error': 'Title is required'}), 400
    
    if not description:
        return jsonify({'error': 'Description is required'}), 400
    
    if feedback_type not in ['bug', 'feature']:
        return jsonify({'error': 'Invalid feedback type'}), 400
    
    if email and '@' not in email:
        return jsonify({'error': 'Invalid email'}), 400
    
    # Create feedback record
    feedback = Feedback(
        type=feedback_type,
        title=title,
        description=description,
        email=email if email else None
    )
    
    try:
        db.session.add(feedback)
        db.session.commit()
        return jsonify({'message': 'Feedback received successfully', 'id': feedback.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to save feedback'}), 500


@feedback_bp.route('/', methods=['GET'])
@admin_required
def get_all_feedback():
    """Get all feedback reports (admin only)"""
    feedback_type = request.args.get('type')
    limit = request.args.get('limit', 50, type=int)
    
    query = Feedback.query
    
    if feedback_type and feedback_type in ['bug', 'feature']:
        query = query.filter_by(type=feedback_type)
    
    feedbacks = query.order_by(Feedback.created_at.desc()).limit(limit).all()
    
    return jsonify([f.to_dict() for f in feedbacks]), 200


@feedback_bp.route('/<feedback_id>', methods=['DELETE'])
@admin_required
def delete_feedback(feedback_id):
    """Delete a feedback report (admin only)"""
    feedback = Feedback.query.get(feedback_id)
    
    if not feedback:
        return jsonify({'error': 'Feedback not found'}), 404
    
    try:
        db.session.delete(feedback)
        db.session.commit()
        return jsonify({'message': 'Feedback deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete feedback'}), 500
