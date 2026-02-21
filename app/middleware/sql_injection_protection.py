"""
SQL Injection Protection - защита от SQL инъекций
Примечание: SQLAlchemy ORM уже защищает от SQL инъекций,
но этот модуль добавляет дополнительный уровень защиты
"""

import re
import logging
from functools import wraps
from flask import request

logger = logging.getLogger(__name__)


class SQLinjectionPatterns:
    """Паттерны для детектирования SQL инъекций"""
    
    DANGEROUS_PATTERNS = [
        # Основные SQL команды
        r"(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)",
        
        # SQL комментарии
        r"(--|;|\/\*|\*\/|#)",
        
        # SQL операторы
        r"(OR|AND)\s*1\s*=\s*1",
        r"(OR|AND)\s*'.*'=.*'",
        
        # UNION SELECT атаки
        r"UNION\s+SELECT",
        r"UNION\s+ALL\s+SELECT",
        
        # Blind SQL injection
        r"SLEEP\s*\(",
        r"BENCHMARK\s*\(",
        r"WAITFOR\s+DELAY",
        
        # Time-based blind SQL injection
        r"AND\s+\d+\s*=\s*\d+",
        r"OR\s+\d+\s*=\s*\d+",
        
        # Stacked queries
        r";\s*(DROP|DELETE|INSERT|UPDATE)",
        
        # Error-based SQL injection
        r"EXTRACTVALUE\s*\(",
        r"UPDATEXML\s*\(",
    ]


class SQLinjectionDetector:
    """Класс для детектирования SQL инъекций"""
    
    @staticmethod
    def clean_input(value: str) -> str:
        """Очистить входные данные от потенциально опасных символов"""
        if not isinstance(value, str):
            return value
        
        # Удалить null byte
        value = value.replace('\x00', '')
        
        # Удалить контрольные символы
        value = re.sub(r'[\x00-\x1f\x7f]', '', value)
        
        return value
    
    @staticmethod
    def is_sql_injection(value: str) -> bool:
        """Проверить если значение содержит SQL инъекцию"""
        if not isinstance(value, str):
            return False
        
        # Приведи к нижнему caseе для проверки
        value_lower = value.lower()
        
        # Проверить каждый паттерн
        for pattern in SQLinjectionPatterns.DANGEROUS_PATTERNS:
            if re.search(pattern, value_lower, re.IGNORECASE):
                logger.warning(f"🚨 Возможная SQL инъекция обнаружена: {value[:100]}")
                return True
        
        return False
    
    @staticmethod
    def sanitize_query_params(data: dict) -> dict:
        """Санитизировать параметры запроса"""
        sanitized = {}
        
        for key, value in data.items():
            if isinstance(value, str):
                # Проверяем на SQL инъекцию
                if SQLinjectionDetector.is_sql_injection(value):
                    logger.warning(f"⚠️ Потенциальная инъекция в параметре {key}")
                    # Просто пропускаем, не включаем в санитизированные данные
                    continue
                
                # Очищаем значение
                sanitized[key] = SQLinjectionDetector.clean_input(value)
            elif isinstance(value, dict):
                # Рекурсивно обрабатываем вложенные объекты
                sanitized[key] = SQLinjectionDetector.sanitize_query_params(value)
            elif isinstance(value, list):
                # Обрабатываем массивы
                sanitized[key] = [
                    SQLinjectionDetector.clean_input(item) if isinstance(item, str) else item
                    for item in value
                ]
            else:
                sanitized[key] = value
        
        return sanitized
    
    @staticmethod
    def check_request_data(req_data: dict) -> bool:
        """Проверить весь объект данных запроса"""
        for key, value in req_data.items():
            if isinstance(value, str):
                if SQLinjectionDetector.is_sql_injection(value):
                    logger.warning(f"🚨 SQL инъекция в параметре {key}: {value}")
                    return False
            elif isinstance(value, dict):
                if not SQLinjectionDetector.check_request_data(value):
                    return False
            elif isinstance(value, list):
                for item in value:
                    if isinstance(item, str) and SQLinjectionDetector.is_sql_injection(item):
                        logger.warning(f"🚨 SQL инъекция в массиве: {item}")
                        return False
                    elif isinstance(item, dict) and not SQLinjectionDetector.check_request_data(item):
                        return False
        
        return True


class QueryParamValidator:
    """Валидация параметров запроса"""
    
    @staticmethod
    def validate_string(value: str, max_length: int = 500, allow_special: bool = False) -> tuple[bool, str]:
        """Валидировать строковый параметр"""
        if not isinstance(value, str):
            return False, "Value must be a string"
        
        if len(value) > max_length:
            return False, f"Value exceeds maximum length of {max_length}"
        
        if not allow_special:
            # Проверяем только буквы, цифры и базовые символы
            if not re.match(r'^[a-zA-Z0-9\s\-_.@]+$', value):
                return False, "Contains invalid characters"
        
        return True, ""
    
    @staticmethod
    def validate_email(email: str) -> tuple[bool, str]:
        """Валидировать email"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        
        if not re.match(pattern, email):
            return False, "Invalid email format"
        
        if len(email) > 254:
            return False, "Email is too long"
        
        return True, ""
    
    @staticmethod
    def validate_username(username: str) -> tuple[bool, str]:
        """Валидировать имя пользователя"""
        if len(username) < 3:
            return False, "Username must be at least 3 characters"
        
        if len(username) > 50:
            return False, "Username is too long"
        
        if not re.match(r'^[a-zA-Z0-9_-]+$', username):
            return False, "Username can only contain letters, numbers, hyphens and underscores"
        
        return True, ""
    
    @staticmethod
    def validate_url(url: str) -> tuple[bool, str]:
        """Валидировать URL"""
        pattern = r'^https?://[^\s/$.?#].[^\s]*$'
        
        if not re.match(pattern, url, re.IGNORECASE):
            return False, "Invalid URL format"
        
        if len(url) > 2000:
            return False, "URL is too long"
        
        return True, ""
    
    @staticmethod
    def validate_json(data: dict, schema: dict) -> tuple[bool, str]:
        """Валидировать JSON структуру"""
        for required_field in schema.get('required', []):
            if required_field not in data:
                return False, f"Missing required field: {required_field}"
        
        for field, field_type in schema.get('properties', {}).items():
            if field in data:
                value = data[field]
                
                if field_type == 'string' and not isinstance(value, str):
                    return False, f"Field {field} must be a string"
                
                if field_type == 'email':
                    is_valid, msg = QueryParamValidator.validate_email(value)
                    if not is_valid:
                        return False, msg
                
                if field_type == 'username':
                    is_valid, msg = QueryParamValidator.validate_username(value)
                    if not is_valid:
                        return False, msg
                
                if 'maxLength' in field_type:
                    if len(str(value)) > field_type['maxLength']:
                        return False, f"Field {field} exceeds max length"
        
        return True, ""


def protect_from_sql_injection(f):
    """Декоратор для защиты от SQL инъекций"""
    @wraps(f)
    def decorated(*args, **kwargs):
        # Проверяем данные GET запроса
        for key, value in request.args.items():
            if isinstance(value, str) and SQLinjectionDetector.is_sql_injection(value):
                logger.warning(f"🚨 SQL инъекция в GET параметре {key}")
                return {'error': 'Invalid request parameters'}, 400
        
        # Проверяем данные POST запроса
        if request.method in ['POST', 'PUT', 'PATCH']:
            try:
                data = request.get_json()
                if data and not SQLinjectionDetector.check_request_data(data):
                    return {'error': 'Invalid request data'}, 400
            except:
                pass
        
        return f(*args, **kwargs)
    
    return decorated


def validate_request(schema: dict):
    """Декоратор для валидации запроса по схеме"""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            data = request.get_json() or {}
            
            is_valid, msg = QueryParamValidator.validate_json(data, schema)
            
            if not is_valid:
                return {'error': msg}, 400
            
            return f(*args, **kwargs)
        
        return decorated
    return decorator
