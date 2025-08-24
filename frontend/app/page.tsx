'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Settings, 
  Bell,
  Activity,
  Wallet,
  Target,
  AlertTriangle
} from 'lucide-react';
import TradingChart from '@/components/TradingChart';
import PortfolioCard from '@/components/PortfolioCard';
import TradingForm from '@/components/TradingForm';
import MarketOverview from '@/components/MarketOverview';
import AIInsights from '@/components/AIInsights';
import RecentTrades from '@/components/RecentTrades';

export default function Dashboard() {
  const [isConnected, setIsConnected] = useState(false);
  const [portfolioValue, setPortfolioValue] = useState(125000);
  const [dailyPnL, setDailyPnL] = useState(1250);
  const [totalPnL, setTotalPnL] = useState(8500);

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
      title: 'Daily P&L',
      value: `$${dailyPnL.toLocaleString()}`,
      change: '+1.2%',
      changeType: 'positive',
      icon: TrendingUp,
    },
    {
      title: 'Total P&L',
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gradient">AI Trading System</h1>
              <div className="ml-4 flex items-center">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success-500' : 'bg-danger-500'} mr-2`}></div>
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    {stat.change}
                  </p>
                </div>
                <div className="p-3 bg-primary-50 rounded-lg">
                  <stat.icon className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Charts and Trading */}
          <div className="lg:col-span-2 space-y-8">
            {/* Trading Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Trading Chart</h2>
                <div className="flex space-x-2">
                  <button className="btn-secondary text-sm">1H</button>
                  <button className="btn-primary text-sm">1D</button>
                  <button className="btn-secondary text-sm">1W</button>
                  <button className="btn-secondary text-sm">1M</button>
                </div>
              </div>
              <TradingChart />
            </motion.div>

            {/* Trading Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Place Trade</h2>
              <TradingForm />
            </motion.div>

            {/* Recent Trades */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Trades</h2>
              <RecentTrades />
            </motion.div>
          </div>

          {/* Right Column - Portfolio and Insights */}
          <div className="space-y-8">
            {/* Portfolio Overview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="card"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Portfolio</h2>
              <PortfolioCard />
            </motion.div>

            {/* AI Insights */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="card"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">AI Insights</h2>
              <AIInsights />
            </motion.div>

            {/* Market Overview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="card"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Market Overview</h2>
              <MarketOverview />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
