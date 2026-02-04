"""
Simple CAPTCHA routes with questions
"""
from flask import Blueprint, request, jsonify
import random
import secrets
import time

captcha_bp = Blueprint('captcha', __name__)

# Store active questions (in production, use Redis or database)
active_questions = {}
# Store verified questions (can be used once for form submission)
verified_questions = {}

def generate_math_question():
    """Generate a random math question"""
    op = random.choice(['+', '-', '*'])
    
    if op == '+':
        a = random.randint(1, 20)
        b = random.randint(1, 20)
        answer = a + b
        question = f"{a} + {b} = ?"
    elif op == '-':
        a = random.randint(10, 50)
        b = random.randint(1, a)
        answer = a - b
        question = f"{a} - {b} = ?"
    else:  # *
        a = random.randint(2, 10)
        b = random.randint(2, 10)
        answer = a * b
        question = f"{a} × {b} = ?"
    
    return question, str(answer)

def generate_logic_question():
    """Generate a random logic question"""
    questions = [
        ('Скільки днів у тижні?', '7'),
        ('Яка перша літера алфавіту?', 'а'),
        ('Скільки кольорів у веселці?', '7'),
        ('Яка столиця України?', 'київ'),
        ('2 + 2 = ?', '4'),
        ('Скільки місяців у році?', '12'),
        ('Скільки годин у добі?', '24'),
        ('Яка друга літера алфавіту?', 'б'),
        ('5 × 5 = ?', '25'),
        ('10 - 3 = ?', '7'),
        ('Скільки пальців на руці?', '5'),
        ('Яка столиця Росії?', 'москва'),
        ('3 + 7 = ?', '10'),
        ('Скільки секунд у хвилині?', '60'),
        ('8 ÷ 2 = ?', '4'),
    ]
    
    question, answer = random.choice(questions)
    return question, answer

@captcha_bp.route('/question', methods=['GET'])
def get_question():
    """Get a new CAPTCHA question"""
    question_type = random.choice(['math', 'logic'])
    
    if question_type == 'math':
        question_text, answer = generate_math_question()
    else:
        question_text, answer = generate_logic_question()
    
    question_id = secrets.token_urlsafe(16)
    
    # Store question with normalized answer
    active_questions[question_id] = {
        'answer': answer.lower().strip(),
        'type': question_type,
        'created_at': time.time()
    }
    
    return jsonify({
        'id': question_id,
        'question': question_text,
        'type': question_type
    }), 200

@captcha_bp.route('/verify', methods=['POST'])
def verify_captcha():
    """Verify CAPTCHA answer"""
    data = request.get_json()
    question_id = data.get('question_id')
    answer = data.get('answer', '').strip().lower()
    
    if not question_id or not answer:
        return jsonify({'error': 'Missing question_id or answer'}), 400
    
    # Check if question exists
    if question_id not in active_questions:
        return jsonify({'error': 'Invalid or expired question'}), 400
    
    stored_answer = active_questions[question_id]['answer']
    
    # Verify answer
    if answer == stored_answer:
        # Move to verified questions (can be used once)
        verified_questions[question_id] = {
            'answer': stored_answer,
            'verified_at': time.time()
        }
        # Remove from active questions
        del active_questions[question_id]
        return jsonify({'success': True}), 200
    else:
        return jsonify({'success': False, 'error': 'Incorrect answer'}), 400

@captcha_bp.route('/config', methods=['GET'])
def get_captcha_config():
    """Get CAPTCHA configuration for frontend"""
    return jsonify({
        'enabled': True,
        'type': 'simple'
    }), 200
