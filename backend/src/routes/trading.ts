import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { TradingController } from '@/controllers/tradingController';
import { authMiddleware } from '@/middleware/auth';

const router = Router();
const tradingController = new TradingController();

// Validation middleware
const validateOrder = [
  body('symbol').isString().notEmpty().withMessage('Symbol is required'),
  body('side').isIn(['buy', 'sell']).withMessage('Side must be buy or sell'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('orderType').isIn(['market', 'limit']).withMessage('Order type must be market or limit'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stopLoss').optional().isFloat({ min: 0 }).withMessage('Stop loss must be a positive number'),
  body('takeProfit').optional().isFloat({ min: 0 }).withMessage('Take profit must be a positive number'),
];

// Get all orders for user
router.get('/orders', authMiddleware, async (req, res) => {
  try {
    const orders = await tradingController.getOrders(req.user.id);
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific order
router.get('/orders/:orderId', authMiddleware, async (req, res) => {
  try {
    const order = await tradingController.getOrder(req.params.orderId, req.user.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Place new order
router.post('/orders', authMiddleware, validateOrder, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const order = await tradingController.placeOrder({
      ...req.body,
      userId: req.user.id
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cancel order
router.delete('/orders/:orderId', authMiddleware, async (req, res) => {
  try {
    const result = await tradingController.cancelOrder(req.params.orderId, req.user.id);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, message: 'Order cancelled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Modify order
router.put('/orders/:orderId', authMiddleware, validateOrder, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const order = await tradingController.modifyOrder(
      req.params.orderId,
      req.body,
      req.user.id
    );

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get trading history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 50, symbol, startDate, endDate } = req.query;
    const history = await tradingController.getTradingHistory({
      userId: req.user.id,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      symbol: symbol as string,
      startDate: startDate as string,
      endDate: endDate as string
    });
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get real-time quotes
router.get('/quotes/:symbol', async (req, res) => {
  try {
    const quote = await tradingController.getQuote(req.params.symbol);
    res.json({ success: true, data: quote });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get multiple quotes
router.post('/quotes/batch', async (req, res) => {
  try {
    const { symbols } = req.body;
    if (!Array.isArray(symbols)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Symbols must be an array' 
      });
    }
    const quotes = await tradingController.getBatchQuotes(symbols);
    res.json({ success: true, data: quotes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get order book
router.get('/orderbook/:symbol', async (req, res) => {
  try {
    const orderbook = await tradingController.getOrderBook(req.params.symbol);
    res.json({ success: true, data: orderbook });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get market depth
router.get('/depth/:symbol', async (req, res) => {
  try {
    const depth = await tradingController.getMarketDepth(req.params.symbol);
    res.json({ success: true, data: depth });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get trading statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const stats = await tradingController.getTradingStats(req.user.id);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get P&L analysis
router.get('/pnl', authMiddleware, async (req, res) => {
  try {
    const { period = '1d', symbol } = req.query;
    const pnl = await tradingController.getPnLAnalysis({
      userId: req.user.id,
      period: period as string,
      symbol: symbol as string
    });
    res.json({ success: true, data: pnl });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
