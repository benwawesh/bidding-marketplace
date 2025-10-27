# 🚀 Production Update Checklist

## When You Push Code Changes to Production

### Step 1: Push from Local
```bash
cd /home/ben/bidding-marketplace
git add -A
git commit -m "Your changes description"
git push origin main
```

### Step 2: Pull on Server
```bash
ssh root@157.245.40.136
cd /var/www/bidding-marketplace
git pull origin main
```

### Step 3: Update .env on Server (if needed)
```bash
# Edit .env to ensure it has:
nano /var/www/bidding-marketplace/.env
```

Make sure it includes:
```env
SECRET_KEY=your-production-secret-key
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,157.245.40.136,bidsoko.com,www.bidsoko.com

DB_NAME=bidding_marketplace
DB_USER=bidding_user
DB_PASSWORD=SecurePassword123!
DB_HOST=localhost
DB_PORT=5432
```

### Step 4: Update Dependencies (if needed)
```bash
cd /var/www/bidding-marketplace
source venv/bin/activate
pip install -r requirements.txt
```

### Step 5: Run Migrations (if any database changes)
```bash
python manage.py migrate
python manage.py collectstatic --noinput
```

### Step 6: Rebuild Frontend (if frontend changes)
```bash
cd /var/www/bidding-marketplace/frontend
npm install
npm run build
```

### Step 7: Restart Services
```bash
supervisorctl restart all
systemctl restart nginx
```

### Step 8: Check Logs
```bash
tail -50 /var/log/bidding-django.log
tail -50 /var/log/bidding-daphne.log
supervisorctl status
```

---

## Quick Commands

### View Logs
```bash
tail -f /var/log/bidding-django.log
tail -f /var/log/bidding-daphne.log
```

### Restart Everything
```bash
supervisorctl restart all && systemctl restart nginx
```

### Check Status
```bash
supervisorctl status
systemctl status nginx
systemctl status redis-server
```

---

## 🎯 Your Production URLs

- **Main Site:** https://bidsoko.com
- **IP Address:** http://157.245.40.136
- **Admin Panel:** https://bidsoko.com/admin
- **API:** https://bidsoko.com/api/

---

## 📊 Current Configuration

**CORS Includes:**
- ✅ localhost:5173 (local dev)
- ✅ 157.245.40.136 (IP)
- ✅ bidsoko.com (domain)
- ✅ www.bidsoko.com (www subdomain)

**Services Running:**
- ✅ Gunicorn (Django) on port 8000
- ✅ Daphne (WebSocket) on port 8001
- ✅ Nginx (reverse proxy) on ports 80/443
- ✅ Redis (caching) on port 6379
- ✅ PostgreSQL (database) on port 5432

---

## 🔧 Common Issues & Fixes

### Issue: Site Not Updating
```bash
cd /var/www/bidding-marketplace/frontend
npm run build
supervisorctl restart all
```

### Issue: Database Error
```bash
cd /var/www/bidding-marketplace
source venv/bin/activate
python manage.py migrate
```

### Issue: CORS Error
Check that settings.py has all production URLs in CORS_ALLOWED_ORIGINS

### Issue: 502 Bad Gateway
```bash
supervisorctl status  # Check if services are running
supervisorctl restart all
```

---

## ✅ What's Already Configured

- ✅ Production URLs in CORS settings
- ✅ ALLOWED_HOSTS includes domain and IP
- ✅ Frontend uses relative API URLs (works everywhere)
- ✅ WebSocket uses dynamic host detection
- ✅ SSL/HTTPS ready
- ✅ Database configured with PostgreSQL
- ✅ Services auto-start on server reboot

---

**Your deployment is production-ready!** 🎊
