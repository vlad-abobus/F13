#!/usr/bin/env python3
"""
Simple script to create post_likes and comment_likes tables
"""
import sqlite3

try:
    # Database path
    db_path = 'instance/freedom13.db'
    
    print(f"Creating tables in database: {db_path}")
    
    # Connect directly to SQLite
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create post_likes table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS post_likes (
            id VARCHAR(36) PRIMARY KEY,
            post_id VARCHAR(36) NOT NULL,
            user_id VARCHAR(36) NOT NULL,
            created_at DATETIME NOT NULL,
            UNIQUE (post_id, user_id),
            FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')
    print("✓ post_likes table created")
    
    # Create comment_likes table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS comment_likes (
            id VARCHAR(36) PRIMARY KEY,
            comment_id VARCHAR(36) NOT NULL,
            user_id VARCHAR(36) NOT NULL,
            created_at DATETIME NOT NULL,
            UNIQUE (comment_id, user_id),
            FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')
    print("✓ comment_likes table created")
    
    # Create indexes for better query performance
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id)')
    print("✓ Indexes created")
    
    conn.commit()
    conn.close()
    
    print("\n✓ All database tables created successfully!")
    
except Exception as e:
    print(f"✗ Error creating tables: {e}")
    import traceback
    traceback.print_exc()

