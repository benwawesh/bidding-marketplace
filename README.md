# 🎯 Bidding Marketplace

A modern, real-time multi-round bidding platform built with Django and React.

![Status](https://img.shields.io/badge/status-production--ready-success)
![Django](https://img.shields.io/badge/Django-5.2.7-green)
![React](https://img.shields.io/badge/React-19.1.1-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-ready-blue)

## ✨ Features

### For Users
- 🎯 **Real-time Bidding** - Live WebSocket updates, no refresh needed
- 📊 **User Dashboard** - Complete bidding history with statistics
- 🔄 **Multi-Round Auctions** - Participate in multiple rounds
- 💰 **Pledge System** - Flexible min/max pledge ranges
- 📱 **Responsive Design** - Works on mobile, tablet, desktop
- 🔐 **Secure Authentication** - JWT-based authentication

### For Admins
- 👑 **Full Control** - Comprehensive admin panel
- 🎪 **Auction Management** - Create and manage auctions
- 🔄 **Round Creation** - Start new bidding rounds instantly
- 📊 **Winner Calculation** - Automatic winner selection
- 💳 **Payment Integration** - M-Pesa support ready
- 📈 **Real-time Monitoring** - Track bids as they happen

### Technical Highlights
- ⚡ **WebSocket Support** - Real-time updates with Django Channels
- 🗄️ **PostgreSQL** - Production-grade database
- 🚀 **Redis** - Fast caching and WebSocket channel layer
- 🎨 **Modern UI** - Tailwind CSS responsive design
- 🔒 **Secure** - CORS, CSRF protection, JWT tokens
- 📦 **Production Ready** - Gunicorn, Daphne, deployment configs

## 🚀 Quick Start

### Local Development

```bash
# Clone repository
git clone https://github.com/benwawesh/bidding-marketplace.git
cd bidding-marketplace

# Backend setup
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set up PostgreSQL (see POSTGRES_SETUP.md)
sudo -u postgres psql < setup_postgres.sql

# Run migrations
python manage.py migrate
python manage.py createsuperuser

# Start Django & Daphne
python manage.py runserver  # Terminal 1
daphne config.asgi:application  # Terminal 2

# Frontend setup
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` for frontend and `http://localhost:8000/admin` for admin panel.

## 📚 Documentation

- **[QUICKSTART_DEPLOYMENT.md](QUICKSTART_DEPLOYMENT.md)** - Deploy in 5 minutes
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Comprehensive deployment guide
- **[POSTGRES_SETUP.md](POSTGRES_SETUP.md)** - Database setup instructions

## 🏗️ Project Structure

```
bidding-marketplace/
├── auctions/           # Auctions, bids, rounds models & APIs
├── accounts/           # User authentication & profiles
├── payments/           # M-Pesa integration
├── admin_panel/        # Custom admin features
├── config/             # Django settings & configuration
├── frontend/           # React application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Page components
│   │   ├── api/        # API integration
│   │   └── hooks/      # Custom React hooks (WebSocket)
└── media/              # User uploads
```

## 🛠️ Tech Stack

**Backend:**
- Django 5.2.7
- Django REST Framework
- Django Channels (WebSocket)
- PostgreSQL
- Redis
- JWT Authentication

**Frontend:**
- React 19.1.1
- React Router
- React Query (TanStack)
- Tailwind CSS
- Axios
- WebSocket (native)

**Deployment:**
- Gunicorn (WSGI)
- Daphne (ASGI)
- Nginx
- Supervisor

## 🎯 Core Functionality

### Bidding Flow
1. Admin creates auction and sets rounds
2. Users pay participation fee to join round
3. Users place pledges (within min/max range)
4. Real-time leaderboard updates via WebSocket
5. Admin closes round and calculates winner
6. Winner with highest valid pledge wins

### Real-time Updates
- New rounds broadcast instantly
- Bids update leaderboard live
- No page refresh needed
- WebSocket connection status indicator

## 🔧 Environment Variables

Create `.env` file:

```env
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=bidding_marketplace
DB_USER=bidding_user
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432
```

## 📦 Deployment

### Railway (Recommended)
```bash
# 1. Push to GitHub
git push origin main

# 2. Deploy on Railway
# - Connect GitHub repo
# - Add PostgreSQL & Redis
# - Set environment variables
# - Deploy automatically!
```

### VPS (DigitalOcean, etc.)
```bash
# See DEPLOYMENT_GUIDE.md for complete instructions
sudo apt install python3 postgresql nginx redis-server
# ... (full setup in guide)
```

## 🧪 Testing

```bash
# Backend tests
python manage.py test

# Frontend
cd frontend
npm run lint
```

## 📊 Database Schema

**Key Models:**
- `User` - Custom user with authentication
- `Auction` - Products for bidding
- `Round` - Bidding rounds (multiple per auction)
- `Bid` - User pledges
- `Participation` - Round entry tracking
- `Order` - Completed purchases

## 🔐 Security

- JWT token authentication
- Password hashing with Django's PBKDF2
- CORS configuration
- CSRF protection
- SQL injection prevention (Django ORM)
- XSS protection

## 📈 Performance

- Redis caching for WebSocket
- Database query optimization
- Static file serving via CDN-ready
- Gzip compression
- Lazy loading images

## 🌍 Internationalization

Currently supports:
- English (default)
- Kenyan Shilling (KSh) currency

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is private and proprietary.

## 👨‍💻 Author

**Ben Wawesh**
- GitHub: [@benwawesh](https://github.com/benwawesh)

## 🙏 Acknowledgments

Built with assistance from Claude Code (Anthropic).

## 📞 Support

For issues or questions:
1. Check documentation in `/docs`
2. Review [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
3. Open an issue on GitHub

---

## 🎉 Status: Production Ready!

This application is fully tested and ready for production deployment.

**Next Steps:**
1. Review [QUICKSTART_DEPLOYMENT.md](QUICKSTART_DEPLOYMENT.md)
2. Choose a hosting platform
3. Deploy in minutes!
4. Start your bidding marketplace! 🚀

---

Made with ❤️ using Django & React
