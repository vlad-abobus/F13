#!/usr/bin/env python3
"""
Quick Database Fix Script
Run this if you have database issues
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_sqlite():
    """Check SQLite status"""
    instance_dir = Path('./instance')
    db_file = instance_dir / 'freedom13.db'
    
    print("\n🔍 Checking SQLite status...")
    if db_file.exists():
        size = db_file.stat().st_size
        print(f"  ✅ SQLite database exists: {db_file}")
        print(f"  📊 Size: {size:,} bytes")
        return True
    else:
        print(f"  ❌ SQLite database not found: {db_file}")
        return False

def check_postgresql():
    """Check PostgreSQL configuration"""
    print("\n🔍 Checking PostgreSQL configuration...")
    
    db_url = os.environ.get('DATABASE_URL', '').strip()
    db_user = os.environ.get('DB_USER', '').strip()
    db_password = os.environ.get('DB_PASSWORD', '').strip()
    
    if db_url:
        print(f"  ✅ DATABASE_URL is set")
        print(f"  📄 Value: {db_url[:50]}..." if len(db_url) > 50 else f"  📄 Value: {db_url}")
        return True
    elif db_user and db_password:
        print(f"  ✅ Individual PostgreSQL variables are set")
        print(f"  👤 User: {db_user}")
        return True
    else:
        print(f"  ⚠️  No PostgreSQL configuration found")
        print(f"  💡 Using SQLite fallback")
        return False

def reinit_database():
    """Reinitialize database"""
    print("\n🔄 Reinitializing database...")
    
    try:
        from app import create_app, db
        from config import Config
        from app.database import init_db
        
        app = create_app(Config)
        with app.app_context():
            print(f"  📍 Using: {app.config['SQLALCHEMY_DATABASE_URI']}")
            init_db()
            print(f"  ✅ Database initialized successfully!")
            return True
            
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def main():
    print("""
╔════════════════════════════════════════╗
║  F13 - Database Quick Fix              ║
╚════════════════════════════════════════╝
    """)
    
    # Check current status
    has_sqlite = check_sqlite()
    has_postgresql = check_postgresql()
    
    print("\n" + "="*50)
    print("STATUS:")
    print("="*50)
    
    if has_sqlite:
        print("✅ SQLite is configured")
    if has_postgresql:
        print("✅ PostgreSQL is configured")
    if not has_sqlite and not has_postgresql:
        print("⚠️  No database found - will use SQLite")
    
    # Offer options
    print("\n" + "="*50)
    print("OPTIONS:")
    print("="*50)
    print("1 - Reinitialize database")
    print("2 - Reset to SQLite")
    print("3 - Configure PostgreSQL")
    print("4 - Show configuration")
    print("5 - Exit")
    print()
    
    choice = input("Enter choice (1-5): ").strip()
    
    if choice == "1":
        print("\n⚙️  Reinitializing database...")
        success = reinit_database()
        if success:
            print("\n✅ Done! You can now run: FULL_START.bat")
        else:
            print("\n❌ Database reinitialization failed")
            print("💡 Try 'Reset to SQLite' option")
        
    elif choice == "2":
        print("\n🔄 Resetting to SQLite...")
        # Clear PostgreSQL variables
        os.environ['DATABASE_URL'] = ''
        os.environ['DB_PASSWORD'] = ''
        
        # Create instance directory
        Path('./instance').mkdir(parents=True, exist_ok=True)
        
        success = reinit_database()
        if success:
            print("\n✅ SQLite is now ready!")
        else:
            print("\n❌ Failed to initialize SQLite")
            
    elif choice == "3":
        print("""
📚 PostgreSQL Configuration Steps:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Install PostgreSQL from https://www.postgresql.org/download/

2. Create database:
   psql -U postgres -c "CREATE DATABASE freedom13;"

3. Edit .env file:
   
   Option A (simple):
   DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/freedom13
   
   Option B (separate):
   DB_USER=postgres
   DB_PASSWORD=PASSWORD
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=freedom13

4. Run this script again and choose option 1 to reinitialize

5. If password has special chars (@, :, /):
   Use URL encoding (@ = %40, : = %3A, / = %2F)
        """)
        
    elif choice == "4":
        print("\n📋 Current Configuration:")
        print("="*50)
        
        db_url = os.environ.get('DATABASE_URL', '(not set)').strip()
        db_user = os.environ.get('DB_USER', '(not set)').strip()
        db_host = os.environ.get('DB_HOST', 'localhost').strip()
        db_port = os.environ.get('DB_PORT', '5432').strip()
        db_name = os.environ.get('DB_NAME', 'freedom13').strip()
        
        if db_url and db_url != '(not set)':
            print(f"DATABASE_URL: {db_url}")
        else:
            print(f"DATABASE_URL: (not set - using SQLite)")
            
        print(f"DB_USER: {db_user}")
        print(f"DB_HOST: {db_host}")
        print(f"DB_PORT: {db_port}")
        print(f"DB_NAME: {db_name}")
        
        print("\n" + "="*50)
        print("Edit .env file to change these values")
        
    elif choice == "5":
        print("👋 Goodbye!")
        sys.exit(0)
    else:
        print("❌ Invalid choice!")
    
    print("\n")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Cancelled")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
