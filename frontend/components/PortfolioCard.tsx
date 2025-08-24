'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';

interface PortfolioItem {
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  marketValue: number;
  pnl: number;
  pnlPercent: number;
}

export default function PortfolioCard() {
  const [portfolio] = useState<PortfolioItem[]>([
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      quantity: 100,
      avgPrice: 145.50,
      currentPrice: 150.25,
      marketValue: 15025,
      pnl: 475,
      pnlPercent: 3.26
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      quantity: 50,
      avgPrice: 2800.00,
      currentPrice: 2850.75,
      marketValue: 142537.5,
      pnl: 2537.5,
      pnlPercent: 1.81
    },
    {
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      quantity: 25,
      avgPrice: 800.00,
      currentPrice: 750.50,
      marketValue: 18762.5,
      pnl: -1237.5,
      pnlPercent: -6.19
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corp.',
      quantity: 75,
      avgPrice: 320.00,
      currentPrice: 335.25,
      marketValue: 25143.75,
      pnl: 1143.75,
      pnlPercent: 4.76
    }
  ]);

  const totalMarketValue = portfolio.reduce((sum, item) => sum + item.marketValue, 0);
  const totalPnL = portfolio.reduce((sum, item) => sum + item.pnl, 0);
  const totalPnLPercent = (totalPnL / (totalMarketValue - totalPnL)) * 100;

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Portfolio Summary</h3>
          <PieChart className="w-5 h-5 text-primary-600" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-xl font-bold text-gray-900">${totalMarketValue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total P&L</p>
            <div className="flex items-center space-x-1">
              <span className={`text-xl font-bold ${totalPnL >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                ${totalPnL.toLocaleString()}
              </span>
              <span className={`text-sm ${totalPnL >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                ({totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Holdings List */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Holdings</h3>
        <div className="space-y-3">
          {portfolio.map((item) => (
            <div key={item.symbol} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-900">{item.symbol}</span>
                  <span className="text-sm text-gray-500">{item.name}</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {item.quantity} shares @ ${item.avgPrice.toFixed(2)}
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  ${item.marketValue.toLocaleString()}
                </div>
                <div className={`text-sm flex items-center space-x-1 ${
                  item.pnl >= 0 ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {item.pnl >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>
                    {item.pnl >= 0 ? '+' : ''}${item.pnl.toFixed(0)} ({item.pnlPercent >= 0 ? '+' : ''}{item.pnlPercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex space-x-2">
        <button className="flex-1 btn-primary text-sm">
          <DollarSign className="w-4 h-4 mr-2" />
          Add Funds
        </button>
        <button className="flex-1 btn-secondary text-sm">
          <PieChart className="w-4 h-4 mr-2" />
          Rebalance
        </button>
      </div>
    </div>
  );
}
