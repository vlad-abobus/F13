"""
Database initialization
"""
from app import db
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
        Quote, Gallery, MikuInteraction, Translation, HtmlPage, IPBan, MikuSettings, ProfilePost, Image
    )
    
    db.create_all()
    
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
    ]
    
    for game_data in default_games:
        existing = FlashGame.query.filter_by(title=game_data['title']).first()
        if not existing:
            game = FlashGame(
                id=str(uuid.uuid4()),
                title=game_data['title'],
                swf_url=game_data['swf_url'],
                description=game_data['description']
            )
            db.session.add(game)
        else:
            # Update swf_url if it has changed
            if existing.swf_url != game_data['swf_url']:
                existing.swf_url = game_data['swf_url']
    
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