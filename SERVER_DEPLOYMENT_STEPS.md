# 🚀 Deploy to Your DigitalOcean Server

**Server IP:** 157.245.40.136
**Domain:** bidsoko.com
**SSH:** You're already connected as root

---

## Step-by-Step Commands

Copy and paste these commands into your SSH terminal (root@bidmarket).

### 📦 Step 1: Update System & Install Software (5 minutes)

```bash
# Update system
apt update && apt upgrade -y

# Install required packages
apt install -y python3-pip python3-venv postgresql postgresql-contrib nginx redis-server git supervisor ufw

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify installations
echo "✅ Checking versions:"
python3 --version
node --version
npm --version
psql --version
```

---

### 🗄️ Step 2: Set Up PostgreSQL Database (2 minutes)

```bash
# Create database and user
sudo -u postgres psql <<EOF
CREATE DATABASE bidding_marketplace;
CREATE USER bidding_user WITH PASSWORD 'SecurePassword123!';
ALTER ROLE bidding_user SET client_encoding TO 'utf8';
ALTER ROLE bidding_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE bidding_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE bidding_marketplace TO bidding_user;
\c bidding_marketplace
GRANT ALL ON SCHEMA public TO bidding_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO bidding_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO bidding_user;
EOF

echo "✅ Database created!"
```

---

### 📥 Step 3: Clone Your Project (1 minute)

```bash
# Create directory and clone
mkdir -p /var/www
cd /var/www
git clone https://github.com/benwawesh/bidding-marketplace.git
cd bidding-marketplace

echo "✅ Project cloned!"
```

---

### 🐍 Step 4: Set Up Python Environment (3 minutes)

```bash
cd /var/www/bidding-marketplace

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ Python environment ready!"
```

---

### ⚙️ Step 5: Create Environment File (1 minute)

```bash
cd /var/www/bidding-marketplace

# Generate secret key and create .env
python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())" > /tmp/secret_key.txt

cat > .env <<EOF
SECRET_KEY=$(cat /tmp/secret_key.txt)
DEBUG=False
ALLOWED_HOSTS=bidsoko.com,www.bidsoko.com,157.245.40.136

DB_NAME=bidding_marketplace
DB_USER=bidding_user
DB_PASSWORD=SecurePassword123!
DB_HOST=localhost
DB_PORT=5432

REDIS_URL=redis://localhost:6379
EOF

rm /tmp/secret_key.txt
echo "✅ Environment configured!"
```

---

### 🗃️ Step 6: Run Migrations & Collect Static (2 minutes)

```bash
cd /var/www/bidding-marketplace
source venv/bin/activate

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

echo "✅ Database migrated!"
```

---

### 📦 Step 7: Build Frontend (3 minutes)

```bash
cd /var/www/bidding-marketplace/frontend

# Install dependencies
npm install

# Build for production
npm run build

echo "✅ Frontend built!"
```

---

### 🔧 Step 8: Set Up Supervisor (Gunicorn & Daphne) (2 minutes)

```bash
cat > /etc/supervisor/conf.d/bidding-marketplace.conf <<'EOF'
[program:bidding-django]
command=/var/www/bidding-marketplace/venv/bin/gunicorn config.wsgi:application --bind 127.0.0.1:8000 --workers 3
directory=/var/www/bidding-marketplace
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/bidding-django.log

[program:bidding-daphne]
command=/var/www/bidding-marketplace/venv/bin/daphne -b 127.0.0.1 -p 8001 config.asgi:application
directory=/var/www/bidding-marketplace
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/bidding-daphne.log
EOF

echo "✅ Supervisor configured!"
```

---

### 🌐 Step 9: Configure Nginx (2 minutes)

```bash
cat > /etc/nginx/sites-available/bidding-marketplace <<'EOF'
server {
    listen 80;
    server_name bidsoko.com www.bidsoko.com 157.245.40.136;

    client_max_body_size 20M;

    # Frontend
    location / {
        root /var/www/bidding-marketplace/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Admin
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
EOF

# Enable site
ln -sf /etc/nginx/sites-available/bidding-marketplace /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

echo "✅ Nginx configured!"
```

---

### 🔥 Step 10: Set Up Firewall (1 minute)

```bash
# Allow necessary ports
ufw allow 22   # SSH
ufw allow 80   # HTTP
ufw allow 443  # HTTPS
ufw --force enable

echo "✅ Firewall configured!"
```

---

### 🔄 Step 11: Set Permissions & Start Services (2 minutes)

```bash
# Set proper permissions
chown -R www-data:www-data /var/www/bidding-marketplace
chmod -R 755 /var/www/bidding-marketplace

# Start services
supervisorctl reread
supervisorctl update
supervisorctl start bidding-django
supervisorctl start bidding-daphne

# Restart Nginx
systemctl restart nginx

# Start Redis
systemctl enable redis-server
systemctl start redis-server

# Check status
echo "✅ Checking service status:"
supervisorctl status
systemctl status nginx
systemctl status redis-server

echo "✅ All services started!"
```

---

### 👤 Step 12: Create Superuser (1 minute)

```bash
cd /var/www/bidding-marketplace
source venv/bin/activate
python manage.py createsuperuser

# Follow the prompts to create your admin account
```

---

### 🔒 Step 13: Set Up SSL Certificate (2 minutes)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate (follow prompts)
certbot --nginx -d bidsoko.com -d www.bidsoko.com

# Auto-renewal is set up automatically
echo "✅ SSL configured!"
```

---

## ✅ Deployment Complete!

Your site is now live at:
- 🌐 **https://bidsoko.com**
- 🌐 **https://www.bidsoko.com**
- 🌐 **http://157.245.40.136**

---

## 🧪 Test Your Deployment

1. Visit https://bidsoko.com
2. Register a new user
3. Login to admin at https://bidsoko.com/admin
4. Create an auction
5. Create a round
6. Test bidding

---

## 📊 Useful Commands

```bash
# View logs
tail -f /var/log/bidding-django.log
tail -f /var/log/bidding-daphne.log
tail -f /var/log/nginx/error.log

# Restart services
supervisorctl restart bidding-django
supervisorctl restart bidding-daphne
systemctl restart nginx

# Update code
cd /var/www/bidding-marketplace
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
cd frontend && npm install && npm run build
supervisorctl restart all

# Database backup
pg_dump -U bidding_user bidding_marketplace > backup_$(date +%Y%m%d).sql
```

---

## 🐛 Troubleshooting

**If site doesn't load:**
```bash
supervisorctl status  # Check if services are running
nginx -t              # Test Nginx config
systemctl status nginx
```

**Check logs:**
```bash
tail -50 /var/log/bidding-django.log
tail -50 /var/log/bidding-daphne.log
```

**Restart everything:**
```bash
supervisorctl restart all
systemctl restart nginx
systemctl restart redis-server
```

---

## 🎉 You're Live!

Your bidding marketplace is now deployed and accessible!

**Next steps:**
1. Test all features
2. Add some test auctions
3. Invite users
4. Monitor logs for any issues

Good luck! 🚀
