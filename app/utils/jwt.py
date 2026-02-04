"""
JWT utilities
"""
from flask_jwt_extended import create_access_token, create_refresh_token, decode_token
from datetime import timedelta

def generate_tokens(user_id: str, expires_access=None, expires_refresh=None):
    """Generate access and refresh tokens"""
    if expires_access is None:
        expires_access = timedelta(minutes=15)
    if expires_refresh is None:
        expires_refresh = timedelta(days=7)
    
    access_token = create_access_token(
        identity=user_id,
        expires_delta=expires_access
    )
    refresh_token = create_refresh_token(
        identity=user_id,
        expires_delta=expires_refresh
    )
    
    return access_token, refresh_token

def verify_token(token: str):
    """Verify JWT token"""
    try:
        decoded = decode_token(token)
        return decoded
    except Exception:
        return None
