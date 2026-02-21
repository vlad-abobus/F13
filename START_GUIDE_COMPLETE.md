# 🚀 F13 - Complete Quick Start Guide

## ⚡ 30-Second Setup

```bash
# 1. Run the full startup script (do everything automatically)
FULL_START.bat
```

**That's it!** The script will:
- ✅ Set up virtual environment
- ✅ Install all dependencies  
- ✅ Create `.env` configuration
- ✅ Initialize database (SQLite by default)
- ✅ Create security database tables
- ✅ Start backend and frontend

Then access:
- 🌐 Frontend: http://localhost:3000
- 🔧 Backend: http://localhost:5000

---

## 📋 Available Commands

### 🟢 Start Application (All-in-One)
```bash
FULL_START.bat
```
**Recommended.** Does everything - setup, database, security, and starts both frontend and backend.

---

### 🔧 Database Management

#### Quick Fix (Easy)
```bash
python QUICK_FIX_DATABASE.py
```
**Interactive tool** for:
- ✅ Checking database status
- ✅ Reinitializing if broken
- ✅ Switching between SQLite and PostgreSQL
- ✅ Viewing configuration

#### Database Configuration Help
```bash
CONFIGURE_DATABASE.bat
```
**Interactive guide** for:
- ✅ SQLite setup (easiest)
- ✅ PostgreSQL setup (production)
- ✅ Troubleshooting

#### Manual Database Init
```bash
python INIT_DB.py
```
**Manual initialization.** Use if you know what you're doing.

#### Security Migrations
```bash
python migrations/migrate_security_models.py
```
**Creates security tables** (already done by FULL_START.bat)

---

### 📚 Documentation

| File | Purpose |
|------|---------|
| `README.md` | Main project documentation |
| `README_DATABASE.md` | Complete database guide |
| `SECURITY_COMPLETE.md` | Security system documentation |
| `SECURITY_QUICK_START.md` | Security setup guide |
| `.env.example.security` | Configuration template |

---

### 🧪 Testing & Verification

```bash
# Test security integration
python test_security_integration.py

# Test database connection
python INIT_DB.py
```

---

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Quick fix for database issues
python QUICK_FIX_DATABASE.py
```

### SQLAlchemy Unicode Error
**Problem:** `UnicodeDecodeError: 'utf-8' codec can't decode`

**Solution:**
1. Run `QUICK_FIX_DATABASE.py` → Option 2 (Reset to SQLite)
2. Or edit `.env` and remove DATABASE_URL special characters
3. Or use PostgreSQL with URL-encoded password

### Redis Not Available
**Expected warning** - system will use database as fallback. For production:
```bash
docker run -d -p 6379:6379 redis:latest
# or install Redis locally
```

### Port Already in Use
If port 5000 or 3000 is taken:
```bash
# Find and kill process on port 5000 (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

---

## 📊 What Each Script Does

### FULL_START.bat (Main Script)
```
1. [1/6] Check files & create .env
2. [2/6] Install Python dependencies + security packages
3. [3/6] Install Node.js dependencies
4. [4/6] Initialize database (INIT_DB.py)
5. [5/6] Run security migrations
6. [6/6] Start Flask backend & React frontend
```

### INIT_DB.py
- Creates database tables
- Adds default data
- Handles connection errors gracefully
- Falls back to SQLite if PostgreSQL unavailable

### QUICK_FIX_DATABASE.py
- Interactive database troubleshooting
- Check SQLite/PostgreSQL status
- Reset configuration
- Reinit database

### CONFIGURE_DATABASE.bat
- Guide for SQLite setup
- Guide for PostgreSQL setup
- Links to PostgreSQL download

---

## 🎯 Choose Your Path

### For First-Time Users / Testing
```bash
# Just run this:
FULL_START.bat

# Uses default SQLite
# No PostgreSQL needed
# Everything works out of the box
```

### For Production
```bash
# 1. Run database configuration
CONFIGURE_DATABASE.bat

# 2. Follow instructions to set up PostgreSQL
# 3. Start application
FULL_START.bat
```

### For Troubleshooting
```bash
# Run the quick fixer
python QUICK_FIX_DATABASE.py

# Choose option 1 to reinitialize
# Choose option 2 to reset to SQLite
# Choose option 4 to see configuration
```

---

## ✅ Verification Checklist

After running `FULL_START.bat`, check:

- [ ] No errors in console
- [ ] Both windows opened (Flask & React)
- [ ] Backend running at http://localhost:5000
- [ ] Frontend running at http://localhost:3000
- [ ] Can load main page
- [ ] Database created (check `instance/freedom13.db` for SQLite)

---

## 🔐 Security Features (Automatic)

All of these are automatically active:

✅ **DDoS Protection** - Rate limiting
✅ **Bot Detection** - WAI detection + CAPTCHA
✅ **Spam Detection** - Content analysis
✅ **SQL Injection Protection** - Input validation
✅ **Account Security** - 2FA, sessions, IP whitelist
✅ **Audit Logging** - All events logged

All configured in:
- `app/middleware/*.py` (protection logic)
- `.env.example.security` (configuration)
- `migrations/migrate_security_models.py` (database tables)

---

## 📞 Need Help?

| Issue | Solution |
|-------|----------|
| Database errors | Run `python QUICK_FIX_DATABASE.py` |
| Can't connect to DB | Read `README_DATABASE.md` |
| Port already in use | Kill process: `netstat -ano \| findstr :5000` |
| Package not found | Run `FULL_START.bat` again |
| Encoding errors | Restart with SQLite (Option 2 in QUICK_FIX) |
| Security issues | See `SECURITY_COMPLETE.md` |

---

## 🚀 Performance Tips

### For Development
- Use SQLite (default) - fast & no setup
- No need for Redis
- Run `FULL_START.bat` once, then restart backend/frontend manually

### For Production
- Use PostgreSQL (see README_DATABASE.md)
- Set up Redis (instructions in QUICK_FIX_DATABASE.py)
- Enable HTTPS in config.py
- Set `SECRET_KEY` to random strong value

---

## 📖 Full Documentation

For detailed information:
- **Project Setup:** `README.md`
- **Database:** `README_DATABASE.md`
- **Security:** `SECURITY_COMPLETE.md`
- **Security Integration:** `SECURITY_QUICK_START.md`
- **Configuration:** `.env.example.security`

---

**Ready to start?**

```bash
FULL_START.bat
```

**Questions?** Check `README_DATABASE.md` or `SECURITY_COMPLETE.md`

**Something broken?** Run `QUICK_FIX_DATABASE.py`

---

**Last Updated:** February 17, 2026  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
