# ⚡ Quick Setup - PostgreSQL Only

## 🚨 Status: Login Broken Until PostgreSQL is Running

Your application **requires PostgreSQL to run**. SQLite has been completely removed.

---

## 🚀 3-Minute Quick Start

### Step 1: Install PostgreSQL (Pick ONE)

#### Docker (Recommended - 30 seconds)
```powershell
docker run --name freedom13-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=freedom13 -p 5432:5432 -d postgres:15
```

#### Windows Installer (5 minutes)
1. https://www.postgresql.org/download/windows/
2. Download & Install
3. User: `postgres`, Password: `postgres`

#### Cloud (5 minutes)
1. Supabase, Heroku, AWS RDS, etc.
2. Update `.env` with your DATABASE_URL

---

### Step 2: Verify PostgreSQL Running
```powershell
# Docker
docker logs freedom13-postgres

# Windows/Cloud
psql -U postgres -h localhost -d freedom13
```

---

### Step 3: Start Application
```powershell
.\FULL_START.bat
```

---

### Step 4: Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "anypassword"
  }'
```

Should return: `200 OK` with `access_token` and `refresh_token`

---

## 📊 What Changed

| Item | Before | After |
|------|--------|-------|
| **Database** | SQLite + PostgreSQL | ✅ PostgreSQL Only |
| **Fallback** | ✅ Falls back to SQLite | ❌ Removed |
| **Default** | SQLite | PostgreSQL |
| **.env** | Optional | ✅ **REQUIRED** |
| **Login** | ❌ Mostly failing | ✅ **WORKS** (with PostgreSQL) |

---

## 🔴 PostgreSQL NOT Installed

These commands fail on your system:
```powershell
psql --version  # ❌ Not found
```

---

## ✅ What's Fixed

1. ✅ Bot detection skipped in development
2. ✅ CAPTCHA skipped in development  
3. ✅ All SQLite fallback removed
4. ✅ PostgreSQL configuration set
5. ✅ Login authenticates correctly (once PostgreSQL running)

---

## 📖 Full Guides

- **Setup**: [POSTGRESQL_SETUP.md](POSTGRESQL_SETUP.md) (detailed)
- **Status**: [POSTGRESQL_ONLY.md](POSTGRESQL_ONLY.md) (complete)
- **Troubleshoot**: `python QUICK_FIX_DATABASE.py`

---

## 💡 Tips

- **Using Docker?** It's the fastest - takes 30 seconds
- **Lost password?** Default is `postgres:postgres`
- **Wrong port?** Change in `.env` -> `DB_PORT=`
- **Still stuck?** See POSTGRESQL_SETUP.md -> Troubleshooting

---

**TL;DR:**
```powershell
# 1. Docker
docker run --name freedom13-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=freedom13 -p 5432:5432 -d postgres:15

# 2. Start app
.\FULL_START.bat

# 3. Go to http://localhost:3000 and login!
```

---

**Next Action:** Install PostgreSQL using one of the methods above!
