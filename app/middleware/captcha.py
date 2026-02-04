"""
CAPTCHA middleware for simple question-based CAPTCHA
"""
from functools import wraps
from flask import request, jsonify
import os
import time

def verify_captcha(f):
    """Decorator for CAPTCHA verification"""
    @wraps(f)
    def decorated(*args, **kwargs):

        # Get captcha data from request
        captcha_data = None
        captcha_question_id = None
        
        if request.is_json:
            captcha_data = request.json.get('captcha_token')
            captcha_question_id = request.json.get('captcha_question_id')
        else:
            captcha_data = request.form.get('captcha_token')
            captcha_question_id = request.form.get('captcha_question_id')

        # In development, allow bypass if no captcha provided
        if os.getenv('FLASK_ENV') != 'production':
            if not captcha_data:
                
                return f(*args, **kwargs)
        
        # Verify captcha if provided
        if captcha_data and captcha_question_id:
            # Import here to avoid circular import
            from app.routes.captcha import verified_questions, active_questions

            # Check if question was verified (one-time use)
            if captcha_question_id in verified_questions:
                stored_answer = verified_questions[captcha_question_id]['answer']
                
                if captcha_data.lower().strip() == stored_answer:
                    # Remove from verified after use (one-time use)
                    del verified_questions[captcha_question_id]
                    
                else:
                    
                    return jsonify({'error': 'CAPTCHA verification failed'}), 400
            elif captcha_question_id in active_questions:
                # Question exists but not verified yet
                stored_answer = active_questions[captcha_question_id]['answer']
                
                if captcha_data.lower().strip() == stored_answer:
                    # Move to verified and remove from active
                    verified_questions[captcha_question_id] = {
                        'answer': stored_answer,
                        'verified_at': time.time()
                    }
                    del active_questions[captcha_question_id]
                    
                else:
                    
                    return jsonify({'error': 'CAPTCHA verification failed'}), 400
            else:
                
                return jsonify({'error': 'Invalid or expired CAPTCHA'}), 400
        else:
            # In production, require captcha
            if os.getenv('FLASK_ENV') == 'production':
                return jsonify({'error': 'CAPTCHA verification required'}), 400
        
        return f(*args, **kwargs)
    return decorated
