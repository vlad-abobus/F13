"""
Маршруты постов
"""
from flask import Blueprint, request, jsonify, current_app
from app import db
from app.models.post import Post
from app.middleware.auth import token_required
from app.middleware.captcha import verify_captcha
from app.middleware.ip_ban import check_ip_ban
from app.middleware.spam_detector import check_spam
from app.middleware.security_manager import SuspiciousActivityTracker
from app.middleware.sql_injection_protection import protect_from_sql_injection
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app import limiter
from datetime import datetime
import uuid

posts_bp = Blueprint('posts', __name__)

@posts_bp.route('/', methods=['GET'])
@protect_from_sql_injection
def get_posts():
    """Получить список постов"""
    filter_type = request.args.get('filter', 'new')  # новое, популярное, следящее
    emotion = request.args.get('emotion')
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    
    query = Post.query.filter_by(is_deleted=False, moderation_status='approved')

    # Фильтровать по эмоции (хранится в theme) если предоставлено
    if emotion in ('HP', 'AG', 'NT'):
        query = query.filter_by(theme=emotion)
    
    if filter_type == 'popular':
        query = query.order_by(Post.likes_count.desc(), Post.created_at.desc())
    elif filter_type == 'following':
        from app.models.follow import Follow
        from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
        
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
            if user_id:
                following_ids = [f.following_id for f in Follow.query.filter_by(follower_id=user_id).all()]
                following_ids.append(user_id)  # Включить собственные посты
                if following_ids:
                    query = query.filter(Post.user_id.in_(following_ids))
                else:
                    # Нет следящих пользователей, возвращаем пусто
                    return jsonify({
                        'posts': [],
                        'pagination': {
                            'page': page,
                            'per_page': per_page,
                            'total': 0,
                            'pages': 0,
                            'has_next': False,
                            'has_prev': False,
                        }
                    }), 200
        except:
            pass
        query = query.order_by(Post.created_at.desc())
    else:  # новое
        query = query.order_by(Post.created_at.desc())
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'posts': [post.to_dict() for post in pagination.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev,
        }
    }), 200

@posts_bp.route('/<post_id>', methods=['GET'])
def get_post(post_id):
    """Получить единое сообщение"""
    post = Post.query.get_or_404(post_id)
    
    if post.is_deleted:
        return jsonify({'error': 'Пост не найден'}), 404
    
    post.views_count += 1
    db.session.commit()
    
    return jsonify(post.to_dict()), 200

@posts_bp.route('/', methods=['POST'])
@limiter.limit("5 per minute")  # Ограничение: 5 постов в минуту
@check_ip_ban
@token_required
@check_spam(content_field='content')
@verify_captcha
def create_post():
    """Создать новый пост"""
    from datetime import timedelta
    
    # Проверить, если пользователь отключен звук
    if request.current_user.is_muted:
        if request.current_user.muted_until and datetime.utcnow() < request.current_user.muted_until:
            return jsonify({
                'error': 'Вы отключены',
                'muted_until': request.current_user.muted_until.isoformat()
            }), 403
        else:
            # Отключение истекло, очистить его
            request.current_user.is_muted = False
            request.current_user.muted_until = None
            db.session.commit()
    
    # Проверить, если пользователь ограничен в размещении
    if not request.current_user.can_post:
        return jsonify({
            'error': 'Вам запрещено размещать сообщения'
        }), 403
    
    # Проверить, если пользователь имеет временный бан и он истек
    if request.current_user.is_banned and request.current_user.ban_until:
        if datetime.utcnow() >= request.current_user.ban_until:
            # Бан истек, разбанить пользователя
            request.current_user.is_banned = False
            request.current_user.ban_until = None
            db.session.commit()
        else:
            return jsonify({
                'error': 'Вы временно заблокированы',
                'ban_until': request.current_user.ban_until.isoformat()
            }), 403
    
    # Проверить перезагрузку поста для предотвращения спама
    if request.current_user.last_post_time:
        time_since_last_post = datetime.utcnow() - request.current_user.last_post_time
        cooldown_seconds = current_app.config.get('POST_COOLDOWN', 30)
        
        if time_since_last_post.total_seconds() < cooldown_seconds:
            seconds_remaining = cooldown_seconds - int(time_since_last_post.total_seconds())
            return jsonify({
                'error': f'Пожалуйста, подождите {seconds_remaining} секунд перед следующим постом',
                'cooldown': cooldown_seconds,
                'seconds_remaining': seconds_remaining
            }), 429  # Слишком много запросов
    
    data = request.get_json()
    
    content = data.get('content', '').strip()
    if not content:
        return jsonify({'error': 'Содержание требуется'}), 400
    
    # Проверка спама
    from app.services.spam_detector import SpamDetector
    
    # Проверить дублирующееся содержимое
    if SpamDetector.check_duplicate_content(
        request.current_user.id, 
        content,
        minutes=current_app.config.get('DUPLICATE_CHECK_MINUTES', 5)
    ):
        return jsonify({
            'error': 'Вы недавно опубликовали такой же контент. Пожалуйста, попробуйте что-то другое.',
            'type': 'duplicate_content'
        }), 400
    
    # Проверить чрезмерное количество URL
    max_urls = current_app.config.get('SPAM_MAX_URLS_PER_POST', 2)
    if SpamDetector.check_excessive_urls(content, max_urls):
        url_counts = SpamDetector.count_urls(content)
        return jsonify({
            'error': f'Слишком много URL в посте (макс {max_urls}, найдено {url_counts["total_urls"]})',
            'type': 'excessive_urls',
            'max_urls': max_urls,
            'found_urls': url_counts['total_urls']
        }), 400
    
    # Вычислить оценку спама
    spam_analysis = SpamDetector.get_spam_score(content, request.current_user.id)
    
    # Определить статус модерации на основе оценки спама
    moderation_status = 'approved'
    if spam_analysis['score'] >= current_app.config.get('SPAM_FLAG_THRESHOLD', 7):
        moderation_status = 'pending'  # Отметить для ручного просмотра
    
    # Обновить статус активности
    request.current_user.activity_status = 'PST'
    request.current_user.activity_data = None
    request.current_user.last_post_time = datetime.utcnow()

    post = Post(
        id=str(uuid.uuid4()),
        user_id=request.current_user.id,
        content=content,
        theme=data.get('theme'),
        tags_list=data.get('tags', []),
        image_url=data.get('image_url'),
        is_nsfw=data.get('is_nsfw', False),
        is_anonymous=data.get('is_anonymous', False),
        moderation_status=moderation_status,
    )
    
    db.session.add(post)
    
    # Обновить элемент галереи если предоставлен image_url
    if post.image_url:
        from app.models.gallery import Gallery
        gallery_item = Gallery.query.filter_by(image_url=post.image_url).first()
        if gallery_item:
            gallery_item.post_id = post.id
    
    db.session.commit()
    
    # Сбросить статус активности после 30 секунд и запустить автокомментарий Miku
    from threading import Timer
    from app.models.user import User
    from app.services.miku_comment_service import miku_comment_service
    
    # Захватить экземпляр приложения и user_id пока еще в контексте запроса
    app_instance = current_app._get_current_object()
    user_id = request.current_user.id
    post_id = post.id
    
    def reset_activity_and_trigger_miku():
        # Использовать контекст приложения вместо контекста запроса
        with app_instance.app_context():
            user = User.query.get(user_id)
            if user:
                user.activity_status = ''
                user.activity_data = None
                db.session.commit()
            
            # Запустить Miku для комментирования нового поста
            try:
                miku_comment_service.comment_on_single_post(post_id)
            except Exception as e:
                current_app.logger.error(f"Сбой при активации автокомментария Miku: {e}")

    Timer(2.0, reset_activity_and_trigger_miku).start()
    
    # Логировать создание поста
    SuspiciousActivityTracker.log_security_event(
        request.current_user.id,
        'post_created',
        description=f'Post created with moderation status: {moderation_status}'
    )
    
    return jsonify(post.to_dict()), 201

@posts_bp.route('/<post_id>/like', methods=['POST'])
@token_required
@limiter.limit("30 per minute")  # Предотвратить спам лайков на IP/пользователя
def like_post(post_id):
    """Лайк/дизлайк поста (toggle)"""
    from app.models.post_like import PostLike
    
    post = Post.query.get_or_404(post_id)
    user_id = request.current_user.id
    
    # Проверить, уже ли пользователь лайкнул этот пост
    existing_like = PostLike.query.filter_by(post_id=post_id, user_id=user_id).first()
    
    if existing_like:
        # Удалить лайк (дизлайк)
        db.session.delete(existing_like)
        post.likes_count = max(0, post.likes_count - 1)
    else:
        # Добавить лайк
        like = PostLike(post_id=post_id, user_id=user_id)
        db.session.add(like)
        post.likes_count += 1
    
    db.session.commit()
    
    return jsonify(post.to_dict()), 200

# Старая конечная точка для локальной загрузки изображений удалена.
# Используйте /api/upload для загрузки через Cloudinary.
# Endpoint возвращает secure_url и public_id, которые можно использовать в постах.

@posts_bp.route('/<post_id>/repost', methods=['POST'])
@token_required
@limiter.limit("20 per minute")  # Ограничить злоупотребление репостом
def repost(post_id):
    """Переопубликовать пост"""
    # Проверить перезагрузку поста для предотвращения спама
    if request.current_user.last_post_time:
        time_since_last_post = datetime.utcnow() - request.current_user.last_post_time
        cooldown_seconds = current_app.config.get('POST_COOLDOWN', 30)
        
        if time_since_last_post.total_seconds() < cooldown_seconds:
            seconds_remaining = cooldown_seconds - int(time_since_last_post.total_seconds())
            return jsonify({
                'error': f'Пожалуйста, подождите {seconds_remaining} секунд перед репостом',
                'cooldown': cooldown_seconds,
                'seconds_remaining': seconds_remaining
            }), 429  # Слишком много запросов
    
    original_post = Post.query.get_or_404(post_id)
    
    # Создать репост
    repost = Post(
        id=str(uuid.uuid4()),
        user_id=request.current_user.id,
        content=f"RT: {original_post.content}",
        image_url=original_post.image_url,
        is_nsfw=original_post.is_nsfw,
    )
    
    request.current_user.last_post_time = datetime.utcnow()
    original_post.reposts_count += 1
    db.session.add(repost)
    db.session.commit()
    
    return jsonify(repost.to_dict()), 201

@posts_bp.route('/<post_id>/report', methods=['POST'])
@token_required
@limiter.limit("20 per minute")  # Ограничить спам жалобы
@verify_captcha
def report_post(post_id):
    """Пожаловаться на пост"""
    from app.models.report import Report
    
    post = Post.query.get_or_404(post_id)
    data = request.get_json()
    reason = data.get('reason', '').strip()
    
    if not reason:
        return jsonify({'error': 'Причина требуется'}), 400
    
    report = Report(
        id=str(uuid.uuid4()),
        reporter_id=request.current_user.id,
        post_id=post_id,
        reason=reason
    )
    
    db.session.add(report)
    db.session.commit()
    
    return jsonify({'message': 'Пост отправлен в жалобу'}), 201

@posts_bp.route('/<post_id>', methods=['DELETE'])
@token_required
def delete_post(post_id):
    """Удалить пост"""
    post = Post.query.get_or_404(post_id)
    
    if post.user_id != request.current_user.id and request.current_user.status != 'admin':
        return jsonify({'error': 'Не авторизован'}), 403
    
    post.is_deleted = True
    db.session.commit()
    
    return jsonify({'message': 'Пост удален'}), 200
