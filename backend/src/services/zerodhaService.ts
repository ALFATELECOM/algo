import axios, { AxiosResponse } from 'axios';
import crypto from 'crypto';
import WebSocket from 'ws';

interface KiteConnectConfig {
  apiKey: string;
  apiSecret: string;
  accessToken?: string;
  baseUrl: string;
}

interface LoginSession {
  userId: string;
  accessToken: string;
  refreshToken: string;
  loginTime: string;
}

interface Order {
  orderId: string;
  symbol: string;
  exchange: string;
  orderType: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
  transactionType: 'BUY' | 'SELL';
  quantity: number;
  price?: number;
  triggerPrice?: number;
  product: 'CNC' | 'NRML' | 'MIS';
  validity: 'DAY' | 'IOC';
  status: string;
  timestamp: string;
}

interface Position {
  symbol: string;
  exchange: string;
  quantity: number;
  averagePrice: number;
  lastPrice: number;
  pnl: number;
  product: string;
}

interface Holding {
  symbol: string;
  exchange: string;
  quantity: number;
  averagePrice: number;
  lastPrice: number;
  pnl: number;
  product: string;
}

class ZerodhaService {
  private config: KiteConnectConfig;
  private loginSession: LoginSession | null = null;
  private wsConnection: WebSocket | null = null;

  constructor() {
    this.config = {
      apiKey: process.env.ZERODHA_API_KEY || '',
      apiSecret: process.env.ZERODHA_API_SECRET || '',
      baseUrl: 'https://api.kite.trade'
    };
  }

  // Generate login URL for Zerodha authentication
  getLoginUrl(): string {
    const baseUrl = 'https://kite.zerodha.com/connect/login';
    const params = new URLSearchParams({
      api_key: this.config.apiKey,
      v: '3'
    });
    return `${baseUrl}?${params.toString()}`;
  }

  // Generate access token from request token
  async generateSession(requestToken: string): Promise<LoginSession> {
    try {
      const checksum = crypto
        .createHash('sha256')
        .update(this.config.apiKey + requestToken + this.config.apiSecret)
        .digest('hex');

      const response: AxiosResponse = await axios.post(
        `${this.config.baseUrl}/session/token`,
        {
          api_key: this.config.apiKey,
          request_token: requestToken,
          checksum: checksum
        }
      );

      this.loginSession = {
        userId: response.data.data.user_id,
        accessToken: response.data.data.access_token,
        refreshToken: response.data.data.refresh_token,
        loginTime: new Date().toISOString()
      };

      this.config.accessToken = this.loginSession.accessToken;
      
      return this.loginSession;
    } catch (error: any) {
      throw new Error(`Failed to generate session: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get user profile
  async getProfile(): Promise<any> {
    return this.makeAuthenticatedRequest('/user/profile');
  }

  // Get account margins
  async getMargins(): Promise<any> {
    return this.makeAuthenticatedRequest('/user/margins');
  }

  // Place order
  async placeOrder(orderParams: {
    symbol: string;
    exchange: string;
    transactionType: 'BUY' | 'SELL';
    quantity: number;
    orderType: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
    product: 'CNC' | 'NRML' | 'MIS';
    price?: number;
    triggerPrice?: number;
    validity?: 'DAY' | 'IOC';
  }): Promise<{ orderId: string }> {
    try {
      const response = await this.makeAuthenticatedRequest('/orders/regular', 'POST', {
        tradingsymbol: orderParams.symbol,
        exchange: orderParams.exchange,
        transaction_type: orderParams.transactionType,
        quantity: orderParams.quantity,
        order_type: orderParams.orderType,
        product: orderParams.product,
        price: orderParams.price,
        trigger_price: orderParams.triggerPrice,
        validity: orderParams.validity || 'DAY'
      });

      return { orderId: response.data.order_id };
    } catch (error: any) {
      throw new Error(`Failed to place order: ${error.response?.data?.message || error.message}`);
    }
  }

  // Modify order
  async modifyOrder(orderId: string, params: any): Promise<{ orderId: string }> {
    try {
      const response = await this.makeAuthenticatedRequest(`/orders/regular/${orderId}`, 'PUT', params);
      return { orderId: response.data.order_id };
    } catch (error: any) {
      throw new Error(`Failed to modify order: ${error.response?.data?.message || error.message}`);
    }
  }

  // Cancel order
  async cancelOrder(orderId: string): Promise<{ orderId: string }> {
    try {
      const response = await this.makeAuthenticatedRequest(`/orders/regular/${orderId}`, 'DELETE');
      return { orderId: response.data.order_id };
    } catch (error: any) {
      throw new Error(`Failed to cancel order: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get orders
  async getOrders(): Promise<Order[]> {
    try {
      const response = await this.makeAuthenticatedRequest('/orders');
      return response.data.map((order: any) => ({
        orderId: order.order_id,
        symbol: order.tradingsymbol,
        exchange: order.exchange,
        orderType: order.order_type,
        transactionType: order.transaction_type,
        quantity: order.quantity,
        price: order.price,
        triggerPrice: order.trigger_price,
        product: order.product,
        validity: order.validity,
        status: order.status,
        timestamp: order.order_timestamp
      }));
    } catch (error: any) {
      throw new Error(`Failed to get orders: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get positions
  async getPositions(): Promise<{ net: Position[], day: Position[] }> {
    try {
      const response = await this.makeAuthenticatedRequest('/portfolio/positions');
      
      const mapPosition = (pos: any): Position => ({
        symbol: pos.tradingsymbol,
        exchange: pos.exchange,
        quantity: pos.quantity,
        averagePrice: pos.average_price,
        lastPrice: pos.last_price,
        pnl: pos.pnl,
        product: pos.product
      });

      return {
        net: response.data.net.map(mapPosition),
        day: response.data.day.map(mapPosition)
      };
    } catch (error: any) {
      throw new Error(`Failed to get positions: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get holdings
  async getHoldings(): Promise<Holding[]> {
    try {
      const response = await this.makeAuthenticatedRequest('/portfolio/holdings');
      return response.data.map((holding: any) => ({
        symbol: holding.tradingsymbol,
        exchange: holding.exchange,
        quantity: holding.quantity,
        averagePrice: holding.average_price,
        lastPrice: holding.last_price,
        pnl: holding.pnl,
        product: holding.product
      }));
    } catch (error: any) {
      throw new Error(`Failed to get holdings: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get quote for instruments
  async getQuote(instruments: string[]): Promise<any> {
    try {
      const instrumentString = instruments.join(',');
      return this.makeAuthenticatedRequest(`/quote?i=${instrumentString}`);
    } catch (error: any) {
      throw new Error(`Failed to get quote: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get LTP (Last Traded Price)
  async getLTP(instruments: string[]): Promise<any> {
    try {
      const instrumentString = instruments.join(',');
      return this.makeAuthenticatedRequest(`/quote/ltp?i=${instrumentString}`);
    } catch (error: any) {
      throw new Error(`Failed to get LTP: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get historical data
  async getHistoricalData(
    instrument: string,
    interval: string,
    fromDate: string,
    toDate: string
  ): Promise<any> {
    try {
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        interval: interval
      });
      
      return this.makeAuthenticatedRequest(`/instruments/historical/${instrument}?${params.toString()}`);
    } catch (error: any) {
      throw new Error(`Failed to get historical data: ${error.response?.data?.message || error.message}`);
    }
  }

  // Setup WebSocket for real-time data
  setupWebSocket(instruments: number[], callback: (data: any) => void): void {
    if (!this.config.accessToken) {
      throw new Error('Access token not available. Please login first.');
    }

    const wsUrl = `wss://ws.kite.trade/?api_key=${this.config.apiKey}&access_token=${this.config.accessToken}`;
    
    this.wsConnection = new WebSocket(wsUrl);

    this.wsConnection.on('open', () => {
      console.log('WebSocket connected to Kite');
      
      // Subscribe to instruments
      const message = {
        a: 'subscribe',
        v: instruments
      };
      this.wsConnection?.send(JSON.stringify(message));
    });

    this.wsConnection.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        callback(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    this.wsConnection.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    this.wsConnection.on('close', () => {
      console.log('WebSocket connection closed');
      // Implement reconnection logic if needed
    });
  }

  // Close WebSocket connection
  closeWebSocket(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }

  // Helper method for authenticated requests
  private async makeAuthenticatedRequest(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<any> {
    if (!this.config.accessToken) {
      throw new Error('Access token not available. Please login first.');
    }

    try {
      const config = {
        method,
        url: `${this.config.baseUrl}${endpoint}`,
        headers: {
          'Authorization': `token ${this.config.apiKey}:${this.config.accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: method !== 'GET' ? data : undefined
      };

      const response = await axios(config);
      return response.data;
    } catch (error: any) {
      throw new Error(`API request failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return !!this.loginSession && !!this.config.accessToken;
  }

  // Get current session info
  getSession(): LoginSession | null {
    return this.loginSession;
  }

  // Logout
  logout(): void {
    this.loginSession = null;
    this.config.accessToken = undefined;
    this.closeWebSocket();
  }
}

export default ZerodhaService;
