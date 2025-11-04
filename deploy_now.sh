#!/bin/bash
# Quick deployment script - Run this on your LOCAL machine
# It will connect to your server and deploy the changes

echo "🚀 Deploying to bidsoko.com..."
echo ""

ssh root@bidsoko.com << 'ENDSSH'
cd /var/www/bidding-marketplace
echo "📥 Pulling latest code..."
git pull origin main

echo ""
echo "📦 Building frontend..."
cd frontend
npm run build

echo ""
echo "🔄 Restarting nginx..."
cd ..
sudo nginx -t && sudo systemctl restart nginx

echo ""
echo "✅ Deployment complete!"
echo "🌐 Check: https://bidsoko.com"
ENDSSH

echo ""
echo "Done! Your changes are now live."
