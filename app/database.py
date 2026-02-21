"""
Database initialization
"""
from app import db
from sqlalchemy import text
from app.models.user import User
from app.models.badge import Badge
from app.models.goonzone import GoonZoneRule
from app.models.flash_game import FlashGame
from app.models.quote import Quote
from app.utils.password import hash_password
import uuid

def init_db():
    """Initialize database with default data"""
    # Import all models to register them
    from app.models import (
        User, Post, Comment, Badge, UserBadge, FlashGame,
        GoonZonePoll, GoonZoneNews, GoonZoneDoc, GoonZoneRule,
        Follow, Collection, CollectionItem, Report, AdminLog,
        Quote, Gallery, MikuInteraction, Translation, HtmlPage, IPBan, MikuSettings, ProfilePost, Image,
        UserBookmark, UserPreference, ModerationLog, IPSpamLog, PostLike, CommentLike
    )
    
    # Import security models
    from app.models.security_models import (
        UserSession, TwoFactorCode, TrustedDevice, SecurityLog, RateLimitCounter
    )
    
    db.create_all()

    # Ensure new column `iframe_url` exists. Use inspector to detect columns,
    # try ALTER TABLE via a proper connection/transaction, and re-check.
    from sqlalchemy import inspect
    inspector = inspect(db.engine)
    has_iframe_col = False
    try:
        if inspector.has_table('flash_games'):
            cols = [c['name'] for c in inspector.get_columns('flash_games')]
            has_iframe_col = 'iframe_url' in cols
    except Exception:
        has_iframe_col = False

    if not has_iframe_col:
        try:
            # Use a Connection/Transaction to execute DDL safely
            conn = db.engine.connect()
            trans = conn.begin()
            try:
                conn.execute(text("ALTER TABLE flash_games ADD COLUMN IF NOT EXISTS iframe_url VARCHAR(500);"))
                trans.commit()
            except Exception as e:
                trans.rollback()
                print(f"[WARN] Could not add iframe_url column automatically: {e}")
            finally:
                conn.close()

            # Re-inspect to see if column is present now
            try:
                cols = [c['name'] for c in inspector.get_columns('flash_games')]
                has_iframe_col = 'iframe_url' in cols
            except Exception:
                has_iframe_col = False
        except Exception as e:
            print(f"[WARN] Could not attempt ALTER TABLE for iframe_url: {e}")
            has_iframe_col = False
    
    # Create default badges
    default_badges = [
        {'name': 'Перший пост', 'description': 'Створив перший пост', 'icon': '📝', 'rarity': 'common'},
        {'name': 'Популярний', 'description': 'Отримав 100 лайків', 'icon': '⭐', 'rarity': 'rare'},
        {'name': 'Легенда', 'description': 'Отримав 1000 лайків', 'icon': '👑', 'rarity': 'epic'},
        {'name': 'Модератор', 'description': 'Активний модератор', 'icon': '🛡️', 'rarity': 'epic'},
    ]
    
    for badge_data in default_badges:
        existing = Badge.query.filter_by(name=badge_data['name']).first()
        if not existing:
            badge = Badge(
                id=str(uuid.uuid4()),
                name=badge_data['name'],
                description=badge_data['description'],
                icon=badge_data['icon'],
                rarity=badge_data['rarity']
            )
            db.session.add(badge)
    
    # Create default GoonZone rules
    default_rules = [
        {'title': 'Правило 1: Повага', 'content': 'Поважайте інших користувачів', 'order': 1},
        {'title': 'Правило 2: Контент', 'content': 'Не публікуйте заборонений контент', 'order': 2},
        {'title': 'Правило 3: Спам', 'content': 'Не спамте та не флудіть', 'order': 3},
    ]
    
    for rule_data in default_rules:
        existing = GoonZoneRule.query.filter_by(title=rule_data['title']).first()
        if not existing:
            rule = GoonZoneRule(
                id=str(uuid.uuid4()),
                title=rule_data['title'],
                content=rule_data['content'],
                order=rule_data['order']
            )
            db.session.add(rule)
    
    # Create default Flash games (if not exist)
    default_games = [
        {'title': 'Super Drift 3D', 'swf_url': '/games/super_drift_3d.swf', 'description': 'Гонки на дрифті'},
        {'title': 'Earn to Die', 'swf_url': '/games/earn_to_die.swf', 'description': 'Виживання зомбі'},
        {'title': 'Hatsune Miku Wear', 'swf_url': '/games/hatsune_miku_wear.swf', 'description': 'Одягни Міку'},
        {'title': 'Bikini', 'swf_url': '/games/bikini.swf', 'description': 'Пляжна гра'},
        {'title': 'Виживанія у лесу', 'iframe_url': '//html5.gamedistribution.com/rvvASMiM/94e9f9018626405f851a17ecc898c7bc/index.html?gd_zone_config=eyJwYXJlbnRVUkwiOiJodHRwczovL3d3dy5nYW1lLWdhbWUuY29tLnVhLyIsInBhcmVudERvbWFpbiI6ImdhbWUtZ2FtZS5jb20udWEiLCJ0b3BEb21haW4iOiJnYW1lLWdhbWUuY29tLnVhIiwiaGFzSW1wcmVzc2lvbiI6ZmFsc2UsImxvYWRlckVuYWJsZWQiOnRydWUsImhvc3QiOiJodG1sNS5nYW1lZGlzdHJpYnV0aW9uLmNvbSIsInZlcnNpb24iOiIxLjUuMTgifQ%253D%253D', 'description': 'HTML5 гра: виживання у лісі'},
        {'title': 'Pixel Gun 3', 'iframe_url': '//html5.gamedistribution.com/rvvASMiM/d72b73ad623a4c58a641bbd145bb79a4/index.html?gd_zone_config=eyJwYXJlbnRVUkwiOiJodHRwczovL3d3dy5nYW1lLWdhbWUuY29tLnVhLyIsInBhcmVudERvbWFpbiI6ImdhbWUtZ2FtZS5jb20udWEiLCJ0b3BEb21haW4iOiJnYW1lLWdhbWUuY29tLnVhIiwiaGFzSW1wcmVzc2lvbiI6ZmFsc2UsImxvYWRlckVuYWJsZWQiOnRydWUsImhvc3QiOiJodG1sNS5nYW1lZGlzdHJpYnV0aW9uLmNvbSIsInZlcnNpb24iOiIxLjUuMTgifQ%253D%253D', 'description': '3D шутер з піксельною графікою'},
    ]
    
    # Check column metadata for swf_url nullability
    swf_nullable = True
    try:
        if inspector.has_table('flash_games'):
            cols_meta = {c['name']: c for c in inspector.get_columns('flash_games')}
            if 'swf_url' in cols_meta:
                swf_nullable = cols_meta['swf_url'].get('nullable', True)
    except Exception:
        swf_nullable = True

    for game_data in default_games:
        # Use a safe existence check that doesn't rely on ORM selecting unknown columns
        existing_row = None
        try:
            existing_row = db.session.execute(
                text("SELECT id FROM flash_games WHERE title = :title LIMIT 1"),
                {"title": game_data['title']}
            ).first()
        except Exception:
            existing_row = None

        if not existing_row:
            # Build kwargs conditionally depending on whether iframe column exists
            # Determine swf_url value based on DB nullability: if DB requires NOT NULL,
            # provide empty string when no swf_url is available for HTML5 games.
            swf_val = game_data.get('swf_url')
            if swf_val is None and not swf_nullable:
                swf_val = ''

            create_kwargs = {
                'id': str(uuid.uuid4()),
                'title': game_data['title'],
                'swf_url': swf_val,
                'description': game_data.get('description')
            }
            if has_iframe_col and game_data.get('iframe_url'):
                create_kwargs['iframe_url'] = game_data.get('iframe_url')

            # Create via ORM
            try:
                game = FlashGame(**create_kwargs)
                db.session.add(game)
            except Exception as e:
                # Fallback: try inserting without iframe_url
                print(f"[WARN] Failed to create game with iframe_url, retrying without it: {e}")
                if 'iframe_url' in create_kwargs:
                    del create_kwargs['iframe_url']
                game = FlashGame(**create_kwargs)
                db.session.add(game)
        else:
            # existing_row present — update existing game safely
            try:
                existing = FlashGame.query.get(existing_row[0])
                if game_data.get('swf_url') and existing.swf_url != game_data.get('swf_url'):
                    existing.swf_url = game_data.get('swf_url')
                if has_iframe_col and game_data.get('iframe_url'):
                    if existing.iframe_url != game_data.get('iframe_url'):
                        existing.iframe_url = game_data.get('iframe_url')
            except Exception:
                # If loading ORM object fails (missing column), skip updating iframe_url
                try:
                    if game_data.get('swf_url'):
                        db.session.execute(
                            text("UPDATE flash_games SET swf_url = :swf WHERE title = :title"),
                            {"swf": game_data.get('swf_url'), "title": game_data['title']}
                        )
                except Exception:
                    pass
    
    # Create default quotes
    default_quotes = [
        {'text': 'Життя - це не те, що з тобою відбувається, а те, як ти на це реагуєш.', 'type': 'motivational'},
        {'text': 'Краще бути одиноким, ніж з неправильними людьми.', 'type': 'ironic'},
        {'text': 'Успіх - це вміння переходити від однієї невдачі до іншої, не втрачаючи ентузіазму.', 'type': 'motivational'},
        {'text': 'Не всі, хто блукають, загубилися.', 'type': 'motivational'},
        {'text': 'Найкращий час посадити дерево був 20 років тому. Другий найкращий час - зараз.', 'type': 'motivational'},
        {'text': 'Якщо ти думаєш, що можеш - ти правий. Якщо думаєш, що не можеш - теж правий.', 'type': 'ironic'},
    ]
    
    for quote_data in default_quotes:
        existing = Quote.query.filter_by(text=quote_data['text']).first()
        if not existing:
            quote = Quote(
                id=str(uuid.uuid4()),
                text=quote_data['text'],
                type=quote_data['type']
            )
            db.session.add(quote)
    
    # Create MikuGPT user (if not exist)
    miku_user = User.query.filter_by(username='MikuGPT').first()
    if not miku_user:
        miku_user = User(
            id=str(uuid.uuid4()),
            username='MikuGPT',
            email='miku@freedom13.com',
            password_hash=hash_password('miku_password'),  # Change in production!
            status='verified',
            verification_type='purple',
            bio='Віртуальна дівчина Хацуне Міку ♪'
        )
        db.session.add(miku_user)
    
    db.session.commit()
    print("[OK] Database initialized successfully!")