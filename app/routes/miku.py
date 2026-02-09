"""
Маршруты MikuGPT
"""
import asyncio
import logging
from flask import Blueprint, request, jsonify
from app.middleware.auth import token_required
from app.services.miku_service import MikuService
from app import db
from pathlib import Path
import os

logger = logging.getLogger(__name__)

# Опциональный импорт для DuckAI поиска (требует пакет duckduckgo-search)
try:
    from app.services.duck_ai_client import DuckAIClient, DuckAIError
    DUCK_AI_AVAILABLE = True
except ImportError:
    logger.warning("DuckAIClient недоступен - установите: pip install duckduckgo-search aiohttp")
    DuckAIClient = None
    DuckAIError = None
    DUCK_AI_AVAILABLE = False

miku_bp = Blueprint('miku', __name__)
miku_service = MikuService()

@miku_bp.route('/profile', methods=['GET'])
def get_profile():
    """Получить профиль MikuGPT"""
    return jsonify({
        'name': 'MikuGPT',
        'description': 'Виртуальная девушка Хацуне Мику ♪',
        'personalities': ['Дередере', 'Цундере', 'Дандере', 'Яндере', 'Агрессивный'],
        'emotion_sets': ['DEFAULT', 'A', 'B'],
        'features': {
            'flirt_mode': 'Включает режим флирта',
            'nsfw_mode': 'Разрешает 18+ намеки',
            'sex_mode': 'Полностью сексуальный 18+ разговор без ограничений',
            'rp_mode': 'Ролевая игра - реагирует на действия в скобках *действие*'
        }
    }), 200

@miku_bp.route('/chat', methods=['POST'])
@token_required
def chat():
    """Чат с MikuGPT - всегда возвращает 200 для предотвращения ошибок 502"""
    data = request.get_json()
    
    message = data.get('message', '').strip()
    personality = data.get('personality', 'Дередере')
    emotion_set = data.get('emotion_set', 'DEFAULT')
    flirt_enabled = data.get('flirt_enabled', False)
    nsfw_enabled = data.get('nsfw_enabled', False)
    sex_mode = data.get('sex_mode', False)
    rp_enabled = data.get('rp_enabled', False)
    
    if not message:
        return jsonify({'error': 'Требуется сообщение'}), 400
    
    # Обновить статус активности
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
            sex_mode=sex_mode,
            rp_enabled=rp_enabled
        )
        
        # Взаимодействия НЕ сохраняются в базу данных
        
        # ВСЕГДА возвращать 200 для предотвращения ошибок cloudflare 502
        return jsonify(response), 200
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Ошибка MikuGPT чата: {type(e).__name__}: {e}", exc_info=True)
        
        # Возвращать резервный ответ вместо 5xx ошибку
        # Это предотвращает ошибки cloudflare 502
        from app.services.miku_service import EMOTIONS_MIKU_C
        return jsonify({
            'response': 'Жаль, сервер MikuGPT сейчас недоступен 😔... ♪',
            'emotion': EMOTIONS_MIKU_C[0],
            'emotion_set': emotion_set,
            'error': f'{type(e).__name__}: Ошибка сервиса',
            'fallback': True
        }), 200  # Всегда возвращать 200 с резервным ответом


@miku_bp.route('/search-chat', methods=['POST'])
@token_required
def search_chat():
    """
    Чат с поиском DuckDuckGo AI + личность MikuGPT.
    Возвращает сразу сообщение "думаю...", затем получает ответ DuckAI.
    Требуется: pip install duckduckgo-search aiohttp
    """
    if not DUCK_AI_AVAILABLE:
        logger.warning("Поиск DuckAI запрошен, но duckduckgo-search не установлен")
        return jsonify({
            'error': 'Поиск DuckAI недоступен',
            'message': 'Установите с: pip install duckduckgo-search aiohttp',
            'fallback': True
        }), 503
    
    data = request.get_json()
    
    message = data.get('message', '').strip()
    personality = data.get('personality', 'Дередере')
    emotion_set = data.get('emotion_set', 'DEFAULT')
    flirt_enabled = data.get('flirt_enabled', False)
    nsfw_enabled = data.get('nsfw_enabled', False)
    model = data.get('model', 'gpt-4o-mini')
    
    if not message:
        return jsonify({'error': 'Требуется сообщение'}), 400
    
    # Обновить статус активности
    request.current_user.activity_status = 'MIK_SEARCH'
    request.current_user.activity_data = f"{personality}:поиск"
    db.session.commit()
    
    try:
        # Инициализировать DuckAIClient
        duck_client = DuckAIClient(model=model, timeout=60, max_history=5)
        
        logger.info(f"Поиск DuckAI - Пользователь: {request.current_user.id}, Запрос: {message[:100]}")
        
        # Выполнить асинхронный вызов DuckAI
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            duck_response = loop.run_until_complete(duck_client.ask(message, use_history=True))
            loop.close()
        except Exception as e:
            logger.error(f"Ошибка поиска DuckAI: {type(e).__name__}: {e}")
            raise
        
        if not duck_response:
            raise DuckAIError("Пустой ответ от DuckDuckGo AI")
        
        # Опционально обернуть ответ с личностью Мику, если нужно
        # На данный момент возвращаем сырой ответ DuckAI
        default_emo = 'happy_idle' if emotion_set == 'A' else 'smileR_M'
        
        return jsonify({
            'response': duck_response,
            'emotion': default_emo,
            'emotion_set': emotion_set,
            'source': 'duckduckgo_ai',
            'fallback': False
        }), 200
        
    except DuckAIError as e:
        logger.warning(f"Ошибка DuckAI: {e}")
        default_emo = 'happy_idle' if emotion_set == 'A' else 'smileR_M'
        return jsonify({
            'response': f'Мику: Жаль, DuckAI сейчас недоступна 🔍... ♪\n\nДеталь: {str(e)[:100]}',
            'emotion': default_emo,
            'emotion_set': emotion_set,
            'error': str(e),
            'source': 'duckduckgo_ai',
            'fallback': True
        }), 200
        
    except Exception as e:
        logger.error(f"Ошибка чата поиска: {type(e).__name__}: {e}", exc_info=True)
        default_emo = 'happy_idle' if emotion_set == 'A' else 'smileR_M'
        return jsonify({
            'response': 'Мику: Что-то пошло не так 😔... ♪',
            'emotion': default_emo,
            'emotion_set': emotion_set,
            'error': f'{type(e).__name__}',
            'source': 'duckduckgo_ai',
            'fallback': True
        }), 200

@miku_bp.route('/emotions', methods=['GET'])
def get_emotions():
    """Получить доступные эмоции"""
    from app.services.miku_service import EMOTIONS_MIKU_C
    
    emotion_set = request.args.get('set', 'DEFAULT')
    
    # Только DEFAULT набор (40 эмоций из miku_c)
    emotions_default = {emotion.replace('_', ' ').title(): emotion for emotion in EMOTIONS_MIKU_C}
    
    emotions = emotions_default if emotion_set in ['DEFAULT', 'A', 'B', None] else emotions_default
    
    return jsonify(emotions), 200

@miku_bp.route('/emotion-image/<set>/<key>', methods=['GET'])
def get_emotion_image(set, key):
    """Получить изображение эмоции из miku_c папки"""
    from flask import send_from_directory, jsonify
    
    try:
        # Только DEFAULT набор теперь
        if set not in ['DEFAULT', 'A', 'B', None]:
            return jsonify({'error': 'Неверный набор эмоций'}), 400
        
        # Получить базовый каталог
        base_dir = Path(__file__).parent.parent.parent
        emotions_dir = base_dir / 'miku_c'
        
        # Логирование для отладки
        logger.debug(f'Trying to find emotion: set={set}, key={key}')
        logger.debug(f'Emotions dir: {emotions_dir}')
        logger.debug(f'Emotions dir exists: {emotions_dir.exists()}')
        
        # Преобразовать ключ в имя файла (заменить пробелы на подчеркивания)
        filename = key.replace(' ', '_').lower() + '.png'
        file_path = emotions_dir / filename
        
        logger.debug(f'Looking for file: {file_path}')
        logger.debug(f'File exists: {file_path.exists()}')
        
        # Проверить существует ли файл
        if file_path.exists() and file_path.is_file():
            logger.debug(f'Serving emotion image: {filename}')
            return send_from_directory(str(emotions_dir), filename)
        
        # Резервный: попробовать найти файл с похожим названием
        if emotions_dir.exists():
            for file in emotions_dir.iterdir():
                if file.is_file() and key.lower().replace(' ', '_') in file.stem.lower():
                    logger.debug(f'Found similar file: {file.name}')
                    return send_from_directory(str(emotions_dir), file.name)
        
        logger.warning(f'Emotion image not found: {filename}')
        return jsonify({'error': 'Изображение не найдено', 'set': set, 'key': key, 'filename': filename}), 404
    
    except Exception as e:
        logger.error(f'Error serving emotion image: {type(e).__name__}: {e}')
        return jsonify({'error': 'Ошибка при загрузке изображения', 'details': str(e)}), 500

@miku_bp.route('/personalities', methods=['GET'])
def get_personalities():
    """Получить доступные личности"""
    return jsonify([
        'Дередере',
        'Цундере',
        'Дандере',
        'Яндере',
        'Агрессивный'
    ]), 200

@miku_bp.route('/scenarios', methods=['GET'])
def get_scenarios():
    """Получить сценарии РП"""
    return jsonify({
        "Романтическая сцена": "(обнимает) Мне так приятно быть рядом с тобой...\n(шепот) Ты — единственное, что мне нужно.",
        "Конфликт": "(гнев) Как ты мог это сделать?\n(плач) Я не знаю, что делать...",
        "Повседневное общение": "(улыбка) Привет! Как твой день?\n(шутка) У меня для тебя есть сюрприз."
    }), 200

@miku_bp.route('/interactions', methods=['GET'])
@token_required
def get_interactions():
    """Получить взаимодействия пользователя с MikuGPT - взаимодействия больше не сохраняются"""
    # Взаимодействия больше не сохраняются в базу данных
    return jsonify([]), 200
