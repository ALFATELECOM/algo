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
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'AI Trading Backend'
  });
});

// API Routes - Basic endpoints for now
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'operational',
    service: 'AI Trading Backend API',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/portfolio', (req, res) => {
  res.json({
    totalValue: 125000,
    dailyPnL: 1250,
    totalPnL: 8500,
    positions: [
      { symbol: 'AAPL', quantity: 100, currentPrice: 175.32, pnl: 250 },
      { symbol: 'MSFT', quantity: 50, currentPrice: 338.11, pnl: 180 }
    ]
  });
});

app.get('/api/trades', (req, res) => {
  res.json([
    { symbol: 'AAPL', type: 'BUY', quantity: 100, price: 175.32, time: '10:30 AM', status: 'completed' },
    { symbol: 'MSFT', type: 'SELL', quantity: 50, price: 338.11, time: '09:45 AM', status: 'completed' }
  ]);
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`Client ${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 AI Trading Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export { app, io };
