import express from 'express';
import { body, validationResult } from 'express-validator';
import ZerodhaService from '../services/zerodhaService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = express.Router();
const zerodhaService = new ZerodhaService();

// Rate limiting for trading operations
const tradingRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: { error: 'Too many trading requests, please try again later.' }
});

// Validation middleware
const validateOrder = [
  body('symbol').isString().notEmpty().withMessage('Symbol is required'),
  body('exchange').isIn(['NSE', 'BSE', 'MCX', 'NFO']).withMessage('Valid exchange required'),
  body('transactionType').isIn(['BUY', 'SELL']).withMessage('Transaction type must be BUY or SELL'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be positive integer'),
  body('orderType').isIn(['MARKET', 'LIMIT', 'SL', 'SL-M']).withMessage('Valid order type required'),
  body('product').isIn(['CNC', 'NRML', 'MIS']).withMessage('Valid product type required'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be positive'),
  body('triggerPrice').optional().isFloat({ min: 0 }).withMessage('Trigger price must be positive')
];

// Get trading status
router.get('/status', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const isLoggedIn = zerodhaService.isLoggedIn();
    const session = zerodhaService.getSession();
    
    res.json({
      status: 'operational',
      zerodhaConnected: isLoggedIn,
      session: session ? {
        userId: session.userId,
        loginTime: session.loginTime
      } : null,
      tradingEnabled: isLoggedIn,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get trading status',
      message: error.message
    });
  }
});

// Place order
router.post('/orders', authenticateToken, tradingRateLimit, validateOrder, async (req: AuthenticatedRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { symbol, exchange, transactionType, quantity, orderType, product, price, triggerPrice } = req.body;

    // Check if Zerodha is connected
    if (!zerodhaService.isLoggedIn()) {
      return res.status(401).json({
        error: 'Zerodha not connected',
        message: 'Please connect to Zerodha first'
      });
    }

    const order = await zerodhaService.placeOrder({
      symbol,
      exchange,
      transactionType,
      quantity,
      orderType,
      product,
      price,
      triggerPrice
    });

    res.json({
      success: true,
      orderId: order.orderId,
      message: 'Order placed successfully',
      orderDetails: {
        symbol,
        exchange,
        transactionType,
        quantity,
        orderType,
        product,
        price,
        triggerPrice
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(400).json({
      error: 'Failed to place order',
      message: error.message
    });
  }
});

// Get orders
router.get('/orders', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!zerodhaService.isLoggedIn()) {
      return res.status(401).json({
        error: 'Zerodha not connected',
        message: 'Please connect to Zerodha first'
      });
    }

    const orders = await zerodhaService.getOrders();
    
    res.json({
      orders,
      count: orders.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get orders',
      message: error.message
    });
  }
});

// Modify order
router.put('/orders/:orderId', authenticateToken, tradingRateLimit, async (req: AuthenticatedRequest, res) => {
  try {
    const { orderId } = req.params;
    const { quantity, price, orderType, triggerPrice } = req.body;

    if (!zerodhaService.isLoggedIn()) {
      return res.status(401).json({
        error: 'Zerodha not connected',
        message: 'Please connect to Zerodha first'
      });
    }

    const modifiedOrder = await zerodhaService.modifyOrder(orderId, {
      quantity,
      price,
      order_type: orderType,
      trigger_price: triggerPrice
    });

    res.json({
      success: true,
      orderId: modifiedOrder.orderId,
      message: 'Order modified successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(400).json({
      error: 'Failed to modify order',
      message: error.message
    });
  }
});

// Cancel order
router.delete('/orders/:orderId', authenticateToken, tradingRateLimit, async (req: AuthenticatedRequest, res) => {
  try {
    const { orderId } = req.params;

    if (!zerodhaService.isLoggedIn()) {
      return res.status(401).json({
        error: 'Zerodha not connected',
        message: 'Please connect to Zerodha first'
      });
    }

    const cancelledOrder = await zerodhaService.cancelOrder(orderId);

    res.json({
      success: true,
      orderId: cancelledOrder.orderId,
      message: 'Order cancelled successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(400).json({
      error: 'Failed to cancel order',
      message: error.message
    });
  }
});

// Get positions
router.get('/positions', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!zerodhaService.isLoggedIn()) {
      return res.status(401).json({
        error: 'Zerodha not connected',
        message: 'Please connect to Zerodha first'
      });
    }

    const positions = await zerodhaService.getPositions();
    
    // Calculate totals
    const totalPnL = positions.net.reduce((sum, pos) => sum + pos.pnl, 0);
    const totalValue = positions.net.reduce((sum, pos) => sum + (pos.quantity * pos.lastPrice), 0);

    res.json({
      positions,
      summary: {
        totalPnL,
        totalValue,
        netPositionsCount: positions.net.length,
        dayPositionsCount: positions.day.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get positions',
      message: error.message
    });
  }
});

// Get holdings
router.get('/holdings', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!zerodhaService.isLoggedIn()) {
      return res.status(401).json({
        error: 'Zerodha not connected',
        message: 'Please connect to Zerodha first'
      });
    }

    const holdings = await zerodhaService.getHoldings();
    
    // Calculate totals
    const totalValue = holdings.reduce((sum, holding) => sum + (holding.quantity * holding.lastPrice), 0);
    const totalPnL = holdings.reduce((sum, holding) => sum + holding.pnl, 0);
    const totalInvestment = holdings.reduce((sum, holding) => sum + (holding.quantity * holding.averagePrice), 0);

    res.json({
      holdings,
      summary: {
        totalValue,
        totalPnL,
        totalInvestment,
        totalReturns: totalPnL / totalInvestment * 100,
        holdingsCount: holdings.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get holdings',
      message: error.message
    });
  }
});

// Get quotes
router.post('/quotes', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { instruments } = req.body;

    if (!Array.isArray(instruments) || instruments.length === 0) {
      return res.status(400).json({
        error: 'Invalid instruments',
        message: 'Please provide an array of instruments'
      });
    }

    if (!zerodhaService.isLoggedIn()) {
      return res.status(401).json({
        error: 'Zerodha not connected',
        message: 'Please connect to Zerodha first'
      });
    }

    const quotes = await zerodhaService.getQuote(instruments);

    res.json({
      quotes,
      instrumentsCount: instruments.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get quotes',
      message: error.message
    });
  }
});

// Get LTP (Last Traded Price)
router.post('/ltp', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { instruments } = req.body;

    if (!Array.isArray(instruments) || instruments.length === 0) {
      return res.status(400).json({
        error: 'Invalid instruments',
        message: 'Please provide an array of instruments'
      });
    }

    if (!zerodhaService.isLoggedIn()) {
      return res.status(401).json({
        error: 'Zerodha not connected',
        message: 'Please connect to Zerodha first'
      });
    }

    const ltp = await zerodhaService.getLTP(instruments);

    res.json({
      ltp,
      instrumentsCount: instruments.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get LTP',
      message: error.message
    });
  }
});

// Get historical data
router.get('/historical/:instrument', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { instrument } = req.params;
    const { interval = 'day', from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        error: 'Missing parameters',
        message: 'Please provide from and to dates'
      });
    }

    if (!zerodhaService.isLoggedIn()) {
      return res.status(401).json({
        error: 'Zerodha not connected',
        message: 'Please connect to Zerodha first'
      });
    }

    const historicalData = await zerodhaService.getHistoricalData(
      instrument,
      interval as string,
      from as string,
      to as string
    );

    res.json({
      historicalData,
      instrument,
      interval,
      period: { from, to },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get historical data',
      message: error.message
    });
  }
});

// Get margins
router.get('/margins', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!zerodhaService.isLoggedIn()) {
      return res.status(401).json({
        error: 'Zerodha not connected',
        message: 'Please connect to Zerodha first'
      });
    }

    const margins = await zerodhaService.getMargins();

    res.json({
      margins,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get margins',
      message: error.message
    });
  }
});

export default router;
