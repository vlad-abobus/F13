"""
Admin analytics and reporting routes
"""
from flask import Blueprint, request, jsonify
from app import db
from app.middleware.auth import admin_required
from app.services.analytics_service import AnalyticsService

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/users', methods=['GET'])
@admin_required
def get_user_analytics():
    """Get user statistics and analysis"""
    stats = AnalyticsService.get_user_stats()
    return jsonify(stats), 200

@analytics_bp.route('/content', methods=['GET'])
@admin_required
def get_content_analytics():
    """Get content statistics and analysis"""
    stats = AnalyticsService.get_content_stats()
    return jsonify(stats), 200

@analytics_bp.route('/moderation', methods=['GET'])
@admin_required
def get_moderation_analytics():
    """
    Get moderation activity analytics
    Query params: days (default: 7)
    """
    days = request.args.get('days', 7, type=int)
    stats = AnalyticsService.get_moderation_stats(days)
    return jsonify(stats), 200

@analytics_bp.route('/engagement', methods=['GET'])
@admin_required
def get_engagement_analytics():
    """
    Get user engagement metrics
    Query params: days (default: 7)
    """
    days = request.args.get('days', 7, type=int)
    metrics = AnalyticsService.get_engagement_metrics(days)
    return jsonify(metrics), 200

@analytics_bp.route('/health', methods=['GET'])
@admin_required
def get_health_status():
    """Get system health status"""
    health = AnalyticsService.get_health_check()
    return jsonify(health), 200

@analytics_bp.route('/dashboard', methods=['GET'])
@admin_required
def get_dashboard():
    """Get complete admin dashboard data"""
    dashboard = {
        'users': AnalyticsService.get_user_stats(),
        'content': AnalyticsService.get_content_stats(),
        'moderation': AnalyticsService.get_moderation_stats(days=7),
        'engagement': AnalyticsService.get_engagement_metrics(days=7),
        'health': AnalyticsService.get_health_check(),
    }
    return jsonify(dashboard), 200
