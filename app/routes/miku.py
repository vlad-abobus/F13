"""
MikuGPT routes
"""
from flask import Blueprint, request, jsonify
from app.middleware.auth import token_required
from app.services.miku_service import MikuService
from app import db
from pathlib import Path
import os

miku_bp = Blueprint('miku', __name__)
miku_service = MikuService()

@miku_bp.route('/profile', methods=['GET'])
def get_profile():
    """Get MikuGPT profile"""
    return jsonify({
        'name': 'MikuGPT',
        'description': 'Віртуальна дівчина Хацуне Міку ♪',
        'personalities': ['Дередере', 'Цундере', 'Дандере', 'Яндере', 'Агресивний'],
        'emotion_sets': ['A', 'B']
    }), 200

@miku_bp.route('/chat', methods=['POST'])
@token_required
def chat():
    """Chat with MikuGPT"""
    data = request.get_json()
    
    message = data.get('message', '').strip()
    personality = data.get('personality', 'Дередере')
    emotion_set = data.get('emotion_set', 'A')
    flirt_enabled = data.get('flirt_enabled', False)
    nsfw_enabled = data.get('nsfw_enabled', False)
    rp_enabled = data.get('rp_enabled', False)
    
    if not message:
        return jsonify({'error': 'Message is required'}), 400
    
    # Update activity status
    request.current_user.activity_status = 'MIK'
    request.current_user.activity_data = personality
    from app import db
    db.session.commit()
    
    try:
        response = miku_service.generate_response(
            user_id=request.current_user.id,
            message=message,
            personality=personality,
            emotion_set=emotion_set,
            flirt_enabled=flirt_enabled,
            nsfw_enabled=nsfw_enabled,
            rp_enabled=rp_enabled
        )
        
        # Interactions are NOT saved to database
        
        return jsonify(response), 200
    except Exception as e:
        return jsonify({
            'error': 'Failed to generate response',
            'message': str(e),
            'response': 'Вибач, зараз не можу відповісти ♪',
            'emotion': 'happy_idle' if emotion_set == 'A' else 'smileR_M'
        }), 500

@miku_bp.route('/emotions', methods=['GET'])
def get_emotions():
    """Get available emotions"""
    emotion_set = request.args.get('set', 'A')
    
    emotions_a = {
        "angry_look": "Злой взгляд",
        "embarrassed": "Смущение",
        "middle_finger_anger": "Средний палец",
        "shocked2": "Шок 2",
        "apologetic": "Извинение",
        "happy_idle": "Счастье (спокойное)",
        "neutral2": "Нейтральное 2",
        "shocked": "Шок",
        "cheerful": "Радость",
        "happy": "Счастье",
        "neutral3": "Нейтральное 3",
        "surprised": "Удивление",
        "crying": "Плач",
        "irritated": "Раздражение",
        "sad_look": "Грусть"
    }
    
    emotions_b = {
        "angryM": "Злость",
        "coolM": "Спокойствие",
        "helloM": "Приветствие",
        "interestedM": "Интерес",
        "open_mouthM": "Открытый рот",
        "sayingM": "Разговор",
        "shyM": "Смущение",
        "sly_smileM": "Хитрая улыбка",
        "smileR_M": "Улыбка"
    }
    
    emotions = emotions_a if emotion_set == 'A' else emotions_b
    
    return jsonify(emotions), 200

@miku_bp.route('/emotion-image/<set>/<key>', methods=['GET'])
def get_emotion_image(set, key):
    """Get emotion image"""
    from flask import send_from_directory, jsonify
    
    # Validate set
    if set not in ['A', 'B']:
        return jsonify({'error': 'Invalid emotion set'}), 400
    
    # Get base directory
    base_dir = Path(__file__).parent.parent.parent
    emotions_dir = base_dir / 'MikuGPT_ver_1.0' / 'emotions'
    set_dir = emotions_dir / set
    
    # Determine extension
    ext = '.png' if set == 'A' else '.jpg'
    filename = f"{key}{ext}"
    
    # Handle special case for "embarrassed" with space in filename
    if key == 'embarrassed' and set == 'A':
        # Try with space (actual filename has space)
        filename_with_space = f"embarrassed {ext}"
        if (set_dir / filename_with_space).exists():
            return send_from_directory(str(set_dir), filename_with_space)
        # Also try without space
        if (set_dir / filename).exists():
            return send_from_directory(str(set_dir), filename)
    
    # Check if file exists
    file_path = set_dir / filename
    if file_path.exists() and file_path.is_file():
        return send_from_directory(str(set_dir), filename)
    
    # Fallback: try to find any file with similar name
    if set_dir.exists():
        for file in set_dir.iterdir():
            if file.is_file() and key.lower() in file.stem.lower():
                return send_from_directory(str(set_dir), file.name)
    
    return jsonify({'error': 'Image not found', 'set': set, 'key': key, 'filename': filename}), 404

@miku_bp.route('/personalities', methods=['GET'])
def get_personalities():
    """Get available personalities"""
    return jsonify([
        'Дередере',
        'Цундере',
        'Дандере',
        'Яндере',
        'Агресивний'
    ]), 200

@miku_bp.route('/scenarios', methods=['GET'])
def get_scenarios():
    """Get RP scenarios"""
    return jsonify({
        "Романтична сцена": "(обіймає) Мені так приємно бути поруч з тобою...\n(шепот) Ти — єдиний, хто мені потрібен.",
        "Конфлікт": "(гнів) Як ти міг так зробити?\n(плач) Я не знаю, що робити...",
        "Повсякденне спілкування": "(посмішка) Привіт! Як твій день?\n(жарт) Маю для тебе сюрприз."
    }), 200

@miku_bp.route('/interactions', methods=['GET'])
@token_required
def get_interactions():
    """Get user's MikuGPT interactions - interactions are not saved anymore"""
    # Interactions are no longer saved to database
    return jsonify([]), 200
