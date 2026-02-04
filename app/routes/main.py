"""
Main routes (HTML pages)
"""
from flask import Blueprint, render_template_string

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """Main page - React app will handle routing"""
    return render_template_string('''
    <!DOCTYPE html>
    <html>
    <head>
        <title>Freedom13</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body>
        <div id="root"></div>
        <script src="/static/js/main.js"></script>
    </body>
    </html>
    ''')
