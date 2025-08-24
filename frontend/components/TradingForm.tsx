'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface TradingFormData {
  symbol: string;
  orderType: 'market' | 'limit';
  side: 'buy' | 'sell';
  quantity: number;
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
}

export default function TradingForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState({
    action: 'buy',
    confidence: 85,
    reasoning: 'Strong bullish momentum with RSI divergence and volume confirmation',
    targetPrice: 155.50,
    stopLoss: 148.20
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TradingFormData>({
    defaultValues: {
      symbol: 'AAPL',
      orderType: 'market',
      side: 'buy',
      quantity: 100,
    },
  });

  const watchSide = watch('side');
  const watchOrderType = watch('orderType');

  const onSubmit = async (data: TradingFormData) => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(
        `${data.side.toUpperCase()} order placed successfully for ${data.quantity} shares of ${data.symbol}`,
        { duration: 4000 }
      );
      
      // Reset form
      setValue('quantity', 100);
      setValue('price', undefined);
      setValue('stopLoss', undefined);
      setValue('takeProfit', undefined);
      
    } catch (error) {
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const applyAiSuggestion = () => {
    setValue('side', aiSuggestion.action as 'buy' | 'sell');
    setValue('takeProfit', aiSuggestion.targetPrice);
    setValue('stopLoss', aiSuggestion.stopLoss);
    toast.success('AI suggestion applied to form');
  };

  return (
    <div className="space-y-6">
      {/* AI Suggestion Card */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-gray-900">AI Trading Suggestion</h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Confidence:</span>
            <span className="text-sm font-semibold text-primary-600">{aiSuggestion.confidence}%</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              aiSuggestion.action === 'buy' 
                ? 'bg-success-100 text-success-700' 
                : 'bg-danger-100 text-danger-700'
            }`}>
              {aiSuggestion.action.toUpperCase()}
            </span>
            <span className="text-sm text-gray-600">
              Target: ${aiSuggestion.targetPrice}
            </span>
            <span className="text-sm text-gray-600">
              Stop Loss: ${aiSuggestion.stopLoss}
            </span>
          </div>
          <button
            onClick={applyAiSuggestion}
            className="btn-primary text-sm"
          >
            Apply Suggestion
          </button>
        </div>
        
        <p className="text-sm text-gray-600">{aiSuggestion.reasoning}</p>
      </div>

      {/* Trading Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Symbol and Order Type */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Symbol
              </label>
              <input
                type="text"
                {...register('symbol', { required: 'Symbol is required' })}
                className="input-field"
                placeholder="e.g., AAPL, GOOGL"
              />
              {errors.symbol && (
                <p className="text-danger-600 text-sm mt-1">{errors.symbol.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Type
              </label>
              <select
                {...register('orderType')}
                className="input-field"
              >
                <option value="market">Market</option>
                <option value="limit">Limit</option>
              </select>
            </div>
          </div>

          {/* Side and Quantity */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Side
              </label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setValue('side', 'buy')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg border-2 transition-colors ${
                    watchSide === 'buy'
                      ? 'border-success-500 bg-success-50 text-success-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-success-300'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Buy</span>
                </button>
                <button
                  type="button"
                  onClick={() => setValue('side', 'sell')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg border-2 transition-colors ${
                    watchSide === 'sell'
                      ? 'border-danger-500 bg-danger-50 text-danger-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-danger-300'
                  }`}
                >
                  <TrendingDown className="w-4 h-4" />
                  <span>Sell</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <input
                type="number"
                {...register('quantity', { 
                  required: 'Quantity is required',
                  min: { value: 1, message: 'Quantity must be at least 1' }
                })}
                className="input-field"
                placeholder="Number of shares"
              />
              {errors.quantity && (
                <p className="text-danger-600 text-sm mt-1">{errors.quantity.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Price Fields */}
        {watchOrderType === 'limit' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Limit Price
            </label>
            <input
              type="number"
              step="0.01"
              {...register('price', { 
                required: watchOrderType === 'limit' ? 'Price is required for limit orders' : false,
                min: { value: 0.01, message: 'Price must be greater than 0' }
              })}
              className="input-field"
              placeholder="Enter limit price"
            />
            {errors.price && (
              <p className="text-danger-600 text-sm mt-1">{errors.price.message}</p>
            )}
          </div>
        )}

        {/* Risk Management */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stop Loss (Optional)
            </label>
            <input
              type="number"
              step="0.01"
              {...register('stopLoss', { 
                min: { value: 0.01, message: 'Stop loss must be greater than 0' }
              })}
              className="input-field"
              placeholder="Stop loss price"
            />
            {errors.stopLoss && (
              <p className="text-danger-600 text-sm mt-1">{errors.stopLoss.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Take Profit (Optional)
            </label>
            <input
              type="number"
              step="0.01"
              {...register('takeProfit', { 
                min: { value: 0.01, message: 'Take profit must be greater than 0' }
              })}
              className="input-field"
              placeholder="Take profit price"
            />
            {errors.takeProfit && (
              <p className="text-danger-600 text-sm mt-1">{errors.takeProfit.message}</p>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Order Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Estimated Cost:</span>
              <span className="ml-2 font-medium">$15,000.00</span>
            </div>
            <div>
              <span className="text-gray-600">Commission:</span>
              <span className="ml-2 font-medium">$0.00</span>
            </div>
            <div>
              <span className="text-gray-600">Total:</span>
              <span className="ml-2 font-medium">$15,000.00</span>
            </div>
            <div>
              <span className="text-gray-600">Available Balance:</span>
              <span className="ml-2 font-medium text-success-600">$125,000.00</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <AlertTriangle className="w-4 h-4" />
            <span>Please review your order before submitting</span>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="spinner"></div>
                <span>Placing Order...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Place Order</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
