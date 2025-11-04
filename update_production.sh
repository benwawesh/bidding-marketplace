#!/bin/bash
# Update Production Server Script
# Run this ON YOUR PRODUCTION SERVER (bidsoko.com)

set -e  # Exit on error

echo "🚀 Updating Production Server - Order Management & Financial Analytics"
echo "======================================================================"

PROJECT_DIR="/var/www/bidding-marketplace"

echo ""
echo "📥 Step 1: Pulling latest code from GitHub..."
cd $PROJECT_DIR
git pull origin main

echo ""
echo "🐍 Step 2: Updating backend dependencies..."
source venv/bin/activate
pip install -r requirements.txt

echo ""
echo "🗃️  Step 3: Running database migrations..."
python manage.py migrate

echo ""
echo "📦 Step 4: Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo ""
echo "📁 Step 5: Collecting static files..."
python manage.py collectstatic --noinput

echo ""
echo "🔄 Step 6: Restarting services..."
sudo supervisorctl restart all
sudo nginx -t && sudo systemctl restart nginx

echo ""
echo "======================================================================"
echo "✅ Production server updated successfully!"
echo ""
echo "🌐 Check your site at: https://bidsoko.com/management"
echo ""
echo "📊 Verify:"
echo "   - Order Management button visible in sidebar"
echo "   - Financial Analytics shows real transaction data"
echo ""
echo "📝 Check logs if needed:"
echo "   sudo tail -f /var/log/bidding-marketplace-django.log"
echo "   sudo tail -f /var/log/bidding-marketplace-daphne.log"
echo ""
