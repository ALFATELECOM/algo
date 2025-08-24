'use client';

import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TradingChartProps {
  symbol?: string;
  timeframe?: string;
}

export default function TradingChart({ symbol = 'AAPL', timeframe = '1D' }: TradingChartProps) {
  const [chartType, setChartType] = useState<'line' | 'candlestick'>('line');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Generate mock data
    const generateMockData = () => {
      const labels = [];
      const prices = [];
      const volumes = [];
      
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        labels.push(date.toLocaleDateString());
        
        // Generate realistic price movement
        const basePrice = 150;
        const randomChange = (Math.random() - 0.5) * 10;
        prices.push(basePrice + randomChange);
        
        // Generate volume data
        volumes.push(Math.floor(Math.random() * 1000000) + 500000);
      }
      
      return { labels, prices, volumes };
    };

    const mockData = generateMockData();
    
    const chartData = {
      labels: mockData.labels,
      datasets: [
        {
          label: 'Price',
          data: mockData.prices,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
      ],
    };

    setData(chartData);
  }, [symbol, timeframe]);

  const volumeData = {
    labels: data?.labels || [],
    datasets: [
      {
        label: 'Volume',
        data: data?.datasets?.[0]?.data?.map(() => Math.floor(Math.random() * 1000000) + 500000) || [],
        backgroundColor: 'rgba(156, 163, 175, 0.5)',
        borderColor: 'rgb(156, 163, 175)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 8,
          color: '#6b7280',
        },
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
        ticks: {
          color: '#6b7280',
          callback: function(value: any) {
            return '$' + value.toFixed(2);
          },
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  const volumeOptions = {
    ...options,
    scales: {
      ...options.scales,
      y: {
        ...options.scales.y,
        ticks: {
          color: '#6b7280',
          callback: function(value: any) {
            return (value / 1000000).toFixed(1) + 'M';
          },
        },
      },
    },
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chart Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-lg font-semibold text-gray-900">{symbol}</span>
          <span className="text-sm text-gray-500">${data.datasets[0].data[data.datasets[0].data.length - 1].toFixed(2)}</span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setChartType('line')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              chartType === 'line'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Line
          </button>
          <button
            onClick={() => setChartType('candlestick')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              chartType === 'candlestick'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Candlestick
          </button>
        </div>
      </div>

      {/* Main Chart */}
      <div className="h-80">
        <Line data={data} options={options} />
      </div>

      {/* Volume Chart */}
      <div className="h-32">
        <Bar data={volumeData} options={volumeOptions} />
      </div>

      {/* Chart Info */}
      <div className="grid grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Open</p>
          <p className="font-semibold">$149.85</p>
        </div>
        <div>
          <p className="text-gray-500">High</p>
          <p className="font-semibold text-success-600">$152.30</p>
        </div>
        <div>
          <p className="text-gray-500">Low</p>
          <p className="font-semibold text-danger-600">$148.20</p>
        </div>
        <div>
          <p className="text-gray-500">Volume</p>
          <p className="font-semibold">2.4M</p>
        </div>
      </div>
    </div>
  );
}
