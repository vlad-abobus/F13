"""
Search and discovery service for posts and users
"""
from app import db
from app.models.post import Post
from app.models.user import User
from app.models.follow import Follow
from sqlalchemy import or_, and_, func
from datetime import datetime, timedelta

class SearchService:
    """Service for searching and discovering content"""
    
    @staticmethod
    def search_posts(query_text, filters=None, page=1, per_page=20):
        """
        Search for posts by text
        
        Args:
            query_text: Search query
            filters: Dict with filter options (emotion, sort_by, date_range, etc.)
            page: Page number
            per_page: Items per page
            
        Returns:
            List of Post objects
        """
        filters = filters or {}
        
        # Base query - only approved, non-deleted posts
        query = Post.query.filter_by(
            is_deleted=False,
            moderation_status='approved'
        )
        
        # Text search
        if query_text:
            search_term = f"%{query_text}%"
            query = query.filter(
                or_(
                    Post.title.ilike(search_term),
                    Post.text.ilike(search_term),
                    Post.description.ilike(search_term)
                )
            )
        
        # Filter by emotion (theme)
        if filters.get('emotion'):
            query = query.filter_by(theme=filters['emotion'])
        
        # Filter by date range
        if filters.get('date_range'):
            days = filters['date_range']
            start_date = datetime.utcnow() - timedelta(days=days)
            query = query.filter(Post.created_at >= start_date)
        
        # Filter by author username
        if filters.get('author'):
            query = query.join(User).filter(User.username.ilike(f"%{filters['author']}%"))
        
        # Filter by likes range
        if filters.get('min_likes'):
            query = query.filter(Post.likes_count >= filters['min_likes'])
        if filters.get('max_likes'):
            query = query.filter(Post.likes_count <= filters['max_likes'])
        
        # Sorting
        sort_by = filters.get('sort_by', 'new')  # new, popular, trending, relevant
        if sort_by == 'popular':
            query = query.order_by(Post.likes_count.desc(), Post.created_at.desc())
        elif sort_by == 'trending':
            # Posts with recent activity high engagement
            week_ago = datetime.utcnow() - timedelta(days=7)
            query = query.filter(Post.created_at >= week_ago).order_by(
                Post.likes_count.desc(),
                Post.comments_count.desc()
            )
        elif sort_by == 'relevant':
            # For text search - posts with title match rank higher
            if query_text:
                query = query.order_by(
                    Post.title.ilike(f"{query_text}%").desc(),
                    Post.created_at.desc()
                )
            else:
                query = query.order_by(Post.created_at.desc())
        else:  # new
            query = query.order_by(Post.created_at.desc())
        
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return {
            'items': [p.to_dict() for p in pagination.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
            }
        }
    
    @staticmethod
    def search_users(query_text, page=1, per_page=20):
        """
        Search for users by username or bio
        
        Args:
            query_text: Search query
            page: Page number
            per_page: Items per page
            
        Returns:
            List of users
        """
        search_term = f"%{query_text}%"
        query = User.query.filter(
            or_(
                User.username.ilike(search_term),
                User.bio.ilike(search_term)
            )
        ).filter_by(is_banned=False).order_by(User.created_at.desc())
        
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return {
            'items': [u.to_dict() for u in pagination.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
            }
        }
    
    @staticmethod
    def get_trending_posts(emotion=None, days=7, limit=20):
        """
        Get trending posts based on engagement
        
        Args:
            emotion: Filter by emotion/theme
            days: Time window in days
            limit: Max results
            
        Returns:
            List of trending posts
        """
        start_date = datetime.utcnow() - timedelta(days=days)
        
        query = Post.query.filter(
            Post.created_at >= start_date,
            Post.is_deleted == False,
            Post.moderation_status == 'approved'
        )
        
        if emotion:
            query = query.filter_by(theme=emotion)
        
        # Score by engagement
        query = query.order_by(
            (Post.likes_count + Post.comments_count * 2).desc()
        ).limit(limit)
        
        return [p.to_dict() for p in query.all()]
    
    @staticmethod
    def get_recommended_posts(user_id, limit=20):
        """
        Get recommended posts for a user based on their activity
        
        Args:
            user_id: User ID
            limit: Max results
            
        Returns:
            List of recommended posts
        """
        user = User.query.get(user_id)
        if not user:
            return []
        
        # Get users they follow
        following = db.session.query(Follow.following_id).filter_by(
            follower_id=user_id
        ).subquery()
        
        # Get posts from following and similar emotion preferences
        query = Post.query.filter(
            Post.is_deleted == False,
            Post.moderation_status == 'approved'
        ).filter(
            or_(
                Post.user_id.in_(db.session.query(following)),
                Post.theme == getattr(user, 'activity_status', '')
            )
        ).order_by(
            Post.created_at.desc()
        ).limit(limit)
        
        return [p.to_dict() for p in query.all()]
