from flask import Blueprint, request, jsonify
from app import db
from app.models.ip_ban import IPBan
from datetime import datetime
import uuid

voluntary_bp = Blueprint('voluntary', __name__)

@voluntary_bp.route('/voluntary-ban', methods=['POST'])
def create_voluntary_ban():
    ip = request.remote_addr
    # Create a permanent voluntary ban for this IP
    existing = IPBan.query.filter_by(ip_address=ip).first()
    if existing:
        existing.reason = 'Voluntary ban by user'
        existing.is_active = True
        existing.is_voluntary = True
        # keep existing timestamps; do not assume updated_at field exists
        db.session.commit()
        return jsonify(existing.to_dict()), 200

    ban = IPBan(
        id=str(uuid.uuid4()),
        ip_address=ip,
        reason='Voluntary ban by user',
        banned_by=None,
        banned_until=None,
        is_active=True,
        is_voluntary=True,
        created_at=datetime.utcnow()
    )
    db.session.add(ban)
    db.session.commit()
    return jsonify(ban.to_dict()), 201


@voluntary_bp.route('/ip-ban-info', methods=['GET'])
def ip_ban_info():
    ip = request.remote_addr
    ban = IPBan.query.filter_by(ip_address=ip, is_active=True).first()
    if not ban:
        return jsonify({'banned': False}), 200
    return jsonify({'banned': True, 'reason': ban.reason, 'is_voluntary': ban.is_voluntary}), 200
