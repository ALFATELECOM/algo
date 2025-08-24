'use client';

import { useState } from 'react';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface AIInsight {
  id: string;
  type: 'buy' | 'sell' | 'hold' | 'alert';
  symbol: string;
  confidence: number;
  reasoning: string;
  targetPrice?: number;
  stopLoss?: number;
  timestamp: Date;
  priority: 'high' | 'medium' | 'low';
}

export default function AIInsights() {
  const [insights] = useState<AIInsight[]>([
    {
      id: '1',
      type: 'buy',
      symbol: 'AAPL',
      confidence: 92,
      reasoning: 'Strong bullish momentum with RSI divergence and volume confirmation. Support level at $148.20.',
      targetPrice: 155.50,
      stopLoss: 148.20,
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      priority: 'high'
    },
    {
      id: '2',
      type: 'sell',
      symbol: 'TSLA',
      confidence: 78,
      reasoning: 'Bearish pattern forming with declining volume. Resistance at $760.00.',
      targetPrice: 720.00,
      stopLoss: 760.00,
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      priority: 'medium'
    },
    {
      id: '3',
      type: 'hold',
      symbol: 'GOOGL',
      confidence: 85,
      reasoning: 'Consolidation phase. Wait for breakout above $2,900 or breakdown below $2,800.',
      timestamp: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
      priority: 'medium'
    },
    {
      id: '4',
      type: 'alert',
      symbol: 'MSFT',
      confidence: 95,
      reasoning: 'High volatility expected due to earnings announcement tomorrow.',
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      priority: 'high'
    }
  ]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'buy':
        return <TrendingUp className="w-4 h-4 text-success-600" />;
      case 'sell':
        return <TrendingDown className="w-4 h-4 text-danger-600" />;
      case 'hold':
        return <Clock className="w-4 h-4 text-warning-600" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-warning-600" />;
      default:
        return <Brain className="w-4 h-4 text-primary-600" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'buy':
        return 'border-success-200 bg-success-50';
      case 'sell':
        return 'border-danger-200 bg-danger-50';
      case 'hold':
        return 'border-warning-200 bg-warning-50';
      case 'alert':
        return 'border-warning-200 bg-warning-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-danger-100 text-danger-700';
      case 'medium':
        return 'bg-warning-100 text-warning-700';
      case 'low':
        return 'bg-success-100 text-success-700';
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

  return (
    <div className="space-y-4">
      {/* AI Status */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-primary-600" />
          <span className="font-semibold text-gray-900">AI Analysis Active</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Real-time</span>
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-3">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getInsightIcon(insight.type)}
                <span className="font-semibold text-gray-900">{insight.symbol}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(insight.priority)}`}>
                  {insight.priority.toUpperCase()}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-primary-600">
                  {insight.confidence}%
                </div>
                <div className="text-xs text-gray-500">
                  {formatTimeAgo(insight.timestamp)}
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-700 mb-3">{insight.reasoning}</p>

            {(insight.targetPrice || insight.stopLoss) && (
              <div className="flex items-center space-x-4 text-sm">
                {insight.targetPrice && (
                  <div>
                    <span className="text-gray-600">Target:</span>
                    <span className="ml-1 font-semibold text-success-600">${insight.targetPrice}</span>
                  </div>
                )}
                {insight.stopLoss && (
                  <div>
                    <span className="text-gray-600">Stop Loss:</span>
                    <span className="ml-1 font-semibold text-danger-600">${insight.stopLoss}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex space-x-2">
        <button className="flex-1 btn-primary text-sm">
          <CheckCircle className="w-4 h-4 mr-2" />
          Apply All
        </button>
        <button className="flex-1 btn-secondary text-sm">
          <Brain className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>
    </div>
  );
}
