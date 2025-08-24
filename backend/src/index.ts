import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "https://algo-three-red.vercel.app",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || "https://algo-three-red.vercel.app",
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'AI Trading Backend',
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AI Trading System Backend API',
    status: 'operational',
    endpoints: [
      'GET /health - Health check',
      'GET /api/status - API status',
      'GET /api/portfolio - Portfolio data',
      'GET /api/trades - Trading history',
      'GET /api/market - Market data'
    ]
  });
});

// API Routes
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'operational',
    service: 'AI Trading Backend API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/portfolio', (req, res) => {
  res.json({
    totalValue: 125000,
    dailyPnL: 1250,
    totalPnL: 8500,
    cashBalance: 25000,
    positions: [
      { 
        symbol: 'AAPL', 
        quantity: 100, 
        currentPrice: 175.32, 
        avgCost: 170.00,
        pnl: 532,
        pnlPercent: 3.13
      },
      { 
        symbol: 'MSFT', 
        quantity: 50, 
        currentPrice: 338.11, 
        avgCost: 330.00,
        pnl: 405,
        pnlPercent: 2.46
      },
      { 
        symbol: 'GOOGL', 
        quantity: 25, 
        currentPrice: 2680.50, 
        avgCost: 2650.00,
        pnl: 762.50,
        pnlPercent: 1.15
      }
    ],
    lastUpdated: new Date().toISOString()
  });
});

app.get('/api/trades', (req, res) => {
  res.json([
    { 
      id: '1',
      symbol: 'AAPL', 
      type: 'BUY', 
      quantity: 100, 
      price: 175.32, 
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
      total: 17532
    },
    { 
      id: '2',
      symbol: 'MSFT', 
      type: 'SELL', 
      quantity: 50, 
      price: 338.11, 
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
      total: 16905.50
    },
    { 
      id: '3',
      symbol: 'GOOGL', 
      type: 'BUY', 
      quantity: 25, 
      price: 2680.50, 
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      total: 67012.50
    }
  ]);
});

app.get('/api/market', (req, res) => {
  res.json({
    indices: {
      'SP500': { value: 4378.32, change: 0.75, changePercent: 0.017 },
      'NASDAQ': { value: 13567.98, change: 1.23, changePercent: 0.091 },
      'DOW': { value: 34256.12, change: -0.45, changePercent: -0.013 }
    },
    topMovers: {
      gainers: [
        { symbol: 'NVDA', price: 456.78, change: 12.34, changePercent: 2.78 },
        { symbol: 'TSLA', price: 248.90, change: 8.45, changePercent: 3.52 }
      ],
      losers: [
        { symbol: 'META', price: 298.45, change: -5.67, changePercent: -1.86 },
        { symbol: 'AMZN', price: 134.21, change: -2.34, changePercent: -1.71 }
      ]
    },
    lastUpdated: new Date().toISOString()
  });
});

// AI Insights endpoint
app.get('/api/ai/insights', (req, res) => {
  res.json([
    {
      symbol: 'NVDA',
      action: 'BUY',
      confidence: 85,
      reason: 'Strong earnings expected, AI sector momentum continues',
      priority: 'high',
      targetPrice: 480.00,
      timeframe: '1-2 weeks'
    },
    {
      symbol: 'AMZN',
      action: 'HOLD',
      confidence: 70,
      reason: 'Approaching resistance level, wait for breakout confirmation',
      priority: 'medium',
      targetPrice: 145.00,
      timeframe: '2-4 weeks'
    },
    {
      symbol: 'META',
      action: 'SELL',
      confidence: 90,
      reason: 'Technical indicators suggest downtrend, regulatory concerns',
      priority: 'high',
      targetPrice: 280.00,
      timeframe: '1 week'
    }
  ]);
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send real-time portfolio updates
  const sendPortfolioUpdate = () => {
    socket.emit('portfolio-update', {
      totalValue: 125000 + Math.random() * 1000 - 500,
      dailyPnL: 1250 + Math.random() * 200 - 100,
      timestamp: new Date().toISOString()
    });
  };

  // Send updates every 30 seconds
  const portfolioInterval = setInterval(sendPortfolioUpdate, 30000);

  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`Client ${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    clearInterval(portfolioInterval);
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 10000;

server.listen(PORT, () => {
  console.log(`🚀 AI Trading Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

export { app, io };