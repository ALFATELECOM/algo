import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

// Basic middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "https://algo-three-red.vercel.app",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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
      'GET /api/market - Market data',
      'GET /api/ai/insights - AI insights'
    ],
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'operational',
    service: 'AI Trading Backend API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0'
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
    },
    { 
      id: '4',
      symbol: 'TSLA', 
      type: 'SELL', 
      quantity: 30, 
      price: 248.42, 
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
      total: 7452.60
    }
  ]);
});

app.get('/api/market', (req, res) => {
  res.json({
    indices: {
      'SP500': { 
        name: 'S&P 500',
        value: 4378.32, 
        change: 32.75, 
        changePercent: 0.75 
      },
      'NASDAQ': { 
        name: 'NASDAQ',
        value: 13567.98, 
        change: 123.45, 
        changePercent: 0.91 
      },
      'DOW': { 
        name: 'Dow Jones',
        value: 34256.12, 
        change: -154.32, 
        changePercent: -0.45 
      }
    },
    topMovers: {
      gainers: [
        { symbol: 'NVDA', price: 456.78, change: 12.34, changePercent: 2.78 },
        { symbol: 'TSLA', price: 248.90, change: 8.45, changePercent: 3.52 },
        { symbol: 'AMD', price: 145.67, change: 5.23, changePercent: 3.72 }
      ],
      losers: [
        { symbol: 'META', price: 298.45, change: -5.67, changePercent: -1.86 },
        { symbol: 'AMZN', price: 134.21, change: -2.34, changePercent: -1.71 },
        { symbol: 'NFLX', price: 467.89, change: -8.91, changePercent: -1.87 }
      ]
    },
    lastUpdated: new Date().toISOString()
  });
});

// AI Insights endpoint
app.get('/api/ai/insights', (req, res) => {
  res.json([
    {
      id: '1',
      symbol: 'NVDA',
      action: 'BUY',
      confidence: 85,
      reason: 'Strong earnings expected, AI sector momentum continues with new GPU releases',
      priority: 'high',
      targetPrice: 480.00,
      currentPrice: 456.78,
      timeframe: '1-2 weeks',
      riskLevel: 'medium'
    },
    {
      id: '2',
      symbol: 'AMZN',
      action: 'HOLD',
      confidence: 70,
      reason: 'Approaching key resistance level at $145, wait for breakout confirmation',
      priority: 'medium',
      targetPrice: 145.00,
      currentPrice: 134.21,
      timeframe: '2-4 weeks',
      riskLevel: 'low'
    },
    {
      id: '3',
      symbol: 'META',
      action: 'SELL',
      confidence: 90,
      reason: 'Technical indicators suggest downtrend, regulatory concerns mounting',
      priority: 'high',
      targetPrice: 280.00,
      currentPrice: 298.45,
      timeframe: '1 week',
      riskLevel: 'high'
    },
    {
      id: '4',
      symbol: 'AAPL',
      action: 'HOLD',
      confidence: 75,
      reason: 'Solid fundamentals but trading sideways, wait for catalyst',
      priority: 'low',
      targetPrice: 180.00,
      currentPrice: 175.32,
      timeframe: '3-6 weeks',
      riskLevel: 'low'
    }
  ]);
});

// Trading signals endpoint
app.get('/api/signals', (req, res) => {
  res.json([
    {
      symbol: 'AAPL',
      signal: 'BUY',
      strength: 'STRONG',
      indicators: {
        rsi: 65.4,
        macd: 'BULLISH',
        sma20: 173.45,
        sma50: 168.20,
        volume: 'HIGH'
      }
    },
    {
      symbol: 'MSFT',
      signal: 'HOLD',
      strength: 'MODERATE',
      indicators: {
        rsi: 55.2,
        macd: 'NEUTRAL',
        sma20: 335.67,
        sma50: 332.10,
        volume: 'NORMAL'
      }
    }
  ]);
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /api/status',
      'GET /api/portfolio',
      'GET /api/trades',
      'GET /api/market',
      'GET /api/ai/insights',
      'GET /api/signals'
    ],
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 AI Trading Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'https://algo-three-red.vercel.app'}`);
  console.log(`⚡ Server started at: ${new Date().toISOString()}`);
});

export default app;