'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  Settings, 
  Bell,
  Activity,
  Home
} from 'lucide-react';

export default function Dashboard() {
  const [isConnected, setIsConnected] = useState(false);
  const portfolioValue = 125000;
  const dailyPnL = 1250;
  const totalPnL = 8500;

  useEffect(() => {
    // Simulate connection status
    setIsConnected(true);
  }, []);

  const stats = [
    {
      title: 'Portfolio Value',
      value: `$${portfolioValue.toLocaleString()}`,
      change: '+2.5%',
      changeType: 'positive',
      icon: DollarSign,
    },
    {
      title: 'Daily PnL',
      value: `$${dailyPnL.toLocaleString()}`,
      change: '+1.2%',
      changeType: 'positive',
      icon: TrendingUp,
    },
    {
      title: 'Total PnL',
      value: `$${totalPnL.toLocaleString()}`,
      change: '+7.2%',
      changeType: 'positive',
      icon: BarChart3,
    },
    {
      title: 'Active Positions',
      value: '12',
      change: '+2',
      changeType: 'positive',
      icon: Activity,
    },
  ];

  const recentTrades = [
    { symbol: 'AAPL', type: 'BUY', quantity: 100, price: 175.32, time: '10:30 AM', status: 'completed' },
    { symbol: 'MSFT', type: 'SELL', quantity: 50, price: 338.11, time: '09:45 AM', status: 'completed' },
    { symbol: 'GOOGL', type: 'BUY', quantity: 25, price: 2680.50, time: '09:15 AM', status: 'pending' },
    { symbol: 'TSLA', type: 'SELL', quantity: 30, price: 248.42, time: '08:30 AM', status: 'completed' },
  ];

  const aiInsights = [
    {
      type: 'recommendation',
      symbol: 'NVDA',
      action: 'BUY',
      confidence: 85,
      reason: 'Strong earnings expected, AI sector momentum',
      priority: 'high'
    },
    {
      type: 'alert',
      symbol: 'AMZN',
      action: 'HOLD',
      confidence: 70,
      reason: 'Approaching resistance level, wait for breakout',
      priority: 'medium'
    },
    {
      type: 'warning',
      symbol: 'META',
      action: 'SELL',
      confidence: 90,
      reason: 'Technical indicators suggest downtrend',
      priority: 'high'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI Trading System
                </h1>
              </Link>
              <div className="ml-6 flex items-center">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md">
                <Settings className="w-5 h-5" />
              </button>
              <Link href="/" className="p-2 text-gray-400 hover:text-gray-600 rounded-md">
                <Home className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.title} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <stat.icon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Charts and Trading */}
          <div className="lg:col-span-2 space-y-8">
            {/* Trading Chart Placeholder */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Trading Chart</h2>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-md">1H</button>
                  <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md">1D</button>
                  <button className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-md">1W</button>
                  <button className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-md">1M</button>
                </div>
              </div>
              <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                  <p className="text-gray-600">Interactive Trading Chart</p>
                  <p className="text-sm text-gray-500">Real-time market data visualization</p>
                </div>
              </div>
            </div>

            {/* Trading Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Place Trade</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Symbol</label>
                  <input 
                    type="text" 
                    placeholder="e.g., AAPL"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                  <input 
                    type="number" 
                    placeholder="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order Type</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Market</option>
                    <option>Limit</option>
                    <option>Stop Loss</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                  <input 
                    type="number" 
                    placeholder="175.50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex space-x-4 mt-6">
                <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors">
                  BUY
                </button>
                <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-colors">
                  SELL
                </button>
              </div>
            </div>

            {/* Recent Trades */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Trades</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-sm font-medium text-gray-600">Symbol</th>
                      <th className="text-left py-2 text-sm font-medium text-gray-600">Type</th>
                      <th className="text-left py-2 text-sm font-medium text-gray-600">Quantity</th>
                      <th className="text-left py-2 text-sm font-medium text-gray-600">Price</th>
                      <th className="text-left py-2 text-sm font-medium text-gray-600">Time</th>
                      <th className="text-left py-2 text-sm font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTrades.map((trade, tradeIndex) => (
                      <tr key={tradeIndex} className="border-b border-gray-100">
                        <td className="py-3 font-medium">{trade.symbol}</td>
                        <td className={`py-3 ${trade.type === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>
                          {trade.type}
                        </td>
                        <td className="py-3">{trade.quantity}</td>
                        <td className="py-3">${trade.price}</td>
                        <td className="py-3 text-gray-600">{trade.time}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            trade.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {trade.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column - Portfolio and Insights */}
          <div className="space-y-8">
            {/* Portfolio Overview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Portfolio</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Value</span>
                  <span className="font-bold">${portfolioValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Today PnL</span>
                  <span className="font-bold text-green-600">+${dailyPnL.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total PnL</span>
                  <span className="font-bold text-green-600">+${totalPnL.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">AI Insights</h2>
              <div className="space-y-4">
                {aiInsights.map((insight, insightIndex) => (
                  <div key={insightIndex} className={`p-4 rounded-lg border-l-4 ${
                    insight.priority === 'high' 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-yellow-500 bg-yellow-50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{insight.symbol}</span>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        insight.action === 'BUY' 
                          ? 'bg-green-100 text-green-800'
                          : insight.action === 'SELL'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {insight.action}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{insight.reason}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Confidence: {insight.confidence}%</span>
                      <span className={`text-xs font-medium ${
                        insight.priority === 'high' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {insight.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Market Overview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Market Overview</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">SP 500</span>
                  <div className="text-right">
                    <div className="font-medium">4,378.32</div>
                    <div className="text-sm text-green-600">+0.75%</div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">NASDAQ</span>
                  <div className="text-right">
                    <div className="font-medium">13,567.98</div>
                    <div className="text-sm text-green-600">+1.23%</div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">DOW</span>
                  <div className="text-right">
                    <div className="font-medium">34,256.12</div>
                    <div className="text-sm text-red-600">-0.45%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}