#!/bin/bash
# Deployment Script for DigitalOcean Droplet
# Run this script ON YOUR SERVER after initial setup

set -e  # Exit on error

echo "🚀 Starting deployment of Bidding Marketplace..."

# Configuration
DOMAIN="bidsoko.com"
PROJECT_DIR="/var/www/bidding-marketplace"
DB_NAME="bidding_marketplace"
DB_USER="bidding_user"
DB_PASSWORD="ChangeMeInProduction123!"

echo "📦 Step 1: Update system..."
apt update && apt upgrade -y

echo "📦 Step 2: Install required packages..."
apt install -y python3-pip python3-venv postgresql postgresql-contrib \
    nginx redis-server git supervisor ufw

echo "📦 Step 3: Install Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi

echo "🗄️  Step 4: Set up PostgreSQL..."
sudo -u postgres psql <<EOF
CREATE DATABASE ${DB_NAME};
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
ALTER ROLE ${DB_USER} SET client_encoding TO 'utf8';
ALTER ROLE ${DB_USER} SET default_transaction_isolation TO 'read committed';
ALTER ROLE ${DB_USER} SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
\c ${DB_NAME}
GRANT ALL ON SCHEMA public TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};
EOF

echo "📥 Step 5: Clone project from GitHub..."
mkdir -p /var/www
cd /var/www
if [ -d "$PROJECT_DIR" ]; then
    cd $PROJECT_DIR
    git pull origin main
else
    git clone https://github.com/benwawesh/bidding-marketplace.git
    cd $PROJECT_DIR
fi

echo "🐍 Step 6: Set up Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

echo "📦 Step 7: Install Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn

echo "⚙️  Step 8: Create .env file..."
cat > .env <<EOF
SECRET_KEY=$(python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
DEBUG=False
ALLOWED_HOSTS=${DOMAIN},www.${DOMAIN},157.245.40.136

DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_HOST=localhost
DB_PORT=5432

REDIS_URL=redis://localhost:6379
EOF

echo "🗃️  Step 9: Run Django migrations..."
python manage.py migrate
python manage.py collectstatic --noinput

echo "📦 Step 10: Build frontend..."
cd frontend
npm install
npm run build
cd ..

echo "🔧 Step 11: Set up Supervisor for Gunicorn and Daphne..."
cat > /etc/supervisor/conf.d/bidding-marketplace.conf <<'SUPERVISOREOF'
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
SUPERVISOREOF

echo "🌐 Step 12: Configure Nginx..."
cat > /etc/nginx/sites-available/bidding-marketplace <<'NGINXEOF'
server {
    listen 80;
    server_name bidsoko.com www.bidsoko.com 157.245.40.136;

    client_max_body_size 20M;

    # Frontend - serve React build
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
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Admin panel
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Django static files
    location /static/ {
        alias /var/www/bidding-marketplace/staticfiles/;
    }

    # User uploads
    location /media/ {
        alias /var/www/bidding-marketplace/media/;
    }
}
NGINXEOF

# Enable site
ln -sf /etc/nginx/sites-available/bidding-marketplace /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

echo "🔥 Step 13: Set up firewall..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

echo "🔄 Step 14: Set proper permissions..."
chown -R www-data:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR

echo "🔄 Step 15: Start services..."
supervisorctl reread
supervisorctl update
supervisorctl restart all
nginx -t && systemctl restart nginx
systemctl enable redis-server
systemctl start redis-server

echo "✅ Deployment complete!"
echo ""
echo "🎉 Your site should now be accessible at:"
echo "   http://${DOMAIN}"
echo "   http://www.${DOMAIN}"
echo "   http://157.245.40.136"
echo ""
echo "📝 Next steps:"
echo "   1. Create superuser: cd $PROJECT_DIR && source venv/bin/activate && python manage.py createsuperuser"
echo "   2. Set up SSL: apt install certbot python3-certbot-nginx && certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
echo ""
echo "📊 Check logs:"
echo "   - Django: tail -f /var/log/bidding-marketplace-django.log"
echo "   - Daphne: tail -f /var/log/bidding-marketplace-daphne.log"
echo "   - Nginx: tail -f /var/nginx/error.log"
