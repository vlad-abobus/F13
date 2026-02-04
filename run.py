"""
Точка входу для запуску Flask додатку
"""
from app import create_app
from config import Config
import os

app = create_app(Config)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', app.config.get('PORT', 5000)))
    host = os.environ.get('HOST', app.config.get('HOST', '127.0.0.1'))
    app.run(
        host=host,
        port=port,
        debug=app.config.get('DEBUG', False)
    )
