"""
Add tags column to gallery table
"""
import sqlite3
from pathlib import Path

def migrate():
    """Add tags column and make post_id nullable"""
    db_path = Path(__file__).parent / 'instance' / 'freedom13.db'
    
    if not db_path.exists():
        print(f"Database not found at {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Check if tags column already exists
        cursor.execute("PRAGMA table_info(gallery)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'tags' not in columns:
            cursor.execute('ALTER TABLE gallery ADD COLUMN tags TEXT')
            conn.commit()
            print("✓ Added 'tags' column to gallery table")
        else:
            print("✓ 'tags' column already exists")
        
        # Recreate table to make post_id nullable (SQLite limitation)
        try:
            cursor.execute('''
                CREATE TABLE gallery_new (
                    id TEXT PRIMARY KEY,
                    post_id TEXT,
                    user_id TEXT NOT NULL,
                    image_url TEXT NOT NULL,
                    category TEXT,
                    is_nsfw BOOLEAN NOT NULL DEFAULT 0,
                    tags TEXT,
                    likes_count INTEGER NOT NULL DEFAULT 0,
                    created_at DATETIME NOT NULL,
                    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            ''')
            
            # Copy data from old table
            cursor.execute('''
                INSERT INTO gallery_new 
                SELECT id, post_id, user_id, image_url, category, is_nsfw, tags, likes_count, created_at 
                FROM gallery
            ''')
            
            # Drop old table and rename new one
            cursor.execute('DROP TABLE gallery')
            cursor.execute('ALTER TABLE gallery_new RENAME TO gallery')
            
            conn.commit()
            print("✓ Made post_id nullable")
        except sqlite3.OperationalError as e:
            if 'already exists' in str(e):
                print("✓ Table already has correct schema")
            else:
                raise
        
        conn.close()
        return True
        
    except sqlite3.Error as e:
        print(f"✗ Database error: {e}")
        try:
            conn.close()
        except:
            pass
        return False

if __name__ == '__main__':
    if migrate():
        print("\nMigration completed successfully!")
    else:
        print("\nMigration failed!")
