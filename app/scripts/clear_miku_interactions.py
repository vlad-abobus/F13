"""
Script to clear all MikuGPT interactions from database
Run with: python -m app.scripts.clear_miku_interactions
"""
from app import create_app, db
from config import Config
from sqlalchemy import text

def clear_miku_interactions():
    """Delete all MikuGPT interactions from database and fix table structure"""
    import sys
    import io
    # Fix encoding for Windows console
    if sys.platform == 'win32':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    
    app = create_app(Config)
    with app.app_context():
        try:
            # First, try to delete all records
            result = db.session.execute(text("DELETE FROM miku_interactions"))
            db.session.commit()
            print("[OK] Deleted all MikuGPT interactions from database")
            
            # Verify table structure and recreate if needed
            try:
                from app.models.miku import MikuInteraction
                # Try to query to check if structure is correct
                test_count = db.session.execute(text("SELECT COUNT(*) FROM miku_interactions")).scalar()
                print(f"[OK] Table structure is correct. Current count: {test_count}")
            except Exception as struct_error:
                if 'user_id' in str(struct_error) or 'column' in str(struct_error).lower():
                    print("Table structure is incorrect. Recreating...")
                    db.session.execute(text("DROP TABLE IF EXISTS miku_interactions CASCADE"))
                    db.session.commit()
                    from app.models.miku import MikuInteraction
                    db.create_all()
                    db.session.commit()
                    print("[OK] Recreated miku_interactions table with correct structure")
            
            return 0
        except Exception as e:
            print(f"Error: {e}")
            # Try to drop and recreate
            try:
                print("Dropping and recreating table...")
                db.session.execute(text("DROP TABLE IF EXISTS miku_interactions CASCADE"))
                db.session.commit()
                from app.models.miku import MikuInteraction
                db.create_all()
                db.session.commit()
                print("[OK] Recreated miku_interactions table")
            except Exception as drop_error:
                print(f"Error: {drop_error}")
            return 0

if __name__ == '__main__':
    clear_miku_interactions()
