"""
Caching utilities for performance optimization
"""
from app import cache
from app.models.post import Post
from app.models.user import User
from datetime import timedelta
import hashlib

class CacheManager:
    """Centralized cache management"""
    
    # Cache timeout constants
    CACHE_5MIN = 5 * 60
    CACHE_15MIN = 15 * 60
    CACHE_30MIN = 30 * 60
    CACHE_1HOUR = 60 * 60
    CACHE_6HOURS = 6 * 60 * 60
    
    @staticmethod
    def cache_trending_posts(emotion=None, days=7):
        """Cache trending posts"""
        cache_key = f"trending_posts:{emotion}:{days}"
        return cache.get(cache_key)
    
    @staticmethod
    def set_trending_posts(posts, emotion=None, days=7):
        """Set trending posts cache"""
        cache_key = f"trending_posts:{emotion}:{days}"
        cache.set(cache_key, posts, CacheManager.CACHE_15MIN)
    
    @staticmethod
    def cache_user_stats():
        """Cache user statistics"""
        return cache.get("user_stats")
    
    @staticmethod
    def set_user_stats(stats):
        """Set user statistics cache"""
        cache.set("user_stats", stats, CacheManager.CACHE_30MIN)
    
    @staticmethod
    def cache_content_stats():
        """Cache content statistics"""
        return cache.get("content_stats")
    
    @staticmethod
    def set_content_stats(stats):
        """Set content statistics cache"""
        cache.set("content_stats", stats, CacheManager.CACHE_30MIN)
    
    @staticmethod
    def cache_post(post_id):
        """Get cached post"""
        return cache.get(f"post:{post_id}")
    
    @staticmethod
    def set_post(post_id, post_data):
        """Cache post"""
        cache.set(f"post:{post_id}", post_data, CacheManager.CACHE_1HOUR)
    
    @staticmethod
    def invalidate_post(post_id):
        """Invalidate post cache"""
        cache.delete(f"post:{post_id}")
    
    @staticmethod
    def cache_user_profile(user_id):
        """Get cached user profile"""
        return cache.get(f"user_profile:{user_id}")
    
    @staticmethod
    def set_user_profile(user_id, user_data):
        """Cache user profile"""
        cache.set(f"user_profile:{user_id}", user_data, CacheManager.CACHE_6HOURS)
    
    @staticmethod
    def invalidate_user_profile(user_id):
        """Invalidate user profile cache"""
        cache.delete(f"user_profile:{user_id}")
    
    @staticmethod
    def invalidate_stats():
        """Invalidate all stats caches"""
        cache.delete("user_stats")
        cache.delete("content_stats")
    
    @staticmethod
    def invalidate_trending():
        """Invalidate trending posts caches"""
        # Would need to iterate through possible keys
        # For now, just clear all trending
        cache.delete_pattern("trending_posts:*")


class QueryOptimizer:
    """Query optimization utilities"""
    
    @staticmethod
    def get_popular_posts_optimized(limit=20, emotion=None):
        """Get popular posts with optimized queries"""
        from sqlalchemy import func
        
        query = Post.query.filter_by(
            is_deleted=False,
            moderation_status='approved'
        )
        
        if emotion:
            query = query.filter_by(theme=emotion)
        
        # Use select with specific columns to reduce data transfer
        query = query.with_entities(
            Post.id,
            Post.title,
            Post.text,
            Post.user_id,
            Post.likes_count,
            Post.comments_count,
            Post.created_at
        ).order_by(
            Post.likes_count.desc(),
            Post.created_at.desc()
        ).limit(limit)
        
        return query.all()
    
    @staticmethod
    def get_user_feed_optimized(user_id, page=1, per_page=20):
        """Get optimized user feed"""
        from app.models.follow import Follow
        from sqlalchemy import and_
        
        # Get following IDs
        following_ids = [f.following_id for f in db.session.query(
            Follow.following_id
        ).filter_by(follower_id=user_id).all()]
        
        # Add own posts
        following_ids.append(user_id)
        
        if not following_ids:
            return [], 0
        
        # Optimized query with pagination
        query = Post.query.filter(
            and_(
                Post.user_id.in_(following_ids),
                Post.is_deleted == False,
                Post.moderation_status == 'approved'
            )
        ).with_entities(
            Post.id,
            Post.title,
            Post.user_id,
            Post.likes_count,
            Post.created_at
        ).order_by(
            Post.created_at.desc()
        )
        
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        return pagination.items, pagination.total
    
    @staticmethod
    def get_search_results_optimized(query_text, limit=20):
        """Optimized search with minimal fields"""
        from sqlalchemy import or_
        
        search_term = f"%{query_text}%"
        results = Post.query.filter(
            or_(
                Post.title.ilike(search_term),
                Post.text.ilike(search_term)
            ),
            Post.is_deleted == False,
            Post.moderation_status == 'approved'
        ).with_entities(
            Post.id,
            Post.title,
            Post.user_id,
            Post.created_at
        ).order_by(
            Post.created_at.desc()
        ).limit(limit).all()
        
        return results
