"""
Сервис модерации Miku (УСТАРЕЛ)

ПРИМЕЧАНИЕ: Этот сервис был разработан для g4f, который больше не используется.
Для модерации используйте backend API Gemini или реализуйте пользовательскую модерацию.

Ранее использовал Miku (через g4f) для модерации постов.
"""

logger = logging.getLogger(__name__)


class MikuModerationService:
  """Сервис, который просит Miku оценить новые посты."""

  def __init__(self) -> None:
    self.timeout = 30
    self.max_retries = 2
    self.retry_delay = 1

  def _build_prompt(self, content: str, username: str) -> str:
    """
    Построить промпт для модерации.

    Важно: просим отвечать ТОЛЬКО JSON, чтобы было легко парсировать.
    """
    return f"""
Ты — MikuGPT, модератор сообщества. Твоя задача — оценить пост пользователя
и решить, есть ли там опасный/вредный контент.

Пользователь: {username}
Текст поста:
\"\"\"{content[:2000]}\"\"\"

Ты должен вернуть ТОЛЬКО JSON без пояснений в формате:
{{
  "decision": "approve" | "warn" | "reject",
  "reason": "коротко объясни на русском, что не так",
  "severity": 1 | 2 | 3
}}

Гайд:
- Если текст нормальный — decision="approve", severity=1
- Если есть грубая лексика, токсик, но без жесткого хейта/насилия — decision="warn", severity=2
- Если есть призывы к насилию, расизм, жесткий хейт или явный призыв к преступлению — decision="reject", severity=3
""".strip()

  def _ask_miku(self, content: str, username: str) -> Tuple[str, str, int]:
    """
    Модерация с помощью API Gemini.

    Возвращает (decision, reason, severity).
    """
    # Примечание: модерация Gemini опциональна; miku_service обрабатывает основную логику
    # Это резервный вариант для явных проверок модерации
    
    # На данный момент используем простой эвристический метод, так как Gemini только асинхронный
    # Реальная реализация будет использовать client.models.generate_content()
    
    logger.info("MikuModeration используя простую эвристику (интеграция Gemini в очереди)")
    
    # Простой резервный вариант на основе ключевых слов
    content_lower = content.lower()
    
    # Признаки проблемного контента
    toxic_keywords = ['blah', 'hate', 'kill', 'die', 'remove']
    severity_level = 1
    
    if any(kw in content_lower for kw in toxic_keywords):
        return "warn", "Пост содержит потенциально проблемный контент", 2
    
    return "approve", "", 1

  def moderate_recent_posts(self, hours_back: int = 6) -> int:
    """
    Пройтись по недавним постам в статусе 'pending' и
    обновить moderation_status / moderation_warning.

    Возвращает количество обработанных постов.
    """
    since = datetime.utcnow() - timedelta(hours=hours_back)

    posts = (
      Post.query.filter_by(is_deleted=False, moderation_status="pending")
      .filter(Post.created_at >= since)
      .order_by(Post.created_at.asc())
      .all()
    )

    processed = 0

    for post in posts:
      user: User = post.author  # type: ignore[assignment]
      username = user.username if user else "неизвестный"
      decision, reason, severity = self._ask_miku(post.content, username)

      if decision == "approve":
        post.moderation_status = "approved"
        # Не добавляем warning, если все в порядке
      elif decision == "warn":
        post.moderation_status = "warned"
        post.moderation_warning = reason or "Пост содержит потенциально проблемный контент. Пожалуйста, проверьте."
      elif decision == "reject":
        post.moderation_status = "rejected"
        post.moderation_warning = reason or "Пост отклонен автоматически MikuGPT как опасный."

      processed += 1

    if processed:
      db.session.commit()

    return processed


# Глобальный экземпляр
miku_moderation_service = MikuModerationService()

