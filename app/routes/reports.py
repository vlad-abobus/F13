"""
Reports endpoints
"""
from flask import Blueprint, request, jsonify, current_app
from app.middleware.auth import token_required
from app.models.report import Report
from app import db

# Import verified_questions from captcha module to validate one-time CAPTCHA
from app.routes.captcha import verified_questions

reports_bp = Blueprint('reports', __name__)


@reports_bp.route('/', methods=['POST'])
@token_required
def create_report():
    data = request.get_json() or {}
    reason = (data.get('reason') or '').strip()
    post_id = data.get('post_id')
    comment_id = data.get('comment_id')
    question_id = data.get('captcha_question_id')
    solution = (data.get('captcha_solution') or '').strip().lower()

    if not reason:
        return jsonify({'error': 'Missing reason'}), 400

    if not question_id or not solution:
        return jsonify({'error': 'Captcha required'}), 400

    # Verify one-time captcha
    v = verified_questions.get(question_id)
    if not v or v.get('answer') != solution:
        return jsonify({'error': 'Invalid or expired captcha'}), 400

    report = Report(
        reporter_id=request.current_user.id,
        post_id=post_id,
        comment_id=comment_id,
        reason=reason,
    )

    db.session.add(report)
    db.session.commit()

    # consume the verified captcha so it can't be reused
    try:
        del verified_questions[question_id]
    except Exception:
        pass

    # Log for admins
    try:
        current_app.logger.info(f"New report {report.id} by {request.current_user.id}: post={post_id} comment={comment_id} reason={reason[:200]}")
    except Exception:
        pass

    # Optional email notification if SMTP configured and admin emails provided
    try:
        admins = current_app.config.get('ADMIN_NOTIFICATION_EMAILS')
        smtp_host = current_app.config.get('MAIL_SMTP_HOST')
        smtp_port = int(current_app.config.get('MAIL_SMTP_PORT', 0) or 0)
        smtp_user = current_app.config.get('MAIL_USERNAME')
        smtp_pass = current_app.config.get('MAIL_PASSWORD')

        if admins and smtp_host and smtp_port:
            import smtplib
            from email.message import EmailMessage

            recipients = [a.strip() for a in admins.split(',') if a.strip()]
            msg = EmailMessage()
            msg['Subject'] = f'New report: {report.id}'
            msg['From'] = smtp_user or f'no-reply@{current_app.config.get("HOST", "localhost")}'
            msg['To'] = ','.join(recipients)
            body = f"Reporter: {request.current_user.username if getattr(request.current_user, 'username', None) else request.current_user.id}\nPost: {post_id}\nComment: {comment_id}\nReason:\n{reason}\n\nReport ID: {report.id}"
            msg.set_content(body)

            try:
                with smtplib.SMTP(smtp_host, smtp_port, timeout=5) as s:
                    s.starttls()
                    if smtp_user and smtp_pass:
                        s.login(smtp_user, smtp_pass)
                    s.send_message(msg)
            except Exception as e:
                current_app.logger.warning(f"Failed to send report notification email: {e}")
    except Exception:
        pass

    return jsonify(report.to_dict()), 201
