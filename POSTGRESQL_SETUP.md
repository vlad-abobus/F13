# ⚙️ PostgreSQL Setup Guide for Freedom13

## 🔴 Current Status
PostgreSQL is **NOT installed** on your system.

## 📦 Installation Options

### Option 1: PostgreSQL Local Installation (Windows)

#### 1. Download PostgreSQL
- Go to: https://www.postgresql.org/download/windows/
- Download PostgreSQL 15 or later

#### 2. Install PostgreSQL
```
1. Run installer
2. Set password for postgres user: postgres (or your choice)
3. Port: 5432 (default)
4. Select components (include pgAdmin for GUI)
5. Complete installation
```

#### 3. After Installation
```powershell
# Test connection
psql -U postgres -d postgres

# Create database
createdb -U postgres freedom13

# Verify
psql -U postgres -l
```

---

### Option 2: Docker (Recommended for Development)

#### 1. Install Docker Desktop
- Download: https://www.docker.com/products/docker-desktop

#### 2. Run PostgreSQL Container
```powershell
docker run --name freedom13-postgres ^
  -e POSTGRES_USER=postgres ^
  -e POSTGRES_PASSWORD=postgres ^
  -e POSTGRES_DB=freedom13 ^
  -p 5432:5432 ^
  -d postgres:15
```

#### 3. Verify Connection
```powershell
docker logs freedom13-postgres
# Should show: "database system is ready to accept connections"
```

---

### Option 3: PostgreSQL Cloud (Easiest Setup)

Use services like:
- **Heroku PostgreSQL** (free tier available)
- **PlanetScale** (MySQL)
- **AWS RDS** (PostgreSQL)
- **Supabase** (PostgreSQL)

Then update `.env`:
```
DATABASE_URL=postgresql://user:pass@host:port/dbname
```

---

## ✅ Post-Installation Verification

Once PostgreSQL is running:

```powershell
# Test with psql
psql -U postgres -h localhost -d freedom13

# Or test with Python
python -c "import psycopg2; print('✅ PostgreSQL driver works')"
```

---

## 🚀 Quick Start After PostgreSQL is Ready

```powershell
# 1. Verify .env has PostgreSQL config
cat .env | findstr "DATABASE_URL"

# 2. Initialize database
python INIT_DB.py

# 3. Start application
.\FULL_START.bat
```

---

## 🔧 Troubleshooting

### Connection Refused (5432)
```
❌ Error: connection refused on port 5432
✅ Solution: Check if PostgreSQL service is running
  
Windows: 
  - Check Services (services.msc)
  - Look for "postgresql-x64"
  - Start if stopped

Docker:
  - docker ps -a
  - docker start freedom13-postgres
```

### Authentication Failed
```
❌ Error: password authentication failed
✅ Solution: Check .env DATABASE_URL matches PostgreSQL user/password

Current .env:
  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/freedom13

Verify PostgreSQL user exists:
  psql -U postgres -l
```

### Database Doesn't Exist
```
❌ Error: database "freedom13" does not exist
✅ Solution: Create the database

  createdb -U postgres freedom13
```

---

## 📋 Configuration Checklist

- ✅ PostgreSQL installed and running
- ✅ Port 5432 is accessible
- ✅ User `postgres` exists (or custom user in .env)
- ✅ Database `freedom13` created
- ✅ .env file has correct DATABASE_URL
- ✅ No firewall blocking port 5432

---

## 🎯 Next Steps After PostgreSQL Setup

1. **Verify connection:**
   ```powershell
   python INIT_DB.py
   ```
   Should output: `[OK] Database initialized successfully!`

2. **Start application:**
   ```powershell
   .\FULL_START.bat
   ```

3. **Test login:**
   ```powershell
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "username": "testuser",
       "password": "password123"
     }'
   ```

---

## 📞 Support

If you encounter issues:

1. **Check PostgreSQL logs:**
   ```powershell
   # Docker
   docker logs freedom13-postgres

   # Windows service
   # Check Event Viewer
   ```

2. **Test database connection:**
   ```powershell
   python QUICK_FIX_DATABASE.py
   # Interactive troubleshooting tool
   ```

3. **Review configuration:**
   ```powershell
   Get-Content .env
   ```

---

**Status:** ⚠️ PostgreSQL setup required before running application  
**Next Action:** Install PostgreSQL using Option 1, 2, or 3 above  
**Time Estimate:** 5-15 minutes for installation  

Good luck! 🚀
