"""
Analytics service for admin dashboard and insights
"""
from app import db
from app.models.user import User
from app.models.post import Post
from app.models.comment import Comment
from app.models.admin_log import AdminLog
from app.models.moderation_log import ModerationLog
from sqlalchemy import func, and_
from datetime import datetime, timedelta

class AnalyticsService:
    """Service for generating analytics and statistics"""
    
    @staticmethod
    def get_user_stats():
        """Get overall user statistics"""
        total_users = User.query.count()
        active_users = User.query.filter(
            User.last_post_time >= datetime.utcnow() - timedelta(days=7)
        ).count()
        banned_users = User.query.filter_by(is_banned=True).count()
        muted_users = User.query.filter_by(is_muted=True).count()
        admin_users = User.query.filter_by(status='admin').count()
        verified_users = User.query.filter(User.verification_type != 'none').count()
        
        return {
            'total_users': total_users,
            'active_users_7days': active_users,
            'banned_users': banned_users,
            'muted_users': muted_users,
            'admin_users': admin_users,
            'verified_users': verified_users,
            'verification_rate': round((verified_users / total_users * 100) if total_users > 0 else 0, 2)
        }
    
    @staticmethod
    def get_content_stats():
        """Get content statistics"""
        total_posts = Post.query.count()
        approved_posts = Post.query.filter_by(moderation_status='approved').count()
        pending_posts = Post.query.filter_by(moderation_status='pending').count()
        rejected_posts = Post.query.filter_by(moderation_status='rejected').count()
        deleted_posts = Post.query.filter_by(is_deleted=True).count()
        
        total_comments = Comment.query.count()
        avg_likes = db.session.query(func.avg(Post.likes_count)).scalar() or 0
        avg_comments = db.session.query(func.avg(Post.comments_count)).scalar() or 0
        
        # Get top emotions
        emotions = db.session.query(
            Post.theme,
            func.count(Post.id).label('count')
        ).filter_by(is_deleted=False).group_by(Post.theme).order_by(
            func.count(Post.id).desc()
        ).limit(5).all()
        
        return {
            'total_posts': total_posts,
            'approved_posts': approved_posts,
            'pending_posts': pending_posts,
            'rejected_posts': rejected_posts,
            'deleted_posts': deleted_posts,
            'total_comments': total_comments,
            'avg_likes_per_post': round(avg_likes, 2),
            'avg_comments_per_post': round(avg_comments, 2),
            'top_emotions': [{'emotion': e[0], 'count': e[1]} for e in emotions]
        }
    
    @staticmethod
    def get_moderation_stats(days=7):
        """Get moderation activity statistics"""
        start_date = datetime.utcnow() - timedelta(days=days)
        
        total_actions = ModerationLog.query.filter(
            ModerationLog.created_at >= start_date
        ).count()
        
        # Count by action type
        action_counts = db.session.query(
            ModerationLog.action,
            func.count(ModerationLog.id).label('count')
        ).filter(
            ModerationLog.created_at >= start_date
        ).group_by(ModerationLog.action).all()
        
        # Most active admins
        admin_activity = db.session.query(
            User.username,
            func.count(ModerationLog.id).label('actions')
        ).join(
            ModerationLog, ModerationLog.admin_id == User.id
        ).filter(
            ModerationLog.created_at >= start_date
        ).group_by(User.username).order_by(
            func.count(ModerationLog.id).desc()
        ).limit(10).all()
        
        # Most problematic users
        problem_users = db.session.query(
            User.username,
            func.count(ModerationLog.id).label('violations')
        ).join(
            ModerationLog, ModerationLog.user_id == User.id
        ).filter(
            ModerationLog.created_at >= start_date
        ).group_by(User.username).order_by(
            func.count(ModerationLog.id).desc()
        ).limit(10).all()
        
        return {
            'period_days': days,
            'total_actions': total_actions,
            'actions_by_type': [{'action': a[0], 'count': a[1]} for a in action_counts],
            'most_active_admins': [{'admin': a[0], 'actions': a[1]} for a in admin_activity],
            'most_problematic_users': [{'user': u[0], 'violations': u[1]} for u in problem_users],
        }
    
    @staticmethod
    def get_engagement_metrics(days=7):
        """Get user engagement metrics"""
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Daily active users
        daily_users = db.session.query(
            func.date(Post.created_at).label('date'),
            func.count(func.distinct(Post.user_id)).label('users')
        ).filter(
            Post.created_at >= start_date
        ).group_by(func.date(Post.created_at)).order_by(
            func.date(Post.created_at)
        ).all()
        
        # Posts per day
        posts_per_day = db.session.query(
            func.date(Post.created_at).label('date'),
            func.count(Post.id).label('posts')
        ).filter(
            Post.created_at >= start_date,
            Post.is_deleted == False
        ).group_by(func.date(Post.created_at)).order_by(
            func.date(Post.created_at)
        ).all()
        
        # Comments per day
        comments_per_day = db.session.query(
            func.date(Comment.created_at).label('date'),
            func.count(Comment.id).label('comments')
        ).filter(
            Comment.created_at >= start_date,
            Comment.is_deleted == False
        ).group_by(func.date(Comment.created_at)).order_by(
            func.date(Comment.created_at)
        ).all()
        
        return {
            'period_days': days,
            'daily_active_users': [
                {'date': str(d[0]), 'users': d[1]} for d in daily_users
            ],
            'posts_per_day': [
                {'date': str(d[0]), 'count': d[1]} for d in posts_per_day
            ],
            'comments_per_day': [
                {'date': str(d[0]), 'count': d[1]} for d in comments_per_day
            ],
        }
    
    @staticmethod
    def get_health_check():
        """Get system health status"""
        db_connection = False
        try:
            db.session.execute("SELECT 1")
            db_connection = True
        except:
            pass
        
        users_count = User.query.count()
        posts_count = Post.query.count()
        comments_count = Comment.query.count()
        
        # Check for recent activity
        last_post = Post.query.order_by(Post.created_at.desc()).first()
        last_activity = last_post.created_at if last_post else None
        
        # Check spam/abuse indicators
        pending_posts = Post.query.filter_by(moderation_status='pending').count()
        muted_users = User.query.filter_by(is_muted=True).count()
        
        return {
            'status': 'healthy' if db_connection else 'error',
            'database_connection': db_connection,
            'total_records': {
                'users': users_count,
                'posts': posts_count,
                'comments': comments_count,
            },
            'pending_moderation': pending_posts,
            'last_activity': last_activity.isoformat() if last_activity else None,
            'alerts': self._generate_alerts(pending_posts, muted_users, users_count)
        }
    
    @staticmethod
    def _generate_alerts(pending_posts, muted_users, total_users):
        """Generate system alerts"""
        alerts = []
        
        if pending_posts > 10:
            alerts.append({
                'level': 'warning',
                'message': f'{pending_posts} posts pending moderation'
            })
        
        if muted_users > (total_users * 0.1):  # More than 10% muted
            alerts.append({
                'level': 'warning',
                'message': f'{muted_users} users are muted ({round(muted_users/total_users*100)}%)'
            })
        
        return alerts
