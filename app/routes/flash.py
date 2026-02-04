"""
Flash games routes
"""
from flask import Blueprint, request, jsonify
from app import db
from app.models.flash_game import FlashGame
from app.middleware.auth import token_required, admin_required
import uuid

flash_bp = Blueprint('flash', __name__)

@flash_bp.route('/games', methods=['GET'])
def get_games():
    """Get games list"""
    games = FlashGame.query.order_by(FlashGame.created_at.desc()).all()
    return jsonify([game.to_dict() for game in games]), 200

@flash_bp.route('/games/<game_id>', methods=['GET'])
def get_game(game_id):
    """Get single game"""
    game = FlashGame.query.get_or_404(game_id)
    return jsonify(game.to_dict()), 200

@flash_bp.route('/games/<game_id>/play', methods=['POST'])
@token_required
def play_game(game_id):
    """Update activity status when playing game"""
    game = FlashGame.query.get_or_404(game_id)
    
    request.current_user.activity_status = 'GRY'
    request.current_user.activity_data = game.title
    db.session.commit()
    
    return jsonify({'message': 'Activity updated'}), 200
