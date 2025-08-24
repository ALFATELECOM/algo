import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import _ from 'lodash';
import cron from 'node-cron';

export interface MarketDataUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  bid: number;
  ask: number;
  high: number;
  low: number;
  timestamp: string;
}

export interface PortfolioUpdate {
  totalValue: number;
  dailyPnL: number;
  totalPnL: number;
  positions: Array<{
    symbol: string;
    quantity: number;
    currentPrice: number;
    pnl: number;
    pnlPercent: number;
  }>;
  timestamp: string;
}

export interface AlertData {
  id: string;
  type: 'PRICE_ALERT' | 'TECHNICAL_SIGNAL' | 'NEWS_ALERT' | 'RISK_WARNING' | 'ORDER_FILLED';
  symbol?: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  timestamp: string;
  data?: any;
}

export interface OrderUpdate {
  orderId: string;
  symbol: string;
  status: 'PENDING' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELLED' | 'REJECTED';
  filledQuantity: number;
  remainingQuantity: number;
  averagePrice: number;
  timestamp: string;
}

export interface TechnicalSignal {
  symbol: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  indicator: string;
  strength: number; // 0-100
  price: number;
  timestamp: string;
  description: string;
}

export class WebSocketService {
  private io: Server | null = null;
  private activeSubscriptions: Map<string, Set<string>> = new Map(); // socketId -> symbols
  private marketDataCache: Map<string, MarketDataUpdate> = new Map();
  private alertQueue: AlertData[] = [];
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();

  initialize(server: any) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "https://algo-three-red.vercel.app",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    this.startMarketDataSimulation();
    this.startScheduledUpdates();

    console.log('🔌 WebSocket service initialized');
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      console.log(`📱 Client connected: ${socket.id}`);

      // Send initial data
      this.sendInitialData(socket);

      // Handle symbol subscriptions
      socket.on('subscribe_symbols', (symbols: string[]) => {
        this.handleSymbolSubscription(socket, symbols);
      });

      // Handle unsubscribe
      socket.on('unsubscribe_symbols', (symbols: string[]) => {
        this.handleSymbolUnsubscription(socket, symbols);
      });

      // Handle portfolio subscription
      socket.on('subscribe_portfolio', () => {
        socket.join('portfolio_updates');
        console.log(`📊 Client ${socket.id} subscribed to portfolio updates`);
      });

      // Handle alerts subscription
      socket.on('subscribe_alerts', () => {
        socket.join('alerts');
        console.log(`🔔 Client ${socket.id} subscribed to alerts`);
        
        // Send queued alerts
        this.sendQueuedAlerts(socket);
      });

      // Handle technical signals subscription
      socket.on('subscribe_signals', () => {
        socket.join('technical_signals');
        console.log(`📈 Client ${socket.id} subscribed to technical signals`);
      });

      // Handle order updates subscription
      socket.on('subscribe_orders', () => {
        socket.join('order_updates');
        console.log(`📋 Client ${socket.id} subscribed to order updates`);
      });

      // Handle custom alerts setup
      socket.on('set_price_alert', (data: { symbol: string; price: number; condition: 'above' | 'below' }) => {
        this.setupPriceAlert(socket.id, data);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`📱 Client disconnected: ${socket.id}`);
        this.cleanupClientSubscriptions(socket.id);
      });

      // Handle ping for connection testing
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date().toISOString() });
      });
    });
  }

  private sendInitialData(socket: Socket) {
    // Send cached market data
    const initialMarketData = Array.from(this.marketDataCache.values());
    if (initialMarketData.length > 0) {
      socket.emit('initial_market_data', initialMarketData);
    }

    // Send initial portfolio data
    socket.emit('portfolio_update', this.generateMockPortfolioUpdate());

    // Send system status
    socket.emit('system_status', {
      status: 'operational',
      connectedClients: this.io?.sockets.sockets.size || 0,
      marketDataFeeds: initialMarketData.length,
      timestamp: new Date().toISOString()
    });
  }

  private handleSymbolSubscription(socket: Socket, symbols: string[]) {
    if (!this.activeSubscriptions.has(socket.id)) {
      this.activeSubscriptions.set(socket.id, new Set());
    }

    const clientSubscriptions = this.activeSubscriptions.get(socket.id)!;
    
    symbols.forEach(symbol => {
      clientSubscriptions.add(symbol);
      socket.join(`market_${symbol}`);
      
      // Send current data for the symbol if available
      const currentData = this.marketDataCache.get(symbol);
      if (currentData) {
        socket.emit('market_data_update', currentData);
      }
    });

    console.log(`📊 Client ${socket.id} subscribed to symbols: ${symbols.join(', ')}`);
    
    socket.emit('subscription_confirmed', {
      symbols,
      timestamp: new Date().toISOString()
    });
  }

  private handleSymbolUnsubscription(socket: Socket, symbols: string[]) {
    const clientSubscriptions = this.activeSubscriptions.get(socket.id);
    if (!clientSubscriptions) return;

    symbols.forEach(symbol => {
      clientSubscriptions.delete(symbol);
      socket.leave(`market_${symbol}`);
    });

    console.log(`📊 Client ${socket.id} unsubscribed from symbols: ${symbols.join(', ')}`);
  }

  private cleanupClientSubscriptions(socketId: string) {
    this.activeSubscriptions.delete(socketId);
    
    // Clear any client-specific intervals
    const interval = this.updateIntervals.get(socketId);
    if (interval) {
      clearInterval(interval);
      this.updateIntervals.delete(socketId);
    }
  }

  private sendQueuedAlerts(socket: Socket) {
    if (this.alertQueue.length > 0) {
      this.alertQueue.forEach(alert => {
        socket.emit('alert', alert);
      });
      // Clear queue after sending
      this.alertQueue = [];
    }
  }

  private setupPriceAlert(socketId: string, alertData: { symbol: string; price: number; condition: 'above' | 'below' }) {
    console.log(`🔔 Price alert set by ${socketId}: ${alertData.symbol} ${alertData.condition} ${alertData.price}`);
    
    // Store alert (in production, this would be persisted)
    // For now, just acknowledge
    this.io?.to(socketId).emit('alert_confirmed', {
      symbol: alertData.symbol,
      price: alertData.price,
      condition: alertData.condition,
      timestamp: new Date().toISOString()
    });
  }

  // Market data simulation
  private startMarketDataSimulation() {
    const symbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'HINDUNILVR', 'ITC', 'SBIN', 'BAJFINANCE', 'KOTAKBANK'];
    
    // Initialize with base prices
    symbols.forEach(symbol => {
      const basePrice = 1000 + Math.random() * 3000;
      this.marketDataCache.set(symbol, {
        symbol,
        price: basePrice,
        change: 0,
        changePercent: 0,
        volume: Math.floor(Math.random() * 1000000),
        bid: basePrice - 0.5,
        ask: basePrice + 0.5,
        high: basePrice * 1.02,
        low: basePrice * 0.98,
        timestamp: new Date().toISOString()
      });
    });

    // Update prices every 2 seconds
    setInterval(() => {
      this.updateMarketData(symbols);
    }, 2000);

    // Generate technical signals every 30 seconds
    setInterval(() => {
      this.generateTechnicalSignals(symbols);
    }, 30000);

    console.log('📈 Market data simulation started');
  }

  private updateMarketData(symbols: string[]) {
    if (!this.io) return;

    symbols.forEach(symbol => {
      const currentData = this.marketDataCache.get(symbol);
      if (!currentData) return;

      // Simulate price movement (random walk with slight upward bias)
      const changePercent = (Math.random() - 0.48) * 0.02; // Slight upward bias
      const newPrice = currentData.price * (1 + changePercent);
      const change = newPrice - currentData.price;
      
      // Update volume randomly
      const volumeChange = (Math.random() - 0.5) * 0.1;
      const newVolume = Math.max(10000, currentData.volume * (1 + volumeChange));

      const updatedData: MarketDataUpdate = {
        symbol,
        price: newPrice,
        change,
        changePercent: changePercent * 100,
        volume: Math.floor(newVolume),
        bid: newPrice - (0.5 + Math.random() * 0.5),
        ask: newPrice + (0.5 + Math.random() * 0.5),
        high: Math.max(currentData.high, newPrice),
        low: Math.min(currentData.low, newPrice),
        timestamp: new Date().toISOString()
      };

      this.marketDataCache.set(symbol, updatedData);

      // Broadcast to subscribed clients
      this.io.to(`market_${symbol}`).emit('market_data_update', updatedData);

      // Check for price alerts
      this.checkPriceAlerts(updatedData);
    });
  }

  private generateTechnicalSignals(symbols: string[]) {
    if (!this.io) return;

    // Generate random technical signals
    const indicators = ['RSI', 'MACD', 'Bollinger Bands', 'Moving Average', 'Stochastic'];
    const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
    const randomIndicator = indicators[Math.floor(Math.random() * indicators.length)];
    
    const signals: ('BUY' | 'SELL' | 'HOLD')[] = ['BUY', 'SELL', 'HOLD'];
    const signal = signals[Math.floor(Math.random() * signals.length)];
    
    const marketData = this.marketDataCache.get(randomSymbol);
    if (!marketData) return;

    const technicalSignal: TechnicalSignal = {
      symbol: randomSymbol,
      signal,
      indicator: randomIndicator,
      strength: 60 + Math.random() * 30, // 60-90% strength
      price: marketData.price,
      timestamp: new Date().toISOString(),
      description: `${randomIndicator} indicates ${signal} signal with ${(60 + Math.random() * 30).toFixed(0)}% confidence`
    };

    this.io.to('technical_signals').emit('technical_signal', technicalSignal);
    
    // Also send as alert if strong signal
    if (technicalSignal.strength > 80) {
      this.sendAlert({
        id: `signal_${Date.now()}`,
        type: 'TECHNICAL_SIGNAL',
        symbol: randomSymbol,
        title: `Strong ${signal} Signal`,
        message: technicalSignal.description,
        severity: signal === 'BUY' ? 'SUCCESS' : signal === 'SELL' ? 'WARNING' : 'INFO',
        timestamp: new Date().toISOString(),
        data: technicalSignal
      });
    }
  }

  private checkPriceAlerts(marketData: MarketDataUpdate) {
    // This would check against stored price alerts
    // For demo purposes, create random alerts
    if (Math.random() < 0.01) { // 1% chance of alert
      const alertTypes: AlertData['type'][] = ['PRICE_ALERT', 'NEWS_ALERT', 'RISK_WARNING'];
      const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      
      this.sendAlert({
        id: `alert_${Date.now()}`,
        type: alertType,
        symbol: marketData.symbol,
        title: `${marketData.symbol} Alert`,
        message: `${marketData.symbol} price moved to ₹${marketData.price.toFixed(2)} (${marketData.changePercent.toFixed(2)}%)`,
        severity: Math.abs(marketData.changePercent) > 2 ? 'WARNING' : 'INFO',
        timestamp: new Date().toISOString(),
        data: marketData
      });
    }
  }

  private startScheduledUpdates() {
    // Portfolio updates every 30 seconds
    setInterval(() => {
      this.broadcastPortfolioUpdate();
    }, 30000);

    // Market overview every minute
    setInterval(() => {
      this.broadcastMarketOverview();
    }, 60000);

    // System heartbeat every 5 minutes
    setInterval(() => {
      this.broadcastSystemHeartbeat();
    }, 300000);

    console.log('⏰ Scheduled updates started');
  }

  private broadcastPortfolioUpdate() {
    if (!this.io) return;

    const portfolioUpdate = this.generateMockPortfolioUpdate();
    this.io.to('portfolio_updates').emit('portfolio_update', portfolioUpdate);
  }

  private broadcastMarketOverview() {
    if (!this.io) return;

    const marketOverview = {
      indices: {
        nifty50: {
          value: 19500 + Math.random() * 200 - 100,
          change: Math.random() * 100 - 50,
          changePercent: Math.random() * 2 - 1
        },
        sensex: {
          value: 65000 + Math.random() * 1000 - 500,
          change: Math.random() * 500 - 250,
          changePercent: Math.random() * 1.5 - 0.75
        }
      },
      marketStatus: 'OPEN', // or 'CLOSED', 'PRE_OPEN', 'POST_CLOSE'
      timestamp: new Date().toISOString()
    };

    this.io.emit('market_overview', marketOverview);
  }

  private broadcastSystemHeartbeat() {
    if (!this.io) return;

    const heartbeat = {
      status: 'operational',
      connectedClients: this.io.sockets.sockets.size,
      activeSubscriptions: this.activeSubscriptions.size,
      marketDataSymbols: this.marketDataCache.size,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };

    this.io.emit('system_heartbeat', heartbeat);
  }

  private generateMockPortfolioUpdate(): PortfolioUpdate {
    const baseValue = 125000;
    const variation = Math.random() * 10000 - 5000;
    const totalValue = baseValue + variation;
    
    const dailyPnL = Math.random() * 2000 - 1000;
    const totalPnL = Math.random() * 15000 - 5000;

    const positions = [
      {
        symbol: 'RELIANCE',
        quantity: 50,
        currentPrice: 2580 + Math.random() * 40 - 20,
        pnl: Math.random() * 5000 - 2500,
        pnlPercent: Math.random() * 5 - 2.5
      },
      {
        symbol: 'TCS',
        quantity: 25,
        currentPrice: 4120 + Math.random() * 60 - 30,
        pnl: Math.random() * 3000 - 1500,
        pnlPercent: Math.random() * 4 - 2
      },
      {
        symbol: 'HDFCBANK',
        quantity: 30,
        currentPrice: 1685 + Math.random() * 30 - 15,
        pnl: Math.random() * 2000 - 1000,
        pnlPercent: Math.random() * 3 - 1.5
      }
    ];

    return {
      totalValue,
      dailyPnL,
      totalPnL,
      positions,
      timestamp: new Date().toISOString()
    };
  }

  // Public methods for sending updates
  sendAlert(alert: AlertData) {
    if (!this.io) {
      this.alertQueue.push(alert);
      return;
    }

    this.io.to('alerts').emit('alert', alert);
    console.log(`🔔 Alert sent: ${alert.title}`);
  }

  sendOrderUpdate(orderUpdate: OrderUpdate) {
    if (!this.io) return;

    this.io.to('order_updates').emit('order_update', orderUpdate);
    console.log(`📋 Order update sent: ${orderUpdate.orderId} - ${orderUpdate.status}`);

    // Also send as alert for important status changes
    if (orderUpdate.status === 'FILLED' || orderUpdate.status === 'REJECTED') {
      this.sendAlert({
        id: `order_${orderUpdate.orderId}`,
        type: 'ORDER_FILLED',
        symbol: orderUpdate.symbol,
        title: `Order ${orderUpdate.status}`,
        message: `Order ${orderUpdate.orderId} for ${orderUpdate.symbol} has been ${orderUpdate.status.toLowerCase()}`,
        severity: orderUpdate.status === 'FILLED' ? 'SUCCESS' : 'ERROR',
        timestamp: new Date().toISOString(),
        data: orderUpdate
      });
    }
  }

  broadcastMarketData(marketData: MarketDataUpdate) {
    if (!this.io) return;

    this.marketDataCache.set(marketData.symbol, marketData);
    this.io.to(`market_${marketData.symbol}`).emit('market_data_update', marketData);
  }

  getConnectedClients(): number {
    return this.io?.sockets.sockets.size || 0;
  }

  getActiveSubscriptions(): number {
    return this.activeSubscriptions.size;
  }

  // Shutdown gracefully
  shutdown() {
    if (this.io) {
      this.io.close();
      console.log('🔌 WebSocket service shut down');
    }

    // Clear all intervals
    this.updateIntervals.forEach(interval => clearInterval(interval));
    this.updateIntervals.clear();
  }
}

export default new WebSocketService();
