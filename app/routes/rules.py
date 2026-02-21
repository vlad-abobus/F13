"""
Rules routes - Load rules from rules.json file
"""
from flask import Blueprint, jsonify
import json
from pathlib import Path

rules_bp = Blueprint('rules', __name__)

def load_rules():
    """Load rules from rules.json file"""
    try:
        rules_file = Path(__file__).parent.parent.parent / 'rules.json'
        with open(rules_file, 'r', encoding='utf-8') as f:
            rules = json.load(f)
        return rules if isinstance(rules, list) else []
    except FileNotFoundError:
        return []
    except json.JSONDecodeError:
        return []

@rules_bp.route('', methods=['GET'])
def get_rules():
    """Get rules list from rules.json"""
    rules = load_rules()
    return jsonify(rules), 200
