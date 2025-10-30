#!/bin/bash
# Quick deployment script for mobile responsive changes
# This script pushes to GitHub and triggers server update

set -e  # Exit on error

echo "🚀 Quick Deploy - Mobile Responsive Updates"
echo "==========================================="

# Step 1: Commit and push changes
echo ""
echo "📦 Step 1: Committing changes to Git..."
cd /home/ben/bidding-marketplace

git add .
git commit -m "Add mobile responsive design for all pages

- Fixed App.css root container (removed max-width constraint)
- Made HomePage mobile-first with responsive grids
- Updated Navbar with hamburger menu for mobile
- Made all card components responsive (BuyNowCard, BothCard)
- Updated HeroAuctionSection for mobile devices
- Made CategoriesGrid responsive
- Updated LoginPage and BrowsePage for mobile
- Made PromoBar mobile responsive
- Added overflow-x-hidden to prevent horizontal scroll
- Products now show 2 per row on mobile, 5 on desktop

🤖 Generated with Claude Code" || echo "No changes to commit or already committed"

echo ""
echo "⬆️  Step 2: Pushing to GitHub..."
git push origin main

echo ""
echo "=========================================="
echo "✅ Code pushed to GitHub!"
echo ""
echo "🖥️  Now run this command ON YOUR SERVER (bidsoko.com):"
echo ""
echo "ssh root@bidsoko.com"
echo ""
echo "Then run:"
echo "cd /var/www/bidding-marketplace && \\"
echo "git pull origin main && \\"
echo "cd frontend && \\"
echo "npm run build && \\"
echo "sudo nginx -t && \\"
echo "sudo systemctl restart nginx"
echo ""
echo "=========================================="
