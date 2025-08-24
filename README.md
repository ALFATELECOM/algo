# AI Trading System - Fresh Start

A modern, clean AI-powered algorithmic trading system built with Next.js 14, Node.js, and Python.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+
- Git

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd ai-trading-system

# Install dependencies
npm install
cd frontend && npm install
cd ../backend && npm install
cd ../ai-models && pip install -r requirements.txt
```

### Development
```bash
# Start all services
npm run dev

# Or start individually
npm run dev:frontend
npm run dev:backend
npm run dev:ai
```

## 📁 Project Structure

```
ai-trading-system/
├── frontend/          # Next.js 14 React app
├── backend/           # Node.js Express API
├── ai-models/         # Python FastAPI ML service
├── shared/            # Shared types and utilities
└── docs/             # Documentation
```

## 🛠 Tech Stack

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Shadcn/ui
- Zustand (State Management)

### Backend
- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Redis
- JWT Authentication

### AI Models
- Python 3.8+
- FastAPI
- Scikit-learn
- TensorFlow
- Pandas/NumPy

## 🚀 Deployment

### Frontend (Vercel)
```bash
npm run deploy:frontend
```

### Backend (Render)
```bash
npm run deploy:backend
```

### AI Models (Railway)
```bash
npm run deploy:ai
```

## 📝 License

MIT License - see LICENSE file for details.
