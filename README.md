# AI Algorithmic Trading System

A complete AI-powered algorithmic trading system with frontend and backend components, integrated with Zerodha broker.

## 🚀 Features

- **AI-Powered Trading**: Machine learning models for market analysis and trading decisions
- **Real-time Data**: Live market data from Zerodha
- **Automated Trading**: Execute trades automatically based on AI signals
- **Portfolio Management**: Track and manage your trading portfolio
- **Risk Management**: Built-in risk controls and position sizing
- **Beautiful UI**: Modern, responsive frontend interface
- **Real-time Notifications**: Get alerts for trades and market events

## 🏗️ Architecture

```
├── frontend/          # React/Next.js app (Vercel deployment)
├── backend/           # Node.js/Express API (Render deployment)
├── ai-models/         # Machine learning models
├── database/          # Database schemas and migrations
└── docs/             # Documentation
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Chart.js** - Trading charts
- **Socket.io** - Real-time updates

### Backend
- **Node.js** - Runtime
- **Express.js** - API framework
- **TypeScript** - Type safety
- **Socket.io** - Real-time communication
- **JWT** - Authentication

### AI & ML
- **Python** - ML models
- **TensorFlow/PyTorch** - Deep learning
- **Scikit-learn** - Machine learning
- **Pandas** - Data manipulation
- **NumPy** - Numerical computing

### Database
- **PostgreSQL** - Primary database
- **Redis** - Caching and sessions

### Broker Integration
- **Zerodha Kite Connect API** - Trading and market data

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+
- PostgreSQL
- Redis
- Zerodha API credentials

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd ai-trading-system
```

2. **Install Frontend Dependencies**
```bash
cd frontend
npm install
```

3. **Install Backend Dependencies**
```bash
cd ../backend
npm install
```

4. **Install AI Models Dependencies**
```bash
cd ../ai-models
pip install -r requirements.txt
```

5. **Environment Setup**
```bash
# Copy environment files
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

6. **Database Setup**
```bash
# Run database migrations
cd backend
npm run migrate
```

7. **Start Development Servers**
```bash
# Terminal 1 - Frontend
cd frontend
npm run dev

# Terminal 2 - Backend
cd backend
npm run dev

# Terminal 3 - AI Models
cd ai-models
python main.py
```

## 🌐 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Render)
1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy as a web service

## 📊 AI Trading Strategies

- **Moving Average Crossover**
- **RSI Divergence**
- **MACD Signal**
- **Bollinger Bands**
- **Support/Resistance Levels**
- **Volume Analysis**
- **Sentiment Analysis**

## 🔐 Security

- JWT authentication
- API rate limiting
- Input validation
- SQL injection prevention
- XSS protection
- CORS configuration

## 📈 Performance

- Real-time data processing
- Optimized database queries
- Redis caching
- CDN for static assets
- Load balancing ready

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## ⚠️ Disclaimer

This software is for educational purposes only. Trading involves risk and you should never invest more than you can afford to lose. The authors are not responsible for any financial losses incurred through the use of this software.

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Email: support@ai-trading-system.com
- Discord: [Join our community](https://discord.gg/ai-trading)
