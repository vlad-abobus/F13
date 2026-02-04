"""
Script to fix invalid image URLs in the database
Run with: python -m app.scripts.fix_image_urls
"""
from app import create_app, db
from app.models.post import Post
from app.models.user import User
from app.models.profile_post import ProfilePost

def fix_old_local_avatar_urls():
    """Set old local avatar URLs (starting with /uploads/) to NULL"""
    from config import Config
    
    app = create_app(Config)
    with app.app_context():
        # Find users with old local avatar URLs
        users_with_local_avatars = User.query.filter(
            User.avatar_url.isnot(None),
            User.avatar_url.like('/uploads/%')
        ).all()
        
        count = 0
        for user in users_with_local_avatars:
            print(f"Setting avatar_url to NULL for user {user.username} (old URL: {user.avatar_url})")
            user.avatar_url = None
            count += 1
        
        db.session.commit()
        print(f"\n✅ Updated {count} users with old local avatar URLs")
        return count

def fix_image_urls():
    """Fix invalid image URLs by setting them to NULL"""
    app = create_app('config.Config')
    
    with app.app_context():
        # Fix posts.image_url
        posts_updated = db.session.query(Post).filter(
            Post.image_url.isnot(None)
        ).filter(
            db.or_(
                db.func.trim(Post.image_url) == '',
                Post.image_url == 'null',
                Post.image_url == 'NULL',
                Post.image_url == 'undefined',
                db.func.length(db.func.trim(Post.image_url)) == 0
            )
        ).update({Post.image_url: None}, synchronize_session=False)
        
        # Fix users.avatar_url
        users_updated = db.session.query(User).filter(
            User.avatar_url.isnot(None)
        ).filter(
            db.or_(
                db.func.trim(User.avatar_url) == '',
                User.avatar_url == 'null',
                User.avatar_url == 'NULL',
                User.avatar_url == 'undefined',
                db.func.length(db.func.trim(User.avatar_url)) == 0
            )
        ).update({User.avatar_url: None}, synchronize_session=False)
        
        # Fix profile_posts.image_url
        profile_posts_updated = db.session.query(ProfilePost).filter(
            ProfilePost.image_url.isnot(None)
        ).filter(
            db.or_(
                db.func.trim(ProfilePost.image_url) == '',
                ProfilePost.image_url == 'null',
                ProfilePost.image_url == 'NULL',
                ProfilePost.image_url == 'undefined',
                db.func.length(db.func.trim(ProfilePost.image_url)) == 0
            )
        ).update({ProfilePost.image_url: None}, synchronize_session=False)
        
        db.session.commit()
        
        print(f"✅ Fixed {posts_updated} posts with invalid image_url")
        print(f"✅ Fixed {users_updated} users with invalid avatar_url")
        print(f"✅ Fixed {profile_posts_updated} profile_posts with invalid image_url")
        print("✅ Migration completed successfully!")

if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == '--fix-local-avatars':
        fix_old_local_avatar_urls()
    else:
        fix_image_urls()
        print("\n💡 Tip: Run with --fix-local-avatars to also fix old local avatar URLs (/uploads/...)")
