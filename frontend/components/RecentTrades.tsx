'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  total: number;
  status: 'completed' | 'pending' | 'cancelled' | 'failed';
  timestamp: Date;
  orderType: 'market' | 'limit';
}

export default function RecentTrades() {
  const [trades] = useState<Trade[]>([
    {
      id: '1',
      symbol: 'AAPL',
      side: 'buy',
      quantity: 100,
      price: 150.25,
      total: 15025,
      status: 'completed',
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      orderType: 'market'
    },
    {
      id: '2',
      symbol: 'GOOGL',
      side: 'sell',
      quantity: 25,
      price: 2850.75,
      total: 71268.75,
      status: 'completed',
      timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
      orderType: 'limit'
    },
    {
      id: '3',
      symbol: 'TSLA',
      side: 'buy',
      quantity: 50,
      price: 750.50,
      total: 37525,
      status: 'pending',
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      orderType: 'limit'
    },
    {
      id: '4',
      symbol: 'MSFT',
      side: 'sell',
      quantity: 75,
      price: 335.25,
      total: 25143.75,
      status: 'cancelled',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      orderType: 'market'
    },
    {
      id: '5',
      symbol: 'NVDA',
      side: 'buy',
      quantity: 30,
      price: 485.75,
      total: 14572.5,
      status: 'failed',
      timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
      orderType: 'market'
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-warning-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-danger-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success-100 text-success-700';
      case 'pending':
        return 'bg-warning-100 text-warning-700';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700';
      case 'failed':
        return 'bg-danger-100 text-danger-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="space-y-4">
      {/* Trade Summary */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="text-center p-3 bg-success-50 rounded-lg">
          <div className="text-2xl font-bold text-success-600">3</div>
          <div className="text-gray-600">Completed</div>
        </div>
        <div className="text-center p-3 bg-warning-50 rounded-lg">
          <div className="text-2xl font-bold text-warning-600">1</div>
          <div className="text-gray-600">Pending</div>
        </div>
        <div className="text-center p-3 bg-danger-50 rounded-lg">
          <div className="text-2xl font-bold text-danger-600">1</div>
          <div className="text-gray-600">Failed</div>
        </div>
      </div>

      {/* Trades List */}
      <div className="space-y-3">
        {trades.map((trade) => (
          <div key={trade.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {trade.side === 'buy' ? (
                  <TrendingUp className="w-4 h-4 text-success-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-danger-600" />
                )}
                <span className="font-semibold text-gray-900">{trade.symbol}</span>
              </div>
              
              <div className="text-sm text-gray-600">
                {trade.quantity} shares @ ${trade.price.toFixed(2)}
              </div>
              
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(trade.status)}`}>
                {trade.orderType.toUpperCase()}
              </span>
            </div>
            
            <div className="text-right">
              <div className="font-semibold text-gray-900">
                ${trade.total.toLocaleString()}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                {getStatusIcon(trade.status)}
                <span>{trade.status}</span>
              </div>
              <div className="text-xs text-gray-400">
                {formatTime(trade.timestamp)} • {formatTimeAgo(trade.timestamp)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex space-x-2">
        <button className="flex-1 btn-secondary text-sm">
          View All Trades
        </button>
        <button className="flex-1 btn-primary text-sm">
          Export History
        </button>
      </div>
    </div>
  );
}
