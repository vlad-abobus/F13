# 📊 Database Configuration Guide for F13

## 🚀 Quick Start

You have **two options**:

### Option 1: SQLite (Recommended for Local Development) ✅
- **Easiest setup** - no installation required
- Perfect for **testing and development**
- Just leave `.env` unchanged and run `FULL_START.bat`

### Option 2: PostgreSQL (Production) 🏢
- Better for **production**
- Need PostgreSQL installed
- Configure connection string in `.env`

---

## 📋 Option 1: SQLite (Fastest) 

### Steps:
1. **Leave `.env` as is:**
   ```env
   DATABASE_URL=
   DB_PASSWORD=
   ```

2. **Run:**
   ```bash
   FULL_START.bat
   ```

3. **Done!** ✅ SQLite will be automatically created in `instance/freedom13.db`

### Pros:
- ✅ No external dependencies
- ✅ Zero configuration
- ✅ Perfect for development
- ✅ Portable (single file)

### Cons:
- ❌ Not suitable for production with many users
- ❌ No concurrent access optimization

---

## 🗄️ Option 2: PostgreSQL (Production)

### Step 1: Install PostgreSQL

**Windows:**
1. Download from https://www.postgresql.org/download/windows/
2. Run installer with default settings
3. Remember the password you set for `postgres` user

**Mac:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu):**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Step 2: Create Database

**Using psql (command line):**
```bash
# Windows: Open PostgreSQL command line
psql -U postgres

# Then run:
CREATE DATABASE freedom13;
```

**Or using pgAdmin GUI:**
- Open pgAdmin
- Right-click "Databases"
- Create new database named `freedom13`

### Step 3: Configure `.env`

**Option A: Using DATABASE_URL (Simple)**
```env
DATABASE_URL=postgresql://postgres:YOURPASSWORD@localhost:5432/freedom13
```

Replace `YOURPASSWORD` with your PostgreSQL password.

**Option B: Using Separate Variables (if password has special chars)**
```env
DATABASE_URL=
DB_USER=postgres
DB_PASSWORD=YOURPASSWORD
DB_HOST=localhost
DB_PORT=5432
DB_NAME=freedom13
```

### Step 4: Handle Special Characters in Password

If your password contains special characters like `@`, `:`, `/`, use URL encoding:

| Character | URL Code |
|-----------|----------|
| `@` | `%40` |
| `:` | `%3A` |
| `/` | `%2F` |
| `#` | `%23` |
| `?` | `%3F` |

**Example:**
- Password: `p@ss:word`
- In DATABASE_URL: `p%40ss%3Aword`

### Step 5: Test Connection

```bash
python INIT_DB.py
```

Should output:
```
[INFO] Initializing database...
[INFO] Database URI: postgresql://...
[OK] Database initialized successfully!
```

### Step 6: Run Application

```bash
FULL_START.bat
```

---

## 🔧 Troubleshooting

### Error: "Could not connect to server"

**Problem:** PostgreSQL server is not running

**Solution:**
```bash
# Windows
# Start PostgreSQL service in Windows Services

# Mac
brew services start postgresql@15

# Linux
sudo systemctl start postgresql
```

### Error: "password authentication failed"

**Problem:** Wrong password

**Solution:**
1. Reset PostgreSQL password:
   ```bash
   # Linux/Mac
   sudo -u postgres psql
   ALTER USER postgres WITH PASSWORD 'newpassword';
   \q
   ```

2. Update `.env` with new password

### Error: "database "freedom13" does not exist"

**Problem:** Database not created

**Solution:**
```bash
psql -U postgres -c "CREATE DATABASE freedom13;"
```

### Error: "UnicodeDecodeError"

**Problem:** Configuration encoding issue

**Solution:**
1. Use SQLite instead (Option 1)
2. Or ensure no Cyrillic characters in passwords
3. Use URL-encoded special characters

### Error: "Role 'postgres' does not exist"

**Problem:** PostgreSQL installation incomplete

**Solution:**
```bash
# Reinstall PostgreSQL and select "postgres" user during installation
# Or create the user:
sudo -u postgres createuser postgres
```

---

## 📚 More Help

### Run Interactive Setup
```bash
CONFIGURE_DATABASE.bat
```

### Check Current Configuration
```bash
python -c "from config import Config; print(Config.SQLALCHEMY_DATABASE_URI)"
```

### View .env Example
```bash
cat .env.example.security
```

---

## 🎯 Recommendations

### For Development
→ **Use SQLite** (Option 1)
- Fast setup
- No dependencies
- Perfect for testing

### For Production
→ **Use PostgreSQL** (Option 2)
- Better performance
- Handles many users
- Professional grade

### For Testing/CI/CD
→ **Use SQLite** (Option 1)
- Isolated tests
- No database cleanup needed
- Portable

---

## ✅ Verification Checklist

- [ ] `.env` file is created
- [ ] Database configuration is correct
- [ ] `FULL_START.bat` runs without errors
- [ ] Backend starts at `http://localhost:5000`
- [ ] Frontend starts at `http://localhost:3000`
- [ ] Data persists after restart

---

## 📞 Still Having Issues?

1. Check the error message carefully
2. Verify configuration in `.env`
3. Run: `python INIT_DB.py` to test connection
4. Check PostgreSQL is running (if using PostgreSQL)
5. Review troubleshooting section above
6. Check logs in `logs/` directory

---

**Last Updated:** February 17, 2026  
**Version:** 1.0.0
