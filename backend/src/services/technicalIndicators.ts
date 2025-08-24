import * as TI from 'technicalindicators';
import { mean, standardDeviation } from 'simple-statistics';
import _ from 'lodash';

export interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: string;
}

export interface TechnicalAnalysis {
  rsi: number | null;
  macd: {
    macd: number | null;
    signal: number | null;
    histogram: number | null;
    trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  };
  bollinger: {
    upper: number | null;
    middle: number | null;
    lower: number | null;
    squeeze: boolean;
  };
  sma: {
    sma20: number | null;
    sma50: number | null;
    sma200: number | null;
    trend: 'UPTREND' | 'DOWNTREND' | 'SIDEWAYS';
  };
  ema: {
    ema12: number | null;
    ema26: number | null;
  };
  stochastic: {
    k: number | null;
    d: number | null;
    signal: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL';
  };
  adx: {
    adx: number | null;
    pdi: number | null;
    ndi: number | null;
    strength: 'WEAK' | 'STRONG' | 'VERY_STRONG';
  };
  williams: number | null;
  cci: number | null;
  atr: number | null;
  obv: number | null;
  momentum: number | null;
  roc: number | null;
  support: number | null;
  resistance: number | null;
  fibonacci: {
    retracement_236: number;
    retracement_382: number;
    retracement_500: number;
    retracement_618: number;
    retracement_786: number;
  };
  patterns: {
    doji: boolean;
    hammer: boolean;
    shootingStar: boolean;
    engulfing: boolean;
    harami: boolean;
  };
  signals: {
    overall: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
    confidence: number;
    reasons: string[];
  };
}

export class TechnicalIndicatorsService {
  
  // Calculate RSI (Relative Strength Index)
  calculateRSI(prices: number[], period: number = 14): number | null {
    if (prices.length < period) return null;
    return TI.RSI.calculate({ values: prices, period })[0] || null;
  }

  // Calculate MACD
  calculateMACD(prices: number[]): TechnicalAnalysis['macd'] {
    if (prices.length < 26) {
      return { macd: null, signal: null, histogram: null, trend: 'NEUTRAL' };
    }

    const macdResult = TI.MACD.calculate({
      values: prices,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false
    });

    const latest = macdResult[macdResult.length - 1];
    if (!latest) {
      return { macd: null, signal: null, histogram: null, trend: 'NEUTRAL' };
    }

    let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    if (latest.MACD > latest.signal && latest.histogram > 0) {
      trend = 'BULLISH';
    } else if (latest.MACD < latest.signal && latest.histogram < 0) {
      trend = 'BEARISH';
    }

    return {
      macd: latest.MACD,
      signal: latest.signal,
      histogram: latest.histogram,
      trend
    };
  }

  // Calculate Bollinger Bands
  calculateBollinger(prices: number[], period: number = 20, stdDev: number = 2): TechnicalAnalysis['bollinger'] {
    if (prices.length < period) {
      return { upper: null, middle: null, lower: null, squeeze: false };
    }

    const bb = TI.BollingerBands.calculate({
      period,
      values: prices,
      stdDev
    });

    const latest = bb[bb.length - 1];
    if (!latest) {
      return { upper: null, middle: null, lower: null, squeeze: false };
    }

    // Bollinger Band Squeeze detection
    const squeeze = (latest.upper - latest.lower) / latest.middle < 0.1;

    return {
      upper: latest.upper,
      middle: latest.middle,
      lower: latest.lower,
      squeeze
    };
  }

  // Calculate Simple Moving Averages
  calculateSMA(prices: number[]): TechnicalAnalysis['sma'] {
    const sma20 = prices.length >= 20 ? TI.SMA.calculate({ period: 20, values: prices }).slice(-1)[0] || null : null;
    const sma50 = prices.length >= 50 ? TI.SMA.calculate({ period: 50, values: prices }).slice(-1)[0] || null : null;
    const sma200 = prices.length >= 200 ? TI.SMA.calculate({ period: 200, values: prices }).slice(-1)[0] || null : null;

    let trend: 'UPTREND' | 'DOWNTREND' | 'SIDEWAYS' = 'SIDEWAYS';
    
    if (sma20 && sma50 && sma200) {
      if (sma20 > sma50 && sma50 > sma200) {
        trend = 'UPTREND';
      } else if (sma20 < sma50 && sma50 < sma200) {
        trend = 'DOWNTREND';
      }
    }

    return { sma20, sma50, sma200, trend };
  }

  // Calculate Exponential Moving Averages
  calculateEMA(prices: number[]): TechnicalAnalysis['ema'] {
    const ema12 = prices.length >= 12 ? TI.EMA.calculate({ period: 12, values: prices }).slice(-1)[0] || null : null;
    const ema26 = prices.length >= 26 ? TI.EMA.calculate({ period: 26, values: prices }).slice(-1)[0] || null : null;

    return { ema12, ema26 };
  }

  // Calculate Stochastic Oscillator
  calculateStochastic(candles: CandleData[]): TechnicalAnalysis['stochastic'] {
    if (candles.length < 14) {
      return { k: null, d: null, signal: 'NEUTRAL' };
    }

    const high = candles.map(c => c.high);
    const low = candles.map(c => c.low);
    const close = candles.map(c => c.close);

    const stoch = TI.Stochastic.calculate({
      high,
      low,
      close,
      period: 14,
      signalPeriod: 3
    });

    const latest = stoch[stoch.length - 1];
    if (!latest) {
      return { k: null, d: null, signal: 'NEUTRAL' };
    }

    let signal: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL' = 'NEUTRAL';
    if (latest.k > 80 && latest.d > 80) {
      signal = 'OVERBOUGHT';
    } else if (latest.k < 20 && latest.d < 20) {
      signal = 'OVERSOLD';
    }

    return {
      k: latest.k,
      d: latest.d,
      signal
    };
  }

  // Calculate ADX (Average Directional Index)
  calculateADX(candles: CandleData[]): TechnicalAnalysis['adx'] {
    if (candles.length < 14) {
      return { adx: null, pdi: null, ndi: null, strength: 'WEAK' };
    }

    const high = candles.map(c => c.high);
    const low = candles.map(c => c.low);
    const close = candles.map(c => c.close);

    const adx = TI.ADX.calculate({ high, low, close, period: 14 });
    const latest = adx[adx.length - 1];

    if (!latest) {
      return { adx: null, pdi: null, ndi: null, strength: 'WEAK' };
    }

    let strength: 'WEAK' | 'STRONG' | 'VERY_STRONG' = 'WEAK';
    if (latest.adx > 25) {
      strength = 'STRONG';
    }
    if (latest.adx > 50) {
      strength = 'VERY_STRONG';
    }

    return {
      adx: latest.adx,
      pdi: latest.pdi,
      ndi: latest.ndi,
      strength
    };
  }

  // Calculate Williams %R
  calculateWilliamsR(candles: CandleData[]): number | null {
    if (candles.length < 14) return null;

    const high = candles.map(c => c.high);
    const low = candles.map(c => c.low);
    const close = candles.map(c => c.close);

    const williams = TI.WilliamsR.calculate({ high, low, close, period: 14 });
    return williams[williams.length - 1] || null;
  }

  // Calculate CCI (Commodity Channel Index)
  calculateCCI(candles: CandleData[]): number | null {
    if (candles.length < 20) return null;

    const high = candles.map(c => c.high);
    const low = candles.map(c => c.low);
    const close = candles.map(c => c.close);

    const cci = TI.CCI.calculate({ high, low, close, period: 20 });
    return cci[cci.length - 1] || null;
  }

  // Calculate ATR (Average True Range)
  calculateATR(candles: CandleData[]): number | null {
    if (candles.length < 14) return null;

    const high = candles.map(c => c.high);
    const low = candles.map(c => c.low);
    const close = candles.map(c => c.close);

    const atr = TI.ATR.calculate({ high, low, close, period: 14 });
    return atr[atr.length - 1] || null;
  }

  // Calculate OBV (On Balance Volume)
  calculateOBV(candles: CandleData[]): number | null {
    if (candles.length < 2) return null;

    const close = candles.map(c => c.close);
    const volume = candles.map(c => c.volume);

    const obv = TI.OBV.calculate({ close, volume });
    return obv[obv.length - 1] || null;
  }

  // Calculate Support and Resistance Levels
  calculateSupportResistance(candles: CandleData[]): { support: number | null; resistance: number | null } {
    if (candles.length < 20) return { support: null, resistance: null };

    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const closes = candles.map(c => c.close);

    // Simple pivot point calculation
    const recentCandles = candles.slice(-20);
    const avgHigh = mean(recentCandles.map(c => c.high));
    const avgLow = mean(recentCandles.map(c => c.low));
    const avgClose = mean(recentCandles.map(c => c.close));

    const pivot = (avgHigh + avgLow + avgClose) / 3;
    const resistance = pivot + (avgHigh - avgLow);
    const support = pivot - (avgHigh - avgLow);

    return { support, resistance };
  }

  // Calculate Fibonacci Retracement Levels
  calculateFibonacci(high: number, low: number): TechnicalAnalysis['fibonacci'] {
    const diff = high - low;
    
    return {
      retracement_236: high - (diff * 0.236),
      retracement_382: high - (diff * 0.382),
      retracement_500: high - (diff * 0.500),
      retracement_618: high - (diff * 0.618),
      retracement_786: high - (diff * 0.786)
    };
  }

  // Detect Candlestick Patterns
  detectPatterns(candles: CandleData[]): TechnicalAnalysis['patterns'] {
    if (candles.length < 2) {
      return { doji: false, hammer: false, shootingStar: false, engulfing: false, harami: false };
    }

    const latest = candles[candles.length - 1];
    const previous = candles[candles.length - 2];

    // Doji pattern
    const doji = Math.abs(latest.close - latest.open) < (latest.high - latest.low) * 0.1;

    // Hammer pattern
    const bodySize = Math.abs(latest.close - latest.open);
    const lowerShadow = Math.min(latest.open, latest.close) - latest.low;
    const upperShadow = latest.high - Math.max(latest.open, latest.close);
    const hammer = lowerShadow > bodySize * 2 && upperShadow < bodySize;

    // Shooting Star pattern
    const shootingStar = upperShadow > bodySize * 2 && lowerShadow < bodySize;

    // Bullish Engulfing
    const bullishEngulfing = previous.close < previous.open && 
                           latest.close > latest.open &&
                           latest.open < previous.close &&
                           latest.close > previous.open;

    // Bearish Engulfing
    const bearishEngulfing = previous.close > previous.open && 
                           latest.close < latest.open &&
                           latest.open > previous.close &&
                           latest.close < previous.open;

    const engulfing = bullishEngulfing || bearishEngulfing;

    // Harami pattern (baby inside mother)
    const harami = (latest.open > previous.close && latest.close < previous.open) ||
                   (latest.open < previous.close && latest.close > previous.open);

    return { doji, hammer, shootingStar, engulfing, harami };
  }

  // Generate Trading Signals
  generateSignals(analysis: TechnicalAnalysis): TechnicalAnalysis['signals'] {
    const signals: string[] = [];
    let bullishScore = 0;
    let bearishScore = 0;

    // RSI signals
    if (analysis.rsi) {
      if (analysis.rsi < 30) {
        bullishScore += 2;
        signals.push('RSI oversold - potential buy signal');
      } else if (analysis.rsi > 70) {
        bearishScore += 2;
        signals.push('RSI overbought - potential sell signal');
      }
    }

    // MACD signals
    if (analysis.macd.trend === 'BULLISH') {
      bullishScore += 2;
      signals.push('MACD bullish crossover');
    } else if (analysis.macd.trend === 'BEARISH') {
      bearishScore += 2;
      signals.push('MACD bearish crossover');
    }

    // Moving Average signals
    if (analysis.sma.trend === 'UPTREND') {
      bullishScore += 1;
      signals.push('Moving averages in uptrend');
    } else if (analysis.sma.trend === 'DOWNTREND') {
      bearishScore += 1;
      signals.push('Moving averages in downtrend');
    }

    // Stochastic signals
    if (analysis.stochastic.signal === 'OVERSOLD') {
      bullishScore += 1;
      signals.push('Stochastic oversold');
    } else if (analysis.stochastic.signal === 'OVERBOUGHT') {
      bearishScore += 1;
      signals.push('Stochastic overbought');
    }

    // ADX strength
    if (analysis.adx.strength === 'STRONG' || analysis.adx.strength === 'VERY_STRONG') {
      if (analysis.adx.pdi && analysis.adx.ndi && analysis.adx.pdi > analysis.adx.ndi) {
        bullishScore += 1;
        signals.push('Strong upward momentum (ADX)');
      } else if (analysis.adx.pdi && analysis.adx.ndi && analysis.adx.ndi > analysis.adx.pdi) {
        bearishScore += 1;
        signals.push('Strong downward momentum (ADX)');
      }
    }

    // Pattern signals
    if (analysis.patterns.hammer) {
      bullishScore += 1;
      signals.push('Hammer candlestick pattern');
    }
    if (analysis.patterns.shootingStar) {
      bearishScore += 1;
      signals.push('Shooting star candlestick pattern');
    }

    // Determine overall signal
    const netScore = bullishScore - bearishScore;
    let overall: TechnicalAnalysis['signals']['overall'];
    
    if (netScore >= 4) {
      overall = 'STRONG_BUY';
    } else if (netScore >= 2) {
      overall = 'BUY';
    } else if (netScore <= -4) {
      overall = 'STRONG_SELL';
    } else if (netScore <= -2) {
      overall = 'SELL';
    } else {
      overall = 'NEUTRAL';
    }

    const confidence = Math.min(Math.abs(netScore) * 15, 95);

    return { overall, confidence, reasons: signals };
  }

  // Complete Technical Analysis
  async performCompleteAnalysis(candles: CandleData[]): Promise<TechnicalAnalysis> {
    const prices = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    
    const rsi = this.calculateRSI(prices);
    const macd = this.calculateMACD(prices);
    const bollinger = this.calculateBollinger(prices);
    const sma = this.calculateSMA(prices);
    const ema = this.calculateEMA(prices);
    const stochastic = this.calculateStochastic(candles);
    const adx = this.calculateADX(candles);
    const williams = this.calculateWilliamsR(candles);
    const cci = this.calculateCCI(candles);
    const atr = this.calculateATR(candles);
    const obv = this.calculateOBV(candles);
    const momentum = prices.length >= 10 ? prices[prices.length - 1] - prices[prices.length - 10] : null;
    const roc = prices.length >= 10 ? ((prices[prices.length - 1] / prices[prices.length - 10]) - 1) * 100 : null;
    
    const { support, resistance } = this.calculateSupportResistance(candles);
    const recentHigh = Math.max(...highs.slice(-20));
    const recentLow = Math.min(...lows.slice(-20));
    const fibonacci = this.calculateFibonacci(recentHigh, recentLow);
    const patterns = this.detectPatterns(candles);

    const analysis: TechnicalAnalysis = {
      rsi,
      macd,
      bollinger,
      sma,
      ema,
      stochastic,
      adx,
      williams,
      cci,
      atr,
      obv,
      momentum,
      roc,
      support,
      resistance,
      fibonacci,
      patterns,
      signals: { overall: 'NEUTRAL', confidence: 0, reasons: [] }
    };

    analysis.signals = this.generateSignals(analysis);

    return analysis;
  }
}

export default new TechnicalIndicatorsService();
