'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Globe, BarChart3 } from 'lucide-react';

interface MarketIndex {
  name: string;
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
  volume: string;
}

interface Sector {
  name: string;
  performance: number;
  topGainers: string[];
  topLosers: string[];
}

export default function MarketOverview() {
  const [indices] = useState<MarketIndex[]>([
    {
      name: 'S&P 500',
      symbol: 'SPX',
      value: 4567.89,
      change: 23.45,
      changePercent: 0.52,
      volume: '2.1B'
    },
    {
      name: 'NASDAQ',
      symbol: 'NDX',
      value: 14234.56,
      change: -12.34,
      changePercent: -0.09,
      volume: '3.2B'
    },
    {
      name: 'DOW JONES',
      symbol: 'DJI',
      value: 34567.89,
      change: 45.67,
      changePercent: 0.13,
      volume: '1.8B'
    },
    {
      name: 'RUSSELL 2000',
      symbol: 'RUT',
      value: 1890.12,
      change: -8.90,
      changePercent: -0.47,
      volume: '890M'
    }
  ]);

  const [sectors] = useState<Sector[]>([
    {
      name: 'Technology',
      performance: 2.3,
      topGainers: ['NVDA', 'AMD', 'TSLA'],
      topLosers: ['META', 'NFLX', 'PYPL']
    },
    {
      name: 'Healthcare',
      performance: -0.8,
      topGainers: ['JNJ', 'PFE', 'UNH'],
      topLosers: ['ABBV', 'TMO', 'DHR']
    },
    {
      name: 'Financial',
      performance: 1.2,
      topGainers: ['JPM', 'BAC', 'WFC'],
      topLosers: ['GS', 'MS', 'C']
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Market Indices */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Globe className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-gray-900">Market Indices</h3>
        </div>
        
        <div className="space-y-3">
          {indices.map((index) => (
            <div key={index.symbol} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-900">{index.name}</span>
                  <span className="text-sm text-gray-500">({index.symbol})</span>
                </div>
                <div className="text-sm text-gray-600">
                  Volume: {index.volume}
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  {index.value.toLocaleString()}
                </div>
                <div className={`text-sm flex items-center space-x-1 ${
                  index.change >= 0 ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {index.change >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>
                    {index.change >= 0 ? '+' : ''}{index.change.toFixed(2)} ({index.changePercent >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sector Performance */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-gray-900">Sector Performance</h3>
        </div>
        
        <div className="space-y-4">
          {sectors.map((sector) => (
            <div key={sector.name} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-900">{sector.name}</span>
                <span className={`text-sm font-medium ${
                  sector.performance >= 0 ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {sector.performance >= 0 ? '+' : ''}{sector.performance.toFixed(1)}%
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Top Gainers</p>
                  <div className="space-y-1">
                    {sector.topGainers.map((stock) => (
                      <div key={stock} className="flex items-center space-x-2">
                        <TrendingUp className="w-3 h-3 text-success-600" />
                        <span className="text-success-600 font-medium">{stock}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-gray-600 mb-1">Top Losers</p>
                  <div className="space-y-1">
                    {sector.topLosers.map((stock) => (
                      <div key={stock} className="flex items-center space-x-2">
                        <TrendingDown className="w-3 h-3 text-danger-600" />
                        <span className="text-danger-600 font-medium">{stock}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market Status */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-900">Market Status</h4>
            <p className="text-sm text-gray-600">Trading hours: 9:30 AM - 4:00 PM EST</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-success-600">Market Open</div>
            <div className="text-xs text-gray-500">2h 15m remaining</div>
          </div>
        </div>
      </div>
    </div>
  );
}
