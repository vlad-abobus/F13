"""
Internationalization routes
"""
from flask import Blueprint, request, jsonify
from app.middleware.auth import token_required, admin_required
from app import db
from app.models.translation import Translation
import json

i18n_bp = Blueprint('i18n', __name__)

# Default translations for all languages
DEFAULT_TRANSLATIONS = {
    'ru': {
        'common': {
            'home': 'Главная',
            'login': 'Вход',
            'register': 'Регистрация',
            'logout': 'Выход',
            'profile': 'Профиль',
            'settings': 'Настройки',
            'search': 'Поиск',
            'save': 'Сохранить',
            'cancel': 'Отмена',
            'delete': 'Удалить',
            'edit': 'Редактировать',
            'create': 'Создать',
            'submit': 'Отправить',
            'loading': 'Загрузка...',
            'error': 'Ошибка',
            'success': 'Успешно',
            'back': 'Назад',
            'next': 'Далее',
            'previous': 'Назад',
            'close': 'Закрыть',
        },
        'pages': {
            'rules': 'Правила',
            'about': 'О нас',
            'privacy': 'Конфиденциальность',
            'terms': 'Условия',
            'contact': 'Контакты',
        },
        'auth': {
            'login_title': 'Вход',
            'register_title': 'Регистрация',
            'username': 'Имя пользователя',
            'email': 'Email',
            'password': 'Пароль',
            'confirm_password': 'Подтвердите пароль',
            'forgot_password': 'Забыли пароль?',
            'remember_me': 'Запомнить меня',
        },
        'posts': {
            'create_post': 'Создать пост',
            'edit_post': 'Редактировать пост',
            'delete_post': 'Удалить пост',
            'like': 'Нравится',
            'comment': 'Комментарий',
            'share': 'Поделиться',
            'no_posts': 'Нет постов',
            'comments': 'Комментарии',
            'add_comment': 'Добавить комментарий',
            'reply': 'Ответить',
            'delete_comment': 'Удалить комментарий',
            'no_comments': 'Пока нет комментариев',
            'login_to_comment': 'Войдите, чтобы комментировать',
        },
        'profile': {
            'profile': 'Профиль',
            'wall': 'Стена',
            'write_on_wall': 'Написать на стене',
            'whats_on_your_mind': 'Что у вас на уме?',
            'posts': 'Посты',
            'registration': 'Регистрация',
            'follow': 'Подписаться',
            'unfollow': 'Отписаться',
            'settings': 'Настройки',
            'no_wall_posts': 'Пока нет сообщений на стене',
            'delete_wall_post': 'Удалить сообщение',
        },
        'games': {
            'flash_games': 'Flash игры',
            'play': 'Играть',
            'description': 'Описание',
        },
    },
    'uk': {
        'common': {
            'home': 'Головна',
            'login': 'Вхід',
            'register': 'Реєстрація',
            'logout': 'Вихід',
            'profile': 'Профіль',
            'settings': 'Налаштування',
            'search': 'Пошук',
            'save': 'Зберегти',
            'cancel': 'Скасувати',
            'delete': 'Видалити',
            'edit': 'Редагувати',
            'create': 'Створити',
            'submit': 'Відправити',
            'loading': 'Завантаження...',
            'error': 'Помилка',
            'success': 'Успішно',
            'back': 'Назад',
            'next': 'Далі',
            'previous': 'Назад',
            'close': 'Закрити',
        },
        'pages': {
            'rules': 'Правила',
            'about': 'Про нас',
            'privacy': 'Конфіденційність',
            'terms': 'Умови',
            'contact': 'Контакти',
        },
        'auth': {
            'login_title': 'Вхід',
            'register_title': 'Реєстрація',
            'username': 'Ім\'я користувача',
            'email': 'Email',
            'password': 'Пароль',
            'confirm_password': 'Підтвердіть пароль',
            'forgot_password': 'Забули пароль?',
            'remember_me': 'Запам\'ятати мене',
        },
        'posts': {
            'create_post': 'Створити пост',
            'edit_post': 'Редагувати пост',
            'delete_post': 'Видалити пост',
            'like': 'Подобається',
            'comment': 'Коментар',
            'share': 'Поділитися',
            'no_posts': 'Немає постів',
            'comments': 'Коментарі',
            'add_comment': 'Додати коментар',
            'reply': 'Відповісти',
            'delete_comment': 'Видалити коментар',
            'no_comments': 'Поки що немає коментарів',
            'login_to_comment': 'Увійдіть, щоб коментувати',
        },
        'profile': {
            'profile': 'Профіль',
            'wall': 'Стіна',
            'write_on_wall': 'Написати на стіні',
            'whats_on_your_mind': 'Що у вас на думці?',
            'posts': 'Пости',
            'registration': 'Реєстрація',
            'follow': 'Підписатися',
            'unfollow': 'Відписатися',
            'settings': 'Налаштування',
            'no_wall_posts': 'Поки що немає повідомлень на стіні',
            'delete_wall_post': 'Видалити повідомлення',
        },
        'games': {
            'flash_games': 'Flash ігри',
            'play': 'Грати',
            'description': 'Опис',
        },
    },
    'en': {
        'common': {
            'home': 'Home',
            'login': 'Login',
            'register': 'Register',
            'logout': 'Logout',
            'profile': 'Profile',
            'settings': 'Settings',
            'search': 'Search',
            'save': 'Save',
            'cancel': 'Cancel',
            'delete': 'Delete',
            'edit': 'Edit',
            'create': 'Create',
            'submit': 'Submit',
            'loading': 'Loading...',
            'error': 'Error',
            'success': 'Success',
            'back': 'Back',
            'next': 'Next',
            'previous': 'Previous',
            'close': 'Close',
        },
        'pages': {
            'rules': 'Rules',
            'about': 'About',
            'privacy': 'Privacy',
            'terms': 'Terms',
            'contact': 'Contact',
        },
        'auth': {
            'login_title': 'Login',
            'register_title': 'Register',
            'username': 'Username',
            'email': 'Email',
            'password': 'Password',
            'confirm_password': 'Confirm Password',
            'forgot_password': 'Forgot Password?',
            'remember_me': 'Remember Me',
        },
        'posts': {
            'create_post': 'Create Post',
            'edit_post': 'Edit Post',
            'delete_post': 'Delete Post',
            'like': 'Like',
            'comment': 'Comment',
            'share': 'Share',
            'no_posts': 'No posts',
            'comments': 'Comments',
            'add_comment': 'Add comment',
            'reply': 'Reply',
            'delete_comment': 'Delete comment',
            'no_comments': 'No comments yet',
            'login_to_comment': 'Login to comment',
        },
        'profile': {
            'profile': 'Profile',
            'wall': 'Wall',
            'write_on_wall': 'Write on wall',
            'whats_on_your_mind': 'What\'s on your mind?',
            'posts': 'Posts',
            'registration': 'Registration',
            'follow': 'Follow',
            'unfollow': 'Unfollow',
            'settings': 'Settings',
            'no_wall_posts': 'No wall posts yet',
            'delete_wall_post': 'Delete post',
        },
        'games': {
            'flash_games': 'Flash Games',
            'play': 'Play',
            'description': 'Description',
        },
    },
    'kz': {
        'common': {
            'home': 'Басты',
            'login': 'Кіру',
            'register': 'Тіркелу',
            'logout': 'Шығу',
            'profile': 'Профиль',
            'settings': 'Баптаулар',
            'search': 'Іздеу',
            'save': 'Сақтау',
            'cancel': 'Болдырмау',
            'delete': 'Жою',
            'edit': 'Өңдеу',
            'create': 'Жасау',
            'submit': 'Жіберу',
            'loading': 'Жүктелуде...',
            'error': 'Қате',
            'success': 'Сәтті',
            'back': 'Артқа',
            'next': 'Келесі',
            'previous': 'Алдыңғы',
            'close': 'Жабу',
        },
        'pages': {
            'rules': 'Ережелер',
            'about': 'Біз туралы',
            'privacy': 'Құпиялылық',
            'terms': 'Шарттар',
            'contact': 'Байланыс',
        },
        'auth': {
            'login_title': 'Кіру',
            'register_title': 'Тіркелу',
            'username': 'Пайдаланушы аты',
            'email': 'Email',
            'password': 'Құпия сөз',
            'confirm_password': 'Құпия сөзді растау',
            'forgot_password': 'Құпия сөзді ұмыттыңыз ба?',
            'remember_me': 'Мені есте сақта',
        },
        'posts': {
            'create_post': 'Пост жасау',
            'edit_post': 'Постты өңдеу',
            'delete_post': 'Постты жою',
            'like': 'Ұнату',
            'comment': 'Пікір',
            'share': 'Бөлісу',
            'no_posts': 'Посттар жоқ',
            'comments': 'Пікірлер',
            'add_comment': 'Пікір қосу',
            'reply': 'Жауап беру',
            'delete_comment': 'Пікірді жою',
            'no_comments': 'Пікірлер жоқ',
            'login_to_comment': 'Пікір қосу үшін кіріңіз',
        },
        'profile': {
            'profile': 'Профиль',
            'wall': 'Қабырға',
            'write_on_wall': 'Қабырғаға жазу',
            'whats_on_your_mind': 'Не ойлап отырсыз?',
            'posts': 'Посттар',
            'registration': 'Тіркелу',
            'follow': 'Жазылу',
            'unfollow': 'Жазылудан бас тарту',
            'settings': 'Баптаулар',
            'no_wall_posts': 'Қабырғада хабарламалар жоқ',
            'delete_wall_post': 'Хабарламаны жою',
        },
        'games': {
            'flash_games': 'Flash ойындар',
            'play': 'Ойнау',
            'description': 'Сипаттама',
        },
    },
}

def init_default_translations():
    """Initialize default translations in database"""
    for lang, categories in DEFAULT_TRANSLATIONS.items():
        for category, keys in categories.items():
            for key, value in keys.items():
                full_key = f'{category}.{key}'
                existing = Translation.query.filter_by(key=full_key, language=lang).first()
                if not existing:
                    translation = Translation(
                        key=full_key,
                        language=lang,
                        value=value,
                        category=category
                    )
                    db.session.add(translation)
    db.session.commit()

@i18n_bp.route('/translations', methods=['GET'])
def get_translations():
    """Get translations for language"""
    lang = request.args.get('lang', 'ru')
    
    if lang not in ['ru', 'uk', 'en', 'kz']:
        lang = 'ru'
    
    # Load from database
    translations_db = Translation.query.filter_by(language=lang).all()
    
    if not translations_db:
        # Initialize default translations if database is empty
        init_default_translations()
        translations_db = Translation.query.filter_by(language=lang).all()
    
    # Build nested structure
    result = {}
    for trans in translations_db:
        keys = trans.key.split('.')
        current = result
        for key in keys[:-1]:
            if key not in current:
                current[key] = {}
            current = current[key]
        current[keys[-1]] = trans.value
    
    return jsonify(result), 200

@i18n_bp.route('/translations', methods=['POST'])
@admin_required
def update_translation():
    """Update or create translation (admin only)"""
    
    data = request.get_json()
    key = data.get('key')
    language = data.get('language')
    value = data.get('value')
    category = data.get('category')
    
    if not all([key, language, value]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    translation = Translation.query.filter_by(key=key, language=language).first()
    if translation:
        translation.value = value
        if category:
            translation.category = category
    else:
        translation = Translation(
            key=key,
            language=language,
            value=value,
            category=category
        )
        db.session.add(translation)
    
    db.session.commit()
    return jsonify(translation.to_dict()), 200

@i18n_bp.route('/set-language', methods=['POST'])
@token_required
def set_language():
    """Set user language"""
    data = request.get_json()
    lang = data.get('language', 'ru')
    
    if lang not in ['ru', 'uk', 'en', 'kz']:
        return jsonify({'error': 'Invalid language'}), 400
    
    request.current_user.language = lang
    db.session.commit()
    
    return jsonify({'message': 'Language updated'}), 200
