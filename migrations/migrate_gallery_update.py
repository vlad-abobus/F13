"""
Migration: Add tags to gallery and make post_id nullable
"""

def migrate_up(db):
    """Upgrade"""
    try:
        # Check if tags column exists
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        columns = [col['name'] for col in inspector.get_columns('gallery')]
        
        if 'tags' not in columns:
            db.engine.execute('''
                ALTER TABLE gallery ADD COLUMN tags TEXT
            ''')
            print("✓ Added 'tags' column to gallery table")
        
        # Make post_id nullable if it isn't already
        # This is database-specific, so we'll try to alter it
        try:
            db.engine.execute('''
                ALTER TABLE gallery MODIFY post_id VARCHAR(36)
            ''')
            print("✓ Made 'post_id' nullable in gallery table")
        except:
            try:
                # For SQLite
                db.engine.execute('''
                    ALTER TABLE gallery DROP CONSTRAINT gallery_ibfk_1
                ''')
            except:
                pass
            print("✓ Updated gallery table")
        
    except Exception as e:
        print(f"Migration error: {e}")
        raise


def migrate_down(db):
    """Downgrade"""
    try:
        db.engine.execute('''
            ALTER TABLE gallery DROP COLUMN tags
        ''')
        print("✓ Removed 'tags' column from gallery table")
    except Exception as e:
        print(f"Downgrade error: {e}")
