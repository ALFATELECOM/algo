import KiteConnect from 'kiteconnect';
import { EventEmitter } from 'events';
import winston from 'winston';

interface ZerodhaConfig {
  apiKey: string;
  apiSecret: string;
  redirectUri: string;
}

interface OrderParams {
  tradingsymbol: string;
  exchange: string;
  transaction_type: 'BUY' | 'SELL';
  quantity: number;
  product: 'CNC' | 'MIS' | 'NRML';
  order_type: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
  price?: number;
  trigger_price?: number;
  disclosed_quantity?: number;
  validity?: 'DAY' | 'IOC' | 'TTL';
  tag?: string;
}

interface Quote {
  instrument_token: number;
  timestamp: Date;
  last_price: number;
  last_quantity: number;
  average_price: number;
  volume: number;
  buy_quantity: number;
  sell_quantity: number;
  ohlc: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
  net_change: number;
  oi: number;
  oi_day_high: number;
  oi_day_low: number;
  depth: {
    buy: Array<{ price: number; quantity: number; orders: number }>;
    sell: Array<{ price: number; quantity: number; orders: number }>;
  };
}

export class ZerodhaService extends EventEmitter {
  private kite: KiteConnect;
  private logger: winston.Logger;
  private isConnected: boolean = false;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private lastTokenRefresh: Date | null = null;

  constructor(config: ZerodhaConfig) {
    super();
    
    this.kite = new KiteConnect({
      api_key: config.apiKey,
      api_secret: config.apiSecret,
      debug: process.env.NODE_ENV === 'development'
    });

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { service: 'zerodha-service' },
      transports: [
        new winston.transports.File({ filename: 'logs/zerodha.log' }),
        new winston.transports.Console()
      ]
    });

    // Set up event handlers
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.kite.on('connect', () => {
      this.isConnected = true;
      this.logger.info('Connected to Zerodha');
      this.emit('connected');
    });

    this.kite.on('disconnect', () => {
      this.isConnected = false;
      this.logger.warn('Disconnected from Zerodha');
      this.emit('disconnected');
    });

    this.kite.on('error', (error) => {
      this.logger.error('Zerodha error:', error);
      this.emit('error', error);
    });
  }

  /**
   * Initialize the service with access token
   */
  async initialize(accessToken: string, refreshToken?: string): Promise<void> {
    try {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken || null;
      this.lastTokenRefresh = new Date();

      await this.kite.setAccessToken(accessToken);
      this.isConnected = true;
      
      this.logger.info('Zerodha service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Zerodha service:', error);
      throw error;
    }
  }

  /**
   * Get login URL for user authentication
   */
  getLoginURL(): string {
    return this.kite.getLoginURL();
  }

  /**
   * Generate session from request token
   */
  async generateSession(requestToken: string, apiSecret: string): Promise<any> {
    try {
      const response = await this.kite.generateSession(requestToken, apiSecret);
      
      this.accessToken = response.access_token;
      this.refreshToken = response.refresh_token;
      this.lastTokenRefresh = new Date();

      await this.kite.setAccessToken(this.accessToken);
      this.isConnected = true;

      this.logger.info('Session generated successfully');
      return response;
    } catch (error) {
      this.logger.error('Failed to generate session:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<void> {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.kite.renewAccessToken(this.refreshToken, process.env.ZERODHA_API_SECRET!);
      
      this.accessToken = response.access_token;
      this.refreshToken = response.refresh_token;
      this.lastTokenRefresh = new Date();

      await this.kite.setAccessToken(this.accessToken);
      
      this.logger.info('Access token refreshed successfully');
    } catch (error) {
      this.logger.error('Failed to refresh access token:', error);
      throw error;
    }
  }

  /**
   * Check if token needs refresh
   */
  private shouldRefreshToken(): boolean {
    if (!this.lastTokenRefresh) return true;
    
    const now = new Date();
    const timeDiff = now.getTime() - this.lastTokenRefresh.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    // Refresh if token is older than 23 hours
    return hoursDiff > 23;
  }

  /**
   * Ensure valid session before making API calls
   */
  private async ensureValidSession(): Promise<void> {
    if (this.shouldRefreshToken()) {
      await this.refreshAccessToken();
    }
  }

  /**
   * Get user profile
   */
  async getProfile(): Promise<any> {
    try {
      await this.ensureValidSession();
      const profile = await this.kite.getProfile();
      return profile;
    } catch (error) {
      this.logger.error('Failed to get profile:', error);
      throw error;
    }
  }

  /**
   * Get user holdings
   */
  async getHoldings(): Promise<any[]> {
    try {
      await this.ensureValidSession();
      const holdings = await this.kite.getHoldings();
      return holdings;
    } catch (error) {
      this.logger.error('Failed to get holdings:', error);
      throw error;
    }
  }

  /**
   * Get user positions
   */
  async getPositions(): Promise<any> {
    try {
      await this.ensureValidSession();
      const positions = await this.kite.getPositions();
      return positions;
    } catch (error) {
      this.logger.error('Failed to get positions:', error);
      throw error;
    }
  }

  /**
   * Get user orders
   */
  async getOrders(): Promise<any[]> {
    try {
      await this.ensureValidSession();
      const orders = await this.kite.getOrders();
      return orders;
    } catch (error) {
      this.logger.error('Failed to get orders:', error);
      throw error;
    }
  }

  /**
   * Get user trades
   */
  async getTrades(): Promise<any[]> {
    try {
      await this.ensureValidSession();
      const trades = await this.kite.getTrades();
      return trades;
    } catch (error) {
      this.logger.error('Failed to get trades:', error);
      throw error;
    }
  }

  /**
   * Place order
   */
  async placeOrder(orderParams: OrderParams): Promise<any> {
    try {
      await this.ensureValidSession();
      const order = await this.kite.placeOrder('regular', orderParams);
      
      this.logger.info(`Order placed successfully: ${order}`);
      return order;
    } catch (error) {
      this.logger.error('Failed to place order:', error);
      throw error;
    }
  }

  /**
   * Modify order
   */
  async modifyOrder(orderId: string, orderParams: Partial<OrderParams>): Promise<any> {
    try {
      await this.ensureValidSession();
      const order = await this.kite.modifyOrder('regular', orderId, orderParams);
      
      this.logger.info(`Order modified successfully: ${orderId}`);
      return order;
    } catch (error) {
      this.logger.error('Failed to modify order:', error);
      throw error;
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string): Promise<any> {
    try {
      await this.ensureValidSession();
      const order = await this.kite.cancelOrder('regular', orderId);
      
      this.logger.info(`Order cancelled successfully: ${orderId}`);
      return order;
    } catch (error) {
      this.logger.error('Failed to cancel order:', error);
      throw error;
    }
  }

  /**
   * Get quote for a symbol
   */
  async getQuote(symbol: string): Promise<Quote> {
    try {
      await this.ensureValidSession();
      const quotes = await this.kite.getQuote(symbol);
      return quotes[symbol];
    } catch (error) {
      this.logger.error(`Failed to get quote for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get quotes for multiple symbols
   */
  async getQuotes(symbols: string[]): Promise<{ [key: string]: Quote }> {
    try {
      await this.ensureValidSession();
      const quotes = await this.kite.getQuote(symbols);
      return quotes;
    } catch (error) {
      this.logger.error('Failed to get quotes:', error);
      throw error;
    }
  }

  /**
   * Get historical data
   */
  async getHistoricalData(
    instrumentToken: number,
    from: Date,
    to: Date,
    interval: 'minute' | 'day' | '3minute' | '5minute' | '10minute' | '15minute' | '30minute' | '60minute'
  ): Promise<any[]> {
    try {
      await this.ensureValidSession();
      const data = await this.kite.getHistoricalData(
        instrumentToken,
        from,
        to,
        interval
      );
      return data;
    } catch (error) {
      this.logger.error('Failed to get historical data:', error);
      throw error;
    }
  }

  /**
   * Get instruments
   */
  async getInstruments(exchange?: string): Promise<any[]> {
    try {
      await this.ensureValidSession();
      const instruments = await this.kite.getInstruments(exchange);
      return instruments;
    } catch (error) {
      this.logger.error('Failed to get instruments:', error);
      throw error;
    }
  }

  /**
   * Get margins
   */
  async getMargins(orders?: any[]): Promise<any> {
    try {
      await this.ensureValidSession();
      const margins = await this.kite.getMargins(orders);
      return margins;
    } catch (error) {
      this.logger.error('Failed to get margins:', error);
      throw error;
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Disconnect from Zerodha
   */
  disconnect(): void {
    this.isConnected = false;
    this.accessToken = null;
    this.refreshToken = null;
    this.lastTokenRefresh = null;
    this.logger.info('Disconnected from Zerodha');
  }
}

// Export singleton instance
let zerodhaService: ZerodhaService | null = null;

export function initializeZerodha(): ZerodhaService {
  if (!zerodhaService) {
    zerodhaService = new ZerodhaService({
      apiKey: process.env.ZERODHA_API_KEY!,
      apiSecret: process.env.ZERODHA_API_SECRET!,
      redirectUri: process.env.ZERODHA_REDIRECT_URI!
    });
  }
  return zerodhaService;
}

export function getZerodhaService(): ZerodhaService {
  if (!zerodhaService) {
    throw new Error('Zerodha service not initialized');
  }
  return zerodhaService;
}
