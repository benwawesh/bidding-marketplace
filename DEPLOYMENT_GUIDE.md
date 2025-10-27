# Bidding Marketplace - Deployment Guide

## ✅ What We've Completed

1. ✅ PostgreSQL database configured
2. ✅ All migrations applied
3. ✅ Superuser created
4. ✅ Real-time WebSocket updates working
5. ✅ Multi-round bidding system ready
6. ✅ User dashboard with bidding history

---

## 🚀 Going Live - Deployment Options

### Option 1: Deploy to a VPS (Recommended for Kenya)

**Popular VPS Providers:**
- DigitalOcean ($4-6/month) - International, very reliable
- Linode ($5/month) - Good for Africa
- AWS Lightsail ($3.50-5/month) - Amazon's simplified hosting
- Vultr ($2.50-6/month) - Has servers closer to Kenya

**Steps:**

#### 1. Set up the server (Ubuntu 22.04 recommended)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y python3-pip python3-venv postgresql nginx redis-server supervisor

# Install Node.js for frontend
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

#### 2. Set up PostgreSQL

```bash
# Create database and user
sudo -u postgres psql <<EOF
CREATE DATABASE bidding_marketplace;
CREATE USER bidding_user WITH PASSWORD 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE bidding_marketplace TO bidding_user;
\c bidding_marketplace
GRANT ALL ON SCHEMA public TO bidding_user;
EOF
```

#### 3. Clone and set up your project

```bash
# Clone from GitHub
cd /var/www
sudo git clone https://github.com/benwawesh/bidding-marketplace.git
cd bidding-marketplace

# Set up Python virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Copy and configure environment file
cp .env.production .env
sudo nano .env  # Edit with your production values
```

#### 4. Build frontend

```bash
cd frontend
npm install
npm run build
```

#### 5. Collect static files

```bash
cd /var/www/bidding-marketplace
source venv/bin/activate
python manage.py collectstatic --noinput
```

#### 6. Set up Gunicorn (Python WSGI server)

Create `/etc/supervisor/conf.d/bidding-marketplace.conf`:

```ini
[program:bidding-marketplace-django]
command=/var/www/bidding-marketplace/venv/bin/gunicorn config.wsgi:application --bind 127.0.0.1:8000 --workers 3
directory=/var/www/bidding-marketplace
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/bidding-marketplace-django.log

[program:bidding-marketplace-daphne]
command=/var/www/bidding-marketplace/venv/bin/daphne -b 127.0.0.1 -p 8001 config.asgi:application
directory=/var/www/bidding-marketplace
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/bidding-marketplace-daphne.log
```

#### 7. Set up Nginx

Create `/etc/nginx/sites-available/bidding-marketplace`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 20M;

    # Frontend static files
    location / {
        root /var/www/bidding-marketplace/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API requests
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Admin panel
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Static files
    location /static/ {
        alias /var/www/bidding-marketplace/staticfiles/;
    }

    # Media files
    location /media/ {
        alias /var/www/bidding-marketplace/media/;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/bidding-marketplace /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl restart supervisor
```

#### 8. Set up SSL (HTTPS)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

### Option 2: Deploy to Heroku (Easier, but more expensive)

1. Install Heroku CLI
2. Add `Procfile`:
   ```
   web: gunicorn config.wsgi
   worker: daphne config.asgi:application -b 0.0.0.0 -p $PORT
   ```
3. Add `runtime.txt`:
   ```
   python-3.12.0
   ```
4. Deploy:
   ```bash
   heroku create bidding-marketplace
   heroku addons:create heroku-postgresql:mini
   heroku addons:create heroku-redis:mini
   git push heroku main
   heroku run python manage.py migrate
   heroku run python manage.py createsuperuser
   ```

---

### Option 3: Deploy to Railway.app (Modern, Easy)

1. Connect your GitHub repo to Railway
2. Add PostgreSQL and Redis addons
3. Set environment variables
4. Railway will auto-deploy on git push

---

## 🔒 Security Checklist Before Going Live

- [ ] Change SECRET_KEY in `.env`
- [ ] Set DEBUG=False in production
- [ ] Change database password
- [ ] Set up proper ALLOWED_HOSTS
- [ ] Enable HTTPS/SSL
- [ ] Set up firewall (ufw)
- [ ] Configure CORS properly
- [ ] Set up backups for PostgreSQL
- [ ] Configure Redis password
- [ ] Review file upload limits
- [ ] Set up monitoring (e.g., Sentry)

---

## 📊 Post-Deployment

### Start Redis (for WebSocket)
```bash
sudo systemctl start redis
sudo systemctl enable redis
```

### Create admin user
```bash
python manage.py createsuperuser
```

### Test your deployment
- Visit http://yourdomain.com
- Test user registration
- Create an auction
- Create a round
- Test bidding
- Check WebSocket real-time updates
- Test M-Pesa payments (if configured)

---

## 🔧 Useful Commands

```bash
# View logs
sudo tail -f /var/log/bidding-marketplace-django.log
sudo tail -f /var/log/bidding-marketplace-daphne.log

# Restart services
sudo supervisorctl restart bidding-marketplace-django
sudo supervisorctl restart bidding-marketplace-daphne
sudo systemctl restart nginx

# Database backup
pg_dump -U bidding_user bidding_marketplace > backup.sql

# Update code
cd /var/www/bidding-marketplace
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
cd frontend && npm install && npm run build
sudo supervisorctl restart all
```

---

## 💰 Estimated Costs (Monthly)

**Budget Option:**
- VPS (Vultr/DigitalOcean): $5-6
- Domain name: $1 (first year deals)
- **Total: ~$6-7/month**

**Professional Option:**
- Better VPS: $12-20
- Domain: $1-2
- Cloudflare CDN: Free
- Backups: $1-2
- **Total: ~$14-24/month**

---

## 🇰🇪 Kenya-Specific Considerations

1. **Domain Registration**: Use `.co.ke` domains from KENIC
2. **M-Pesa Integration**: Get credentials from Safaricom Daraja API
3. **Hosting**: Consider servers in South Africa or Europe for better latency
4. **Compliance**: Ensure you comply with Kenya's Data Protection Act

---

## 📞 Support

If you encounter issues:
1. Check logs first
2. Verify environment variables
3. Test database connection
4. Check Redis is running
5. Verify Nginx configuration

---

## 🎉 You're Ready!

Your bidding marketplace is production-ready with:
- ✅ PostgreSQL database
- ✅ Real-time WebSocket updates
- ✅ Multi-round bidding system
- ✅ User dashboard
- ✅ Admin panel
- ✅ Secure authentication
- ✅ Responsive design

Good luck with your launch! 🚀
