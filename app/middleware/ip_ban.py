"""
IP Ban middleware
"""
from functools import wraps
from flask import request, jsonify
from app import db
from app.models.ip_ban import IPBan
from datetime import datetime

def check_ip_ban(f):
    """Decorator to check if IP is banned"""
    @wraps(f)
    def decorated(*args, **kwargs):
        ip_address = request.remote_addr
        
        # Check for active IP ban
        active_ban = IPBan.query.filter_by(
            ip_address=ip_address,
            is_active=True
        ).first()
        
        if active_ban and active_ban.is_valid():
            return jsonify({
                'error': 'Your IP address has been banned',
                'reason': active_ban.reason,
                'banned_until': active_ban.banned_until.isoformat() if active_ban.banned_until else None
            }), 403
        
        return f(*args, **kwargs)
    return decorated
