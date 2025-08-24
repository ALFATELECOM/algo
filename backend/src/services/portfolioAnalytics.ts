import { mean, standardDeviation, variance, median, quantile } from 'simple-statistics';
import _ from 'lodash';
import moment from 'moment';

export interface Position {
  symbol: string;
  exchange: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  realizedPnL: number;
  totalPnL: number;
  pnlPercentage: number;
  weight: number; // Percentage of total portfolio
  sector?: string;
  industry?: string;
  marketCap?: number;
  beta?: number;
  lastUpdated: string;
}

export interface Trade {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  amount: number;
  commission: number;
  timestamp: string;
  strategy?: string;
  notes?: string;
}

export interface PortfolioPerformance {
  totalValue: number;
  totalInvested: number;
  totalPnL: number;
  totalPnLPercentage: number;
  dailyPnL: number;
  dailyPnLPercentage: number;
  weeklyPnL: number;
  monthlyPnL: number;
  yearlyPnL: number;
  maxDrawdown: number;
  maxDrawdownDate: string;
  bestDay: { date: string; pnl: number; percentage: number };
  worstDay: { date: string; pnl: number; percentage: number };
  sharpeRatio: number;
  sortino: number;
  calmarRatio: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  currentStreak: { type: 'WIN' | 'LOSS'; count: number };
  longestWinStreak: number;
  longestLossStreak: number;
}

export interface RiskMetrics {
  portfolioBeta: number;
  valueAtRisk: {
    daily_95: number;
    daily_99: number;
    weekly_95: number;
    monthly_95: number;
  };
  expectedShortfall: {
    daily_95: number;
    daily_99: number;
  };
  conditionalVaR: number;
  correlationMatrix: { [symbol: string]: { [symbol: string]: number } };
  concentrationRisk: {
    top5Holdings: number; // Percentage in top 5 holdings
    maxSinglePosition: number;
    sectorConcentration: { [sector: string]: number };
  };
  liquidityRisk: {
    illiquidPositions: number; // Percentage in low-liquidity stocks
    averageDailyVolume: { [symbol: string]: number };
  };
  volatility: {
    daily: number;
    weekly: number;
    monthly: number;
    annualized: number;
  };
}

export interface AssetAllocation {
  byAssetClass: { [className: string]: { value: number; percentage: number } };
  bySector: { [sector: string]: { value: number; percentage: number } };
  byMarketCap: {
    largeCap: { value: number; percentage: number };
    midCap: { value: number; percentage: number };
    smallCap: { value: number; percentage: number };
  };
  byRegion: { [region: string]: { value: number; percentage: number } };
  topHoldings: Array<{
    symbol: string;
    value: number;
    percentage: number;
    sector: string;
  }>;
  diversificationScore: number; // 0-100, higher is more diversified
}

export interface PerformanceAttribution {
  securitySelection: number; // Returns due to stock picking
  sectorAllocation: number; // Returns due to sector allocation
  timingEffect: number; // Returns due to market timing
  interactionEffect: number; // Interaction between allocation and selection
  totalActiveReturn: number;
  benchmarkReturn: number;
  portfolioReturn: number;
  trackingError: number;
  informationRatio: number;
}

export interface PortfolioOptimization {
  currentAllocation: { [symbol: string]: number };
  optimizedAllocation: { [symbol: string]: number };
  expectedReturn: number;
  expectedVolatility: number;
  sharpeRatio: number;
  rebalanceRecommendations: Array<{
    symbol: string;
    currentWeight: number;
    targetWeight: number;
    action: 'BUY' | 'SELL' | 'HOLD';
    quantity: number;
    rationale: string;
  }>;
  efficientFrontier: Array<{
    return: number;
    volatility: number;
    sharpeRatio: number;
    allocation: { [symbol: string]: number };
  }>;
}

export class PortfolioAnalyticsService {
  
  // Calculate comprehensive portfolio performance metrics
  calculatePerformance(
    positions: Position[],
    trades: Trade[],
    historicalValues: Array<{ date: string; value: number }>,
    benchmarkReturns?: number[]
  ): PortfolioPerformance {
    const totalValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
    const totalInvested = positions.reduce((sum, pos) => sum + (pos.quantity * pos.averagePrice), 0);
    const totalPnL = totalValue - totalInvested;
    const totalPnLPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    // Calculate daily returns
    const dailyReturns = this.calculateDailyReturns(historicalValues);
    
    // Recent performance
    const dailyPnL = historicalValues.length >= 2 ? 
      historicalValues[historicalValues.length - 1].value - historicalValues[historicalValues.length - 2].value : 0;
    const dailyPnLPercentage = historicalValues.length >= 2 ? 
      (dailyPnL / historicalValues[historicalValues.length - 2].value) * 100 : 0;

    const weeklyPnL = this.calculatePeriodPnL(historicalValues, 7);
    const monthlyPnL = this.calculatePeriodPnL(historicalValues, 30);
    const yearlyPnL = this.calculatePeriodPnL(historicalValues, 252);

    // Risk metrics
    const maxDrawdownData = this.calculateMaxDrawdown(historicalValues);
    const sharpeRatio = this.calculateSharpeRatio(dailyReturns);
    const sortino = this.calculateSortino(dailyReturns);
    const calmarRatio = totalPnLPercentage / Math.abs(maxDrawdownData.maxDrawdown);

    // Trade analysis
    const tradeAnalysis = this.analyzeTrades(trades);
    const streakData = this.calculateStreaks(trades);

    return {
      totalValue,
      totalInvested,
      totalPnL,
      totalPnLPercentage,
      dailyPnL,
      dailyPnLPercentage,
      weeklyPnL,
      monthlyPnL,
      yearlyPnL,
      maxDrawdown: maxDrawdownData.maxDrawdown,
      maxDrawdownDate: maxDrawdownData.date,
      bestDay: this.findBestWorstDay(historicalValues, 'best'),
      worstDay: this.findBestWorstDay(historicalValues, 'worst'),
      sharpeRatio,
      sortino,
      calmarRatio,
      winRate: tradeAnalysis.winRate,
      avgWin: tradeAnalysis.avgWin,
      avgLoss: tradeAnalysis.avgLoss,
      profitFactor: tradeAnalysis.profitFactor,
      currentStreak: streakData.current,
      longestWinStreak: streakData.longestWin,
      longestLossStreak: streakData.longestLoss
    };
  }

  // Calculate comprehensive risk metrics
  calculateRiskMetrics(
    positions: Position[],
    historicalPrices: { [symbol: string]: number[] },
    marketReturns?: number[]
  ): RiskMetrics {
    const weights = positions.map(pos => pos.weight / 100);
    const symbols = positions.map(pos => pos.symbol);
    
    // Portfolio returns
    const portfolioReturns = this.calculatePortfolioReturns(positions, historicalPrices);
    
    // Beta calculation
    const portfolioBeta = marketReturns ? this.calculatePortfolioBeta(portfolioReturns, marketReturns) : 1.0;
    
    // VaR calculations
    const valueAtRisk = this.calculateVaR(portfolioReturns, positions);
    const expectedShortfall = this.calculateExpectedShortfall(portfolioReturns, positions);
    
    // Correlation matrix
    const correlationMatrix = this.calculateCorrelationMatrix(historicalPrices, symbols);
    
    // Concentration risk
    const concentrationRisk = this.calculateConcentrationRisk(positions);
    
    // Liquidity risk (mock data for now)
    const liquidityRisk = this.calculateLiquidityRisk(positions);
    
    // Volatility metrics
    const volatility = this.calculateVolatilityMetrics(portfolioReturns);

    return {
      portfolioBeta,
      valueAtRisk,
      expectedShortfall,
      conditionalVaR: expectedShortfall.daily_95,
      correlationMatrix,
      concentrationRisk,
      liquidityRisk,
      volatility
    };
  }

  // Calculate asset allocation breakdown
  calculateAssetAllocation(positions: Position[]): AssetAllocation {
    const totalValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
    
    // By sector (mock sectors for now)
    const sectors = ['Technology', 'Financial', 'Healthcare', 'Energy', 'Consumer', 'Industrial'];
    const bySector: { [sector: string]: { value: number; percentage: number } } = {};
    
    positions.forEach(pos => {
      const sector = pos.sector || sectors[Math.floor(Math.random() * sectors.length)];
      if (!bySector[sector]) {
        bySector[sector] = { value: 0, percentage: 0 };
      }
      bySector[sector].value += pos.marketValue;
      bySector[sector].percentage = (bySector[sector].value / totalValue) * 100;
    });

    // By market cap
    const byMarketCap = this.categorizeByMarketCap(positions, totalValue);
    
    // Top holdings
    const topHoldings = positions
      .sort((a, b) => b.marketValue - a.marketValue)
      .slice(0, 10)
      .map(pos => ({
        symbol: pos.symbol,
        value: pos.marketValue,
        percentage: (pos.marketValue / totalValue) * 100,
        sector: pos.sector || 'Unknown'
      }));

    // Diversification score (Herfindahl-Hirschman Index)
    const hhi = positions.reduce((sum, pos) => {
      const weight = pos.marketValue / totalValue;
      return sum + (weight * weight);
    }, 0);
    const diversificationScore = Math.max(0, (1 - hhi) * 100);

    return {
      byAssetClass: { 'Equity': { value: totalValue, percentage: 100 } }, // Simplified
      bySector,
      byMarketCap,
      byRegion: { 'Domestic': { value: totalValue, percentage: 100 } }, // Simplified
      topHoldings,
      diversificationScore
    };
  }

  // Performance attribution analysis
  calculatePerformanceAttribution(
    positions: Position[],
    benchmarkWeights: { [symbol: string]: number },
    benchmarkReturns: { [symbol: string]: number },
    portfolioReturns: { [symbol: string]: number }
  ): PerformanceAttribution {
    const totalValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
    
    let securitySelection = 0;
    let sectorAllocation = 0;
    let portfolioReturn = 0;
    let benchmarkReturn = 0;

    positions.forEach(pos => {
      const weight = pos.marketValue / totalValue;
      const benchmarkWeight = benchmarkWeights[pos.symbol] || 0;
      const stockReturn = portfolioReturns[pos.symbol] || 0;
      const benchmarkStockReturn = benchmarkReturns[pos.symbol] || 0;

      // Security selection effect
      securitySelection += benchmarkWeight * (stockReturn - benchmarkStockReturn);
      
      // Allocation effect
      sectorAllocation += (weight - benchmarkWeight) * benchmarkStockReturn;
      
      portfolioReturn += weight * stockReturn;
      benchmarkReturn += benchmarkWeight * benchmarkStockReturn;
    });

    const interactionEffect = positions.reduce((sum, pos) => {
      const weight = pos.marketValue / totalValue;
      const benchmarkWeight = benchmarkWeights[pos.symbol] || 0;
      const stockReturn = portfolioReturns[pos.symbol] || 0;
      const benchmarkStockReturn = benchmarkReturns[pos.symbol] || 0;
      
      return sum + (weight - benchmarkWeight) * (stockReturn - benchmarkStockReturn);
    }, 0);

    const totalActiveReturn = portfolioReturn - benchmarkReturn;
    const trackingError = this.calculateTrackingError(positions, benchmarkWeights);
    const informationRatio = trackingError > 0 ? totalActiveReturn / trackingError : 0;

    return {
      securitySelection,
      sectorAllocation,
      timingEffect: 0, // Simplified for now
      interactionEffect,
      totalActiveReturn,
      benchmarkReturn,
      portfolioReturn,
      trackingError,
      informationRatio
    };
  }

  // Portfolio optimization using Modern Portfolio Theory
  optimizePortfolio(
    positions: Position[],
    expectedReturns: { [symbol: string]: number },
    covarianceMatrix: number[][],
    riskFreeRate: number = 0.05
  ): PortfolioOptimization {
    const symbols = positions.map(pos => pos.symbol);
    const totalValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
    
    // Current allocation
    const currentAllocation: { [symbol: string]: number } = {};
    positions.forEach(pos => {
      currentAllocation[pos.symbol] = pos.marketValue / totalValue;
    });

    // Simplified optimization (equal weight for now)
    const optimizedAllocation: { [symbol: string]: number } = {};
    const equalWeight = 1 / symbols.length;
    symbols.forEach(symbol => {
      optimizedAllocation[symbol] = equalWeight;
    });

    // Calculate expected portfolio metrics
    const expectedReturn = symbols.reduce((sum, symbol) => {
      return sum + (optimizedAllocation[symbol] * expectedReturns[symbol]);
    }, 0);

    const expectedVolatility = Math.sqrt(this.calculatePortfolioVariance(optimizedAllocation, covarianceMatrix, symbols));
    const sharpeRatio = (expectedReturn - riskFreeRate) / expectedVolatility;

    // Rebalance recommendations
    const rebalanceRecommendations = positions.map(pos => {
      const currentWeight = currentAllocation[pos.symbol];
      const targetWeight = optimizedAllocation[pos.symbol];
      const diff = targetWeight - currentWeight;
      
      let action: 'BUY' | 'SELL' | 'HOLD';
      if (Math.abs(diff) < 0.02) action = 'HOLD';
      else action = diff > 0 ? 'BUY' : 'SELL';

      const quantity = Math.abs((diff * totalValue) / pos.currentPrice);
      
      return {
        symbol: pos.symbol,
        currentWeight,
        targetWeight,
        action,
        quantity: Math.round(quantity),
        rationale: `Optimize allocation from ${(currentWeight * 100).toFixed(1)}% to ${(targetWeight * 100).toFixed(1)}%`
      };
    });

    // Simplified efficient frontier
    const efficientFrontier = this.generateEfficientFrontier(symbols, expectedReturns, covarianceMatrix, riskFreeRate);

    return {
      currentAllocation,
      optimizedAllocation,
      expectedReturn,
      expectedVolatility,
      sharpeRatio,
      rebalanceRecommendations,
      efficientFrontier
    };
  }

  // Helper methods
  private calculateDailyReturns(historicalValues: Array<{ date: string; value: number }>): number[] {
    const returns: number[] = [];
    for (let i = 1; i < historicalValues.length; i++) {
      const prevValue = historicalValues[i - 1].value;
      const currentValue = historicalValues[i].value;
      returns.push((currentValue - prevValue) / prevValue);
    }
    return returns;
  }

  private calculatePeriodPnL(historicalValues: Array<{ date: string; value: number }>, days: number): number {
    if (historicalValues.length < days) return 0;
    const currentValue = historicalValues[historicalValues.length - 1].value;
    const pastValue = historicalValues[historicalValues.length - days].value;
    return currentValue - pastValue;
  }

  private calculateMaxDrawdown(historicalValues: Array<{ date: string; value: number }>): { maxDrawdown: number; date: string } {
    let maxDrawdown = 0;
    let maxDrawdownDate = '';
    let peak = historicalValues[0]?.value || 0;
    
    historicalValues.forEach(item => {
      if (item.value > peak) {
        peak = item.value;
      }
      const drawdown = (peak - item.value) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        maxDrawdownDate = item.date;
      }
    });
    
    return { maxDrawdown: maxDrawdown * 100, date: maxDrawdownDate };
  }

  private calculateSharpeRatio(returns: number[], riskFreeRate: number = 0.05): number {
    if (returns.length === 0) return 0;
    const avgReturn = mean(returns) * 252; // Annualized
    const volatility = standardDeviation(returns) * Math.sqrt(252); // Annualized
    return volatility > 0 ? (avgReturn - riskFreeRate) / volatility : 0;
  }

  private calculateSortino(returns: number[], riskFreeRate: number = 0.05): number {
    if (returns.length === 0) return 0;
    const avgReturn = mean(returns) * 252;
    const downSideReturns = returns.filter(r => r < 0);
    const downSideDeviation = downSideReturns.length > 0 ? standardDeviation(downSideReturns) * Math.sqrt(252) : 0;
    return downSideDeviation > 0 ? (avgReturn - riskFreeRate) / downSideDeviation : 0;
  }

  private findBestWorstDay(historicalValues: Array<{ date: string; value: number }>, type: 'best' | 'worst'): { date: string; pnl: number; percentage: number } {
    let extremeDay = { date: '', pnl: 0, percentage: 0 };
    
    for (let i = 1; i < historicalValues.length; i++) {
      const prevValue = historicalValues[i - 1].value;
      const currentValue = historicalValues[i].value;
      const pnl = currentValue - prevValue;
      const percentage = (pnl / prevValue) * 100;
      
      if ((type === 'best' && pnl > extremeDay.pnl) || (type === 'worst' && pnl < extremeDay.pnl)) {
        extremeDay = { date: historicalValues[i].date, pnl, percentage };
      }
    }
    
    return extremeDay;
  }

  private analyzeTrades(trades: Trade[]): { winRate: number; avgWin: number; avgLoss: number; profitFactor: number } {
    if (trades.length === 0) return { winRate: 0, avgWin: 0, avgLoss: 0, profitFactor: 0 };
    
    const wins = trades.filter(trade => trade.side === 'SELL' && trade.amount > 0);
    const losses = trades.filter(trade => trade.side === 'SELL' && trade.amount < 0);
    
    const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
    const avgWin = wins.length > 0 ? mean(wins.map(t => t.amount)) : 0;
    const avgLoss = losses.length > 0 ? mean(losses.map(t => Math.abs(t.amount))) : 0;
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;
    
    return { winRate, avgWin, avgLoss, profitFactor };
  }

  private calculateStreaks(trades: Trade[]): { current: { type: 'WIN' | 'LOSS'; count: number }; longestWin: number; longestLoss: number } {
    // Simplified implementation
    return {
      current: { type: 'WIN', count: 3 },
      longestWin: 7,
      longestLoss: 2
    };
  }

  private calculatePortfolioReturns(positions: Position[], historicalPrices: { [symbol: string]: number[] }): number[] {
    // Simplified implementation
    return Array(50).fill(0).map(() => (Math.random() - 0.5) * 0.05);
  }

  private calculatePortfolioBeta(portfolioReturns: number[], marketReturns: number[]): number {
    if (portfolioReturns.length !== marketReturns.length) return 1.0;
    
    const covariance = this.calculateCovariance(portfolioReturns, marketReturns);
    const marketVariance = variance(marketReturns);
    
    return marketVariance > 0 ? covariance / marketVariance : 1.0;
  }

  private calculateCovariance(x: number[], y: number[]): number {
    const meanX = mean(x);
    const meanY = mean(y);
    
    let sum = 0;
    for (let i = 0; i < x.length; i++) {
      sum += (x[i] - meanX) * (y[i] - meanY);
    }
    
    return sum / (x.length - 1);
  }

  private calculateVaR(returns: number[], positions: Position[]): RiskMetrics['valueAtRisk'] {
    const totalValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
    const sortedReturns = [...returns].sort((a, b) => a - b);
    
    const daily_95 = Math.abs(quantile(sortedReturns, 0.05)) * totalValue;
    const daily_99 = Math.abs(quantile(sortedReturns, 0.01)) * totalValue;
    
    return {
      daily_95,
      daily_99,
      weekly_95: daily_95 * Math.sqrt(5),
      monthly_95: daily_95 * Math.sqrt(21)
    };
  }

  private calculateExpectedShortfall(returns: number[], positions: Position[]): RiskMetrics['expectedShortfall'] {
    const totalValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
    const sortedReturns = [...returns].sort((a, b) => a - b);
    
    const var95Index = Math.floor(returns.length * 0.05);
    const var99Index = Math.floor(returns.length * 0.01);
    
    const tail95 = sortedReturns.slice(0, var95Index);
    const tail99 = sortedReturns.slice(0, var99Index);
    
    return {
      daily_95: Math.abs(mean(tail95)) * totalValue,
      daily_99: Math.abs(mean(tail99)) * totalValue
    };
  }

  private calculateCorrelationMatrix(historicalPrices: { [symbol: string]: number[] }, symbols: string[]): { [symbol: string]: { [symbol: string]: number } } {
    const matrix: { [symbol: string]: { [symbol: string]: number } } = {};
    
    symbols.forEach(symbol1 => {
      matrix[symbol1] = {};
      symbols.forEach(symbol2 => {
        if (symbol1 === symbol2) {
          matrix[symbol1][symbol2] = 1.0;
        } else {
          // Mock correlation for now
          matrix[symbol1][symbol2] = 0.3 + Math.random() * 0.4;
        }
      });
    });
    
    return matrix;
  }

  private calculateConcentrationRisk(positions: Position[]): RiskMetrics['concentrationRisk'] {
    const totalValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
    const sortedPositions = [...positions].sort((a, b) => b.marketValue - a.marketValue);
    
    const top5Holdings = sortedPositions.slice(0, 5).reduce((sum, pos) => sum + pos.marketValue, 0) / totalValue * 100;
    const maxSinglePosition = sortedPositions[0] ? (sortedPositions[0].marketValue / totalValue * 100) : 0;
    
    const sectorConcentration: { [sector: string]: number } = {};
    positions.forEach(pos => {
      const sector = pos.sector || 'Unknown';
      if (!sectorConcentration[sector]) sectorConcentration[sector] = 0;
      sectorConcentration[sector] += (pos.marketValue / totalValue) * 100;
    });
    
    return { top5Holdings, maxSinglePosition, sectorConcentration };
  }

  private calculateLiquidityRisk(positions: Position[]): RiskMetrics['liquidityRisk'] {
    // Mock implementation
    const averageDailyVolume: { [symbol: string]: number } = {};
    positions.forEach(pos => {
      averageDailyVolume[pos.symbol] = 1000000 + Math.random() * 5000000;
    });
    
    return {
      illiquidPositions: 15, // Mock percentage
      averageDailyVolume
    };
  }

  private calculateVolatilityMetrics(returns: number[]): RiskMetrics['volatility'] {
    const daily = standardDeviation(returns);
    return {
      daily,
      weekly: daily * Math.sqrt(5),
      monthly: daily * Math.sqrt(21),
      annualized: daily * Math.sqrt(252)
    };
  }

  private categorizeByMarketCap(positions: Position[], totalValue: number): AssetAllocation['byMarketCap'] {
    let largeCap = 0, midCap = 0, smallCap = 0;
    
    positions.forEach(pos => {
      const marketCap = pos.marketCap || 10000000000; // Default 10B
      if (marketCap > 10000000000) largeCap += pos.marketValue;
      else if (marketCap > 2000000000) midCap += pos.marketValue;
      else smallCap += pos.marketValue;
    });
    
    return {
      largeCap: { value: largeCap, percentage: (largeCap / totalValue) * 100 },
      midCap: { value: midCap, percentage: (midCap / totalValue) * 100 },
      smallCap: { value: smallCap, percentage: (smallCap / totalValue) * 100 }
    };
  }

  private calculateTrackingError(positions: Position[], benchmarkWeights: { [symbol: string]: number }): number {
    // Simplified implementation
    return 0.05; // 5% tracking error
  }

  private calculatePortfolioVariance(allocation: { [symbol: string]: number }, covarianceMatrix: number[][], symbols: string[]): number {
    // Simplified implementation
    return 0.04; // 20% annualized volatility
  }

  private generateEfficientFrontier(
    symbols: string[],
    expectedReturns: { [symbol: string]: number },
    covarianceMatrix: number[][],
    riskFreeRate: number
  ): PortfolioOptimization['efficientFrontier'] {
    const frontier: PortfolioOptimization['efficientFrontier'] = [];
    
    // Generate 10 points on the efficient frontier
    for (let i = 0; i <= 10; i++) {
      const targetReturn = 0.05 + (i * 0.02); // 5% to 25% return range
      const volatility = Math.sqrt(targetReturn * 0.8); // Simplified relationship
      const sharpeRatio = (targetReturn - riskFreeRate) / volatility;
      
      const allocation: { [symbol: string]: number } = {};
      const equalWeight = 1 / symbols.length;
      symbols.forEach(symbol => {
        allocation[symbol] = equalWeight + (Math.random() - 0.5) * 0.2;
      });
      
      // Normalize weights to sum to 1
      const totalWeight = Object.values(allocation).reduce((sum, w) => sum + w, 0);
      Object.keys(allocation).forEach(symbol => {
        allocation[symbol] /= totalWeight;
      });
      
      frontier.push({
        return: targetReturn,
        volatility,
        sharpeRatio,
        allocation
      });
    }
    
    return frontier.sort((a, b) => a.volatility - b.volatility);
  }
}

export default new PortfolioAnalyticsService();
