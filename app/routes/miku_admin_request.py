"""
Miku admin-request routes

Користувач може на окремій сторінці написати запит до адміністрації,
а MikuGPT:
- формує короткий висновок і рекомендацію (mute/ban/review/none)
- створює Report для адмін-панелі

Фактичні покарання (бан/мут) автоматично НЕ застосовуються — це рішення людини-адміна.
"""
from flask import Blueprint, request, jsonify
from app import db, limiter
from app.middleware.auth import token_required
from app.middleware.captcha import verify_captcha
from app.models.user import User
from app.models.post import Post
from app.models.report import Report
import json
import logging

logger = logging.getLogger(__name__)

# NOTE: g4f removed - implementation updated to use Gemini API
# See GEMINI_CLIENT_SETUP.md for current architecture

miku_admin_request_bp = Blueprint('miku_admin_request', __name__)


def _build_admin_request_prompt(subject: str, description: str, target_username: str | None, post_content: str | None) -> str:
    """
    Побудувати промпт для Міку, щоб вона сформувала відповідь по модерації.
    """
    return f"""
Ти — MikuGPT, помічник адміністрації спільноти Freedom13.
Користувач залишив запит до адмінів.

Тема: {subject.strip()[:200]}
Цільовий користувач: {target_username or 'не вказано'}
Повний опис звернення:
\"\"\"{description.strip()[:2000]}\"\"\"

Текст пов'язаного поста (якщо є):
\"\"\"{(post_content or '').strip()[:2000]}\"\"\"

Твоє завдання:
- коротко підсумувати суть скарги
- запропонувати рекомендовану дію:
  - "none" — ніяких санкцій
  - "review" — передати на ручну перевірку адміну
  - "mute" — рекомендувати тимчасовий мут
  - "ban" — рекомендувати бан у важких випадках
- оцінити серйозність (1-3)

Ти МАЄШ повернути ТІЛЬКИ JSON без пояснень у форматі:
{{
  "summary": "1-3 речення українською, що відбулося",
  "recommended_action": "none" | "review" | "mute" | "ban",
  "severity": 1 | 2 | 3,
  "notes": "будь-які додаткові коментарі для адміна (українською)"
}}
""".strip()


@miku_admin_request_bp.route('/miku/admin-request', methods=['POST'])
@token_required
@verify_captcha
@limiter.limit("5 per minute")  # анти-спам звернень
def create_admin_request():
    """
    Створити запит до адміністрації, який попередньо аналізує MikuGPT.

    Повертає:
    - summary / recommended_action / severity / notes від Miku
    - створений Report (id, status, reason)
    """
    data = request.get_json() or {}
    subject = data.get('subject', '').strip()
    description = data.get('description', '').strip()
    target_username = data.get('target_username')
    related_post_id = data.get('post_id')

    if not subject or not description:
        return jsonify({'error': 'subject and description are required'}), 400

    target_user: User | None = None
    if target_username:
        target_user = User.query.filter_by(username=target_username).first()

    related_post: Post | None = None
    if related_post_id:
        related_post = Post.query.get(related_post_id)

    # Побудувати промпт і запитати Міку
    prompt = _build_admin_request_prompt(
        subject=subject,
        description=description,
        target_username=target_username,
        post_content=related_post.content if related_post else None,
    )

    messages = [
        {"role": "system", "content": "Ти помічник адміністрації. Відповідай СТРОГО у форматі JSON."},
        {"role": "user", "content": prompt},
    ]

    summary = ""
    recommended_action = "review"
    severity = 1
    notes = ""

    # Note: g4f has been removed. Using Gemini integration instead.
    # For admin requests, we now provide a simplified analysis.
    try:
        from app.services.miku_service import MikuService
        miku = MikuService()
        
        # Try to get Miku's analysis via Gemini
        analysis = miku.generate_response(
            user_id=str(request.current_user.id),
            message=prompt,
            personality="Дередере",
            flirt_enabled=False,
            nsfw_enabled=False,
            rp_enabled=False
        )
        
        summary = analysis.get('response', 'MikuGPT не змогла сформувати відповідь')
        # Simple heuristic for recommended action based on prompt content
        if 'ban' in prompt.lower():
            recommended_action = "ban"
        elif 'mute' in prompt.lower():
            recommended_action = "mute"
        elif 'bad' in prompt.lower() or 'inappropriate' in prompt.lower():
            recommended_action = "review"
        else:
            recommended_action = "none"
            
        severity = 2 if recommended_action != "none" else 1
        
    except Exception as e:
        # Fallback if Gemini isn't available
        logger.warning(f"Admin request analysis failed: {type(e).__name__}: {e}")
        summary = "MikuGPT не змогла сформувати відповідь, передано на ручну перевірку."
        recommended_action = "review"
        severity = 1

    # Створюємо Report для адмінів
    reason_lines = [
        f"[SUBJECT] {subject}",
        f"[USER MESSAGE] {description}",
        f"[MIKU SUMMARY] {summary}",
        f"[MIKU RECOMMENDED_ACTION] {recommended_action}",
        f"[MIKU SEVERITY] {severity}",
    ]
    if notes:
        reason_lines.append(f"[MIKU NOTES] {notes}")

    report = Report(
        reporter_id=request.current_user.id,
        post_id=related_post.id if related_post else None,
        comment_id=None,
        reason="\n".join(reason_lines),
        status="pending",
    )

    db.session.add(report)
    db.session.commit()

    return jsonify({
        "miku_decision": {
            "summary": summary,
            "recommended_action": recommended_action,
            "severity": severity,
            "notes": notes,
        },
        "report": report.to_dict(),
    }), 201

