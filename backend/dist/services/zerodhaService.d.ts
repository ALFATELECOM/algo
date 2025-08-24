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
declare class ZerodhaService {
    private config;
    private loginSession;
    private wsConnection;
    constructor();
    getLoginUrl(): string;
    generateSession(requestToken: string): Promise<LoginSession>;
    getProfile(): Promise<any>;
    getMargins(): Promise<any>;
    placeOrder(orderParams: {
        symbol: string;
        exchange: string;
        transactionType: 'BUY' | 'SELL';
        quantity: number;
        orderType: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
        product: 'CNC' | 'NRML' | 'MIS';
        price?: number;
        triggerPrice?: number;
        validity?: 'DAY' | 'IOC';
    }): Promise<{
        orderId: string;
    }>;
    modifyOrder(orderId: string, params: any): Promise<{
        orderId: string;
    }>;
    cancelOrder(orderId: string): Promise<{
        orderId: string;
    }>;
    getOrders(): Promise<Order[]>;
    getPositions(): Promise<{
        net: Position[];
        day: Position[];
    }>;
    getHoldings(): Promise<Holding[]>;
    getQuote(instruments: string[]): Promise<any>;
    getLTP(instruments: string[]): Promise<any>;
    getHistoricalData(instrument: string, interval: string, fromDate: string, toDate: string): Promise<any>;
    setupWebSocket(instruments: number[], callback: (data: any) => void): void;
    closeWebSocket(): void;
    private makeAuthenticatedRequest;
    isLoggedIn(): boolean;
    getSession(): LoginSession | null;
    logout(): void;
}
export default ZerodhaService;
//# sourceMappingURL=zerodhaService.d.ts.map