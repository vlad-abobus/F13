"""
GoonZone routes (Polls, News, Rules, Quotes)
"""
from flask import Blueprint, request, jsonify
from app import db
from app.models.goonzone import GoonZonePoll, GoonZoneNews, GoonZoneRule
from app.middleware.auth import token_required, admin_required
from app.middleware.captcha import verify_captcha
import uuid
import random

goonzone_bp = Blueprint('goonzone', __name__)

@goonzone_bp.route('/polls', methods=['GET'])
def get_polls():
    """Get polls list"""
    polls = GoonZonePoll.query.order_by(GoonZonePoll.created_at.desc()).all()
    return jsonify([poll.to_dict() for poll in polls]), 200

@goonzone_bp.route('/polls', methods=['POST'])
@admin_required
def create_poll():
    """Create poll (admin only)"""
    data = request.get_json()
    
    poll = GoonZonePoll(
        id=str(uuid.uuid4()),
        user_id=request.current_user.id,
        title=data.get('title'),
        description=data.get('description'),
        options_list=data.get('options', []),
        votes_dict={}
    )
    
    db.session.add(poll)
    db.session.commit()
    
    return jsonify(poll.to_dict()), 201

@goonzone_bp.route('/polls/<poll_id>/vote', methods=['POST'])
@token_required
@verify_captcha
def vote_poll(poll_id):
    """Vote in poll"""
    poll = GoonZonePoll.query.get_or_404(poll_id)
    data = request.get_json()
    
    option = data.get('option')
    if option not in poll.options_list:
        return jsonify({'error': 'Invalid option'}), 400
    
    votes = poll.votes_dict
    votes[option] = votes.get(option, 0) + 1
    poll.votes_dict = votes
    
    db.session.commit()
    
    return jsonify(poll.to_dict()), 200

@goonzone_bp.route('/news', methods=['GET'])
def get_news():
    """Get news list"""
    news = GoonZoneNews.query.order_by(
        GoonZoneNews.is_pinned.desc(),
        GoonZoneNews.created_at.desc()
    ).all()
    return jsonify([item.to_dict() for item in news]), 200

@goonzone_bp.route('/rules', methods=['GET'])
def get_rules():
    """Get rules list"""
    rules = GoonZoneRule.query.order_by(GoonZoneRule.order.asc()).all()
    return jsonify([rule.to_dict() for rule in rules]), 200

@goonzone_bp.route('/quote', methods=['GET'])
def get_quote():
    """Get random quote"""
    from app.models.quote import Quote
    
    quote_type = request.args.get('type')
    query = Quote.query
    if quote_type:
        query = query.filter_by(type=quote_type)
    
    quotes = query.all()
    
    if quotes:
        quote = random.choice(quotes)
        return jsonify(quote.to_dict()), 200
    
    # Fallback quotes
    fallback_quotes = [
        {'text': 'Життя - це не те, що з тобою відбувається, а те, як ти на це реагуєш.', 'type': 'motivational'},
        {'text': 'Краще бути одиноким, ніж з неправильними людьми.', 'type': 'ironic'},
        {'text': 'Успіх - це вміння переходити від однієї невдачі до іншої, не втрачаючи ентузіазму.', 'type': 'motivational'},
    ]
    
    quote = random.choice(fallback_quotes)
    return jsonify(quote), 200
