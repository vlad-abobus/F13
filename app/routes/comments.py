"""
Маршруты комментариев
"""
from flask import Blueprint, request, jsonify
from app import db
from app.models.comment import Comment
from app.models.post import Post
from app.middleware.auth import token_required
from app.middleware.captcha import verify_captcha
from app.middleware.ip_ban import check_ip_ban
from app import limiter
from datetime import datetime
import uuid

comments_bp = Blueprint('comments', __name__)

@comments_bp.route('/post/<post_id>', methods=['GET'])
def get_comments(post_id):
    """Получить комментарии для поста"""
    post = Post.query.get_or_404(post_id)
    
    # Получить коммментарии верхнего уровня (без родителя)
    comments = Comment.query.filter_by(
        post_id=post_id,
        parent_id=None,
        is_deleted=False
    ).order_by(Comment.created_at.asc()).all()
    
    return jsonify([comment.to_dict() for comment in comments]), 200

@comments_bp.route('/', methods=['POST'])
@token_required
@limiter.limit("10 per minute")
@check_ip_ban
@verify_captcha
def create_comment():
    """Создать новый комментарий"""
    from flask import current_app
    
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
    
    # Проверить перезагрузку комментария для предотвращения спама
    if request.current_user.last_comment_time:
        time_since_last_comment = datetime.utcnow() - request.current_user.last_comment_time
        cooldown_seconds = current_app.config.get('COMMENT_COOLDOWN', 10)
        
        if time_since_last_comment.total_seconds() < cooldown_seconds:
            seconds_remaining = cooldown_seconds - int(time_since_last_comment.total_seconds())
            return jsonify({
                'error': f'Пожалуйста, подождите {seconds_remaining} секунд перед следующим комментарием',
                'cooldown': cooldown_seconds,
                'seconds_remaining': seconds_remaining
            }), 429  # Слишком много запросов
    
    data = request.get_json()
    
    post_id = data.get('post_id')
    content = data.get('content', '').strip()
    parent_id = data.get('parent_id')
    
    if not post_id or not content:
        return jsonify({'error': 'ID поста и содержание требуются'}), 400
    
    if len(content) > 5000:
        return jsonify({'error': 'Комментарий слишком длинный (макс 5000 символов)'}), 400
    
    # Проверка спама
    from app.services.spam_detector import SpamDetector
    from flask import current_app
    
    # Проверить дублирующееся содержимое комментария
    if SpamDetector.check_duplicate_content(
        request.current_user.id, 
        content,
        minutes=current_app.config.get('DUPLICATE_CHECK_MINUTES', 5)
    ):
        return jsonify({
            'error': 'Вы недавно опубликовали похожий комментарий. Пожалуйста, напишите что-то другое.',
            'type': 'duplicate_content'
        }), 400
    
    # Проверить чрезмерное количество URL в комментариях (строже чем посты)
    max_urls = current_app.config.get('SPAM_MAX_URLS_PER_COMMENT', 1)
    if SpamDetector.check_excessive_urls(content, max_urls):
        url_counts = SpamDetector.count_urls(content)
        return jsonify({
            'error': f'Комментарии могут содержать максимум {max_urls} URL',
            'type': 'excessive_urls',
            'max_urls': max_urls,
            'found_urls': url_counts['total_urls']
        }), 400
    
    post = Post.query.get_or_404(post_id)
    
    comment = Comment(
        id=str(uuid.uuid4()),
        post_id=post_id,
        user_id=request.current_user.id,
        parent_id=parent_id,
        content=content
    )
    
    request.current_user.last_comment_time = datetime.utcnow()
    post.comments_count += 1
    db.session.add(comment)
    db.session.commit()
    
    return jsonify(comment.to_dict()), 201

@comments_bp.route('/<comment_id>/like', methods=['POST'])
@token_required
@limiter.limit("30 per minute")  # Предотвратить спам лайков на комментариях
def like_comment(comment_id):
    """Лайк комментария"""
    comment = Comment.query.get_or_404(comment_id)
    
    # TODO: Реализовать модель CommentLike
    comment.likes_count += 1
    db.session.commit()
    
    return jsonify(comment.to_dict()), 200

@comments_bp.route('/<comment_id>', methods=['DELETE'])
@token_required
def delete_comment(comment_id):
    """Удалить комментарий"""
    comment = Comment.query.get_or_404(comment_id)
    
    if comment.user_id != request.current_user.id and request.current_user.status != 'admin':
        return jsonify({'error': 'Не авторизован'}), 403
    
    comment.is_deleted = True
    comment.post.comments_count -= 1
    db.session.commit()
    
    return jsonify({'message': 'Комментарий удален'}), 200
