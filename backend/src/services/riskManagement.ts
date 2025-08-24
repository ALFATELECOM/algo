import { mean, standardDeviation, quantile } from 'simple-statistics';
import _ from 'lodash';
import { Position } from './portfolioAnalytics';

export interface RiskLimits {
  maxPositionSize: number; // Maximum percentage of portfolio in single position
  maxSectorConcentration: number; // Maximum percentage in single sector
  maxDailyLoss: number; // Maximum daily loss (absolute)
  maxDailyLossPercent: number; // Maximum daily loss (percentage)
  maxDrawdown: number; // Maximum portfolio drawdown
  maxLeverage: number; // Maximum leverage ratio
  maxBeta: number; // Maximum portfolio beta
  maxVaR: number; // Maximum daily Value at Risk
  minCashReserve: number; // Minimum cash percentage
  maxCorrelation: number; // Maximum correlation between positions
}

export interface PositionSizingRule {
  method: 'FIXED_PERCENTAGE' | 'KELLY_CRITERION' | 'VOLATILITY_TARGET' | 'RISK_PARITY' | 'MOMENTUM_BASED';
  baseSize: number; // Base position size (percentage)
  volatilityTarget?: number; // For volatility targeting
  kellyFraction?: number; // Fraction of Kelly for Kelly criterion
  maxSize: number; // Maximum position size
  minSize: number; // Minimum position size
}

export interface RiskCheck {
  symbol: string;
  orderType: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  passed: boolean;
  violations: RiskViolation[];
  warnings: RiskWarning[];
  recommendedSize?: number;
  reasoning: string[];
}

export interface RiskViolation {
  type: 'POSITION_SIZE' | 'SECTOR_CONCENTRATION' | 'DAILY_LOSS' | 'DRAWDOWN' | 'LEVERAGE' | 'VAR' | 'CASH_RESERVE' | 'CORRELATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  currentValue: number;
  limitValue: number;
  impact: string;
}

export interface RiskWarning {
  type: 'VOLATILITY' | 'LIQUIDITY' | 'MOMENTUM' | 'CORRELATION' | 'MARKET_CONDITIONS';
  message: string;
  recommendation: string;
}

export interface StopLossRecommendation {
  symbol: string;
  currentPrice: number;
  stopLossPrice: number;
  stopLossPercent: number;
  method: 'ATR' | 'VOLATILITY' | 'SUPPORT_RESISTANCE' | 'PERCENTAGE';
  reasoning: string;
  takeProfitPrice?: number;
  riskRewardRatio: number;
}

export interface PositionSizing {
  symbol: string;
  recommendedSize: number; // Number of shares/units
  recommendedValue: number; // Dollar value
  positionPercent: number; // Percentage of portfolio
  method: string;
  riskAmount: number; // Amount at risk
  expectedReturn: number;
  riskRewardRatio: number;
  confidence: number; // Confidence in the sizing (0-100)
  reasoning: string[];
}

export interface MarketRegime {
  regime: 'BULL_MARKET' | 'BEAR_MARKET' | 'SIDEWAYS' | 'HIGH_VOLATILITY' | 'LOW_VOLATILITY' | 'CRISIS';
  confidence: number;
  characteristics: string[];
  riskAdjustments: {
    positionSizeMultiplier: number;
    maxDrawdownAdjustment: number;
    cashReserveAdjustment: number;
    correlationThreshold: number;
  };
}

export interface RiskReport {
  portfolioRisk: {
    currentVaR: number;
    expectedShortfall: number;
    maxDrawdown: number;
    beta: number;
    sharpeRatio: number;
    volatility: number;
  };
  concentrationRisk: {
    topPositions: Array<{ symbol: string; percentage: number; risk: 'LOW' | 'MEDIUM' | 'HIGH' }>;
    sectorConcentration: { [sector: string]: number };
    correlationClusters: Array<{ symbols: string[]; avgCorrelation: number }>;
  };
  liquidityRisk: {
    illiquidPositions: string[];
    averageDailyVolume: { [symbol: string]: number };
    liquidityScore: number; // 0-100
  };
  marketRisk: {
    regime: MarketRegime;
    volatilityRegime: 'LOW' | 'NORMAL' | 'HIGH' | 'EXTREME';
    trends: { [symbol: string]: 'UPTREND' | 'DOWNTREND' | 'SIDEWAYS' };
  };
  recommendations: {
    immediateActions: string[];
    positionAdjustments: Array<{
      symbol: string;
      action: 'REDUCE' | 'INCREASE' | 'CLOSE' | 'HEDGE';
      reason: string;
      urgency: 'LOW' | 'MEDIUM' | 'HIGH';
    }>;
    strategicChanges: string[];
  };
}

export class RiskManagementService {
  private defaultLimits: RiskLimits = {
    maxPositionSize: 10, // 10% max position
    maxSectorConcentration: 25, // 25% max sector
    maxDailyLoss: 10000, // $10,000 max daily loss
    maxDailyLossPercent: 2, // 2% max daily loss
    maxDrawdown: 15, // 15% max drawdown
    maxLeverage: 1.5, // 1.5x max leverage
    maxBeta: 1.3, // 1.3 max beta
    maxVaR: 5000, // $5,000 daily VaR
    minCashReserve: 5, // 5% min cash
    maxCorrelation: 0.7 // 70% max correlation
  };

  private defaultPositionSizing: PositionSizingRule = {
    method: 'VOLATILITY_TARGET',
    baseSize: 5, // 5% base position
    volatilityTarget: 0.15, // 15% volatility target
    maxSize: 10, // 10% max
    minSize: 1 // 1% min
  };

  // Main risk check function
  checkTradeRisk(
    symbol: string,
    orderType: 'BUY' | 'SELL',
    quantity: number,
    price: number,
    currentPositions: Position[],
    portfolioValue: number,
    limits: Partial<RiskLimits> = {},
    marketData?: any
  ): RiskCheck {
    const riskLimits = { ...this.defaultLimits, ...limits };
    const violations: RiskViolation[] = [];
    const warnings: RiskWarning[] = [];
    const reasoning: string[] = [];
    
    const orderValue = quantity * price;
    const currentPosition = currentPositions.find(p => p.symbol === symbol);
    
    // Calculate new position after trade
    let newQuantity = quantity;
    if (currentPosition) {
      newQuantity = orderType === 'BUY' ? 
        currentPosition.quantity + quantity : 
        currentPosition.quantity - quantity;
    } else if (orderType === 'SELL') {
      newQuantity = -quantity; // Short position
    }
    
    const newPositionValue = Math.abs(newQuantity * price);
    const newPositionPercent = (newPositionValue / portfolioValue) * 100;

    // Position size check
    if (newPositionPercent > riskLimits.maxPositionSize) {
      violations.push({
        type: 'POSITION_SIZE',
        severity: newPositionPercent > riskLimits.maxPositionSize * 1.5 ? 'CRITICAL' : 'HIGH',
        message: `Position size ${newPositionPercent.toFixed(1)}% exceeds limit of ${riskLimits.maxPositionSize}%`,
        currentValue: newPositionPercent,
        limitValue: riskLimits.maxPositionSize,
        impact: 'High concentration risk, potential for large losses'
      });
    }

    // Sector concentration check
    const sectorConcentration = this.calculateSectorConcentration(currentPositions, symbol, orderValue, portfolioValue);
    if (sectorConcentration > riskLimits.maxSectorConcentration) {
      violations.push({
        type: 'SECTOR_CONCENTRATION',
        severity: 'MEDIUM',
        message: `Sector concentration ${sectorConcentration.toFixed(1)}% exceeds limit of ${riskLimits.maxSectorConcentration}%`,
        currentValue: sectorConcentration,
        limitValue: riskLimits.maxSectorConcentration,
        impact: 'Sector-specific risk concentration'
      });
    }

    // Correlation check
    const correlationRisk = this.checkCorrelationRisk(currentPositions, symbol, riskLimits.maxCorrelation);
    if (correlationRisk.violation) {
      violations.push({
        type: 'CORRELATION',
        severity: 'MEDIUM',
        message: `High correlation with existing positions: ${correlationRisk.correlatedSymbols.join(', ')}`,
        currentValue: correlationRisk.maxCorrelation,
        limitValue: riskLimits.maxCorrelation,
        impact: 'Reduced diversification, increased systemic risk'
      });
    }

    // Liquidity warning
    if (marketData?.volume && orderValue > marketData.volume * 0.1) {
      warnings.push({
        type: 'LIQUIDITY',
        message: 'Order size may impact market price due to low liquidity',
        recommendation: 'Consider breaking order into smaller chunks'
      });
    }

    // Volatility warning
    if (marketData?.volatility && marketData.volatility > 0.5) {
      warnings.push({
        type: 'VOLATILITY',
        message: 'High volatility detected - increased risk',
        recommendation: 'Consider reducing position size or waiting for volatility to decrease'
      });
    }

    // Generate reasoning
    reasoning.push(`Order: ${orderType} ${quantity} shares of ${symbol} at $${price}`);
    reasoning.push(`New position: ${newQuantity} shares (${newPositionPercent.toFixed(1)}% of portfolio)`);
    
    if (violations.length === 0) {
      reasoning.push('Trade passes all risk checks');
    } else {
      reasoning.push(`${violations.length} risk violation(s) detected`);
    }

    // Calculate recommended size if violations exist
    let recommendedSize: number | undefined;
    if (violations.some(v => v.type === 'POSITION_SIZE')) {
      const maxAllowedValue = portfolioValue * (riskLimits.maxPositionSize / 100);
      const currentValue = currentPosition ? Math.abs(currentPosition.quantity * price) : 0;
      const availableValue = maxAllowedValue - currentValue;
      recommendedSize = Math.max(0, Math.floor(availableValue / price));
      reasoning.push(`Recommended size: ${recommendedSize} shares (within position limit)`);
    }

    return {
      symbol,
      orderType,
      quantity,
      price,
      passed: violations.length === 0,
      violations,
      warnings,
      recommendedSize,
      reasoning
    };
  }

  // Calculate optimal position size
  calculatePositionSize(
    symbol: string,
    currentPrice: number,
    expectedReturn: number,
    volatility: number,
    portfolioValue: number,
    currentPositions: Position[],
    rule: Partial<PositionSizingRule> = {},
    stopLossPercent?: number
  ): PositionSizing {
    const positionRule = { ...this.defaultPositionSizing, ...rule };
    const reasoning: string[] = [];
    let recommendedPercent = positionRule.baseSize;
    
    switch (positionRule.method) {
      case 'FIXED_PERCENTAGE':
        recommendedPercent = positionRule.baseSize;
        reasoning.push(`Fixed percentage method: ${positionRule.baseSize}%`);
        break;
        
      case 'VOLATILITY_TARGET':
        if (positionRule.volatilityTarget && volatility > 0) {
          recommendedPercent = (positionRule.volatilityTarget / volatility) * positionRule.baseSize;
          reasoning.push(`Volatility targeting: ${positionRule.volatilityTarget * 100}% target, ${volatility * 100}% actual`);
        }
        break;
        
      case 'KELLY_CRITERION':
        const kellyPercent = this.calculateKellyCriterion(expectedReturn, volatility);
        recommendedPercent = kellyPercent * (positionRule.kellyFraction || 0.25); // Use 25% of Kelly
        reasoning.push(`Kelly Criterion: ${kellyPercent.toFixed(1)}%, using ${((positionRule.kellyFraction || 0.25) * 100)}% of Kelly`);
        break;
        
      case 'RISK_PARITY':
        recommendedPercent = this.calculateRiskParitySize(currentPositions, volatility);
        reasoning.push(`Risk parity sizing based on volatility contribution`);
        break;
        
      case 'MOMENTUM_BASED':
        const momentumMultiplier = this.calculateMomentumMultiplier(expectedReturn);
        recommendedPercent = positionRule.baseSize * momentumMultiplier;
        reasoning.push(`Momentum-based sizing: ${momentumMultiplier.toFixed(2)}x multiplier`);
        break;
    }

    // Apply limits
    recommendedPercent = Math.max(positionRule.minSize, Math.min(positionRule.maxSize, recommendedPercent));
    
    const recommendedValue = portfolioValue * (recommendedPercent / 100);
    const recommendedSize = Math.floor(recommendedValue / currentPrice);
    
    // Calculate risk amount
    const riskAmount = stopLossPercent ? 
      recommendedValue * (stopLossPercent / 100) : 
      recommendedValue * 0.02; // Default 2% risk

    // Risk-reward ratio
    const potentialGain = recommendedValue * (expectedReturn || 0.1); // Default 10% expected return
    const riskRewardRatio = riskAmount > 0 ? potentialGain / riskAmount : 0;
    
    // Confidence score based on various factors
    const confidence = this.calculateSizingConfidence(
      symbol, 
      recommendedPercent, 
      volatility, 
      currentPositions,
      expectedReturn
    );

    reasoning.push(`Position size: ${recommendedPercent.toFixed(1)}% (${recommendedSize} shares)`);
    reasoning.push(`Risk amount: $${riskAmount.toFixed(2)} (${((riskAmount / portfolioValue) * 100).toFixed(2)}% of portfolio)`);
    reasoning.push(`Risk-reward ratio: ${riskRewardRatio.toFixed(2)}:1`);

    return {
      symbol,
      recommendedSize,
      recommendedValue,
      positionPercent: recommendedPercent,
      method: positionRule.method,
      riskAmount,
      expectedReturn: expectedReturn || 0.1,
      riskRewardRatio,
      confidence,
      reasoning
    };
  }

  // Calculate stop-loss recommendations
  calculateStopLoss(
    symbol: string,
    currentPrice: number,
    volatility: number,
    supportLevel?: number,
    atr?: number
  ): StopLossRecommendation {
    let stopLossPrice: number;
    let method: StopLossRecommendation['method'];
    let reasoning: string;

    // ATR-based stop loss
    if (atr) {
      stopLossPrice = currentPrice - (atr * 2);
      method = 'ATR';
      reasoning = `ATR-based stop loss: 2x ATR (${(atr * 2).toFixed(2)}) below current price`;
    }
    // Support level stop loss
    else if (supportLevel) {
      stopLossPrice = supportLevel * 0.98; // 2% below support
      method = 'SUPPORT_RESISTANCE';
      reasoning = `Support-based stop loss: 2% below support level at ${supportLevel.toFixed(2)}`;
    }
    // Volatility-based stop loss
    else if (volatility) {
      const volatilityMultiplier = Math.max(1.5, Math.min(3, volatility * 10)); // 1.5x to 3x based on volatility
      stopLossPrice = currentPrice * (1 - volatility * volatilityMultiplier);
      method = 'VOLATILITY';
      reasoning = `Volatility-based stop loss: ${(volatility * volatilityMultiplier * 100).toFixed(1)}% below current price`;
    }
    // Default percentage stop loss
    else {
      stopLossPrice = currentPrice * 0.95; // 5% stop loss
      method = 'PERCENTAGE';
      reasoning = 'Default 5% stop loss';
    }

    const stopLossPercent = ((currentPrice - stopLossPrice) / currentPrice) * 100;
    
    // Calculate take profit (2:1 risk-reward ratio)
    const riskAmount = currentPrice - stopLossPrice;
    const takeProfitPrice = currentPrice + (riskAmount * 2);
    const riskRewardRatio = 2.0;

    return {
      symbol,
      currentPrice,
      stopLossPrice,
      stopLossPercent,
      method,
      reasoning,
      takeProfitPrice,
      riskRewardRatio
    };
  }

  // Identify market regime
  identifyMarketRegime(
    marketData: {
      returns: number[];
      volatility: number;
      trendStrength: number;
      correlations: number[];
    }
  ): MarketRegime {
    const avgReturn = mean(marketData.returns);
    const vol = marketData.volatility;
    const trend = marketData.trendStrength;
    const avgCorrelation = mean(marketData.correlations);
    
    let regime: MarketRegime['regime'];
    let confidence = 0;
    const characteristics: string[] = [];
    
    // Crisis detection
    if (vol > 0.5 && avgCorrelation > 0.8) {
      regime = 'CRISIS';
      confidence = 90;
      characteristics.push('Extremely high volatility', 'High correlations across assets', 'Flight to quality');
    }
    // High volatility regime
    else if (vol > 0.3) {
      regime = 'HIGH_VOLATILITY';
      confidence = 80;
      characteristics.push('Elevated volatility', 'Uncertain market conditions');
    }
    // Bull market
    else if (avgReturn > 0.1 && trend > 0.6 && vol < 0.2) {
      regime = 'BULL_MARKET';
      confidence = 75;
      characteristics.push('Strong upward trend', 'Low volatility', 'Positive momentum');
    }
    // Bear market
    else if (avgReturn < -0.05 && trend < -0.4) {
      regime = 'BEAR_MARKET';
      confidence = 75;
      characteristics.push('Downward trend', 'Negative sentiment', 'Risk aversion');
    }
    // Low volatility
    else if (vol < 0.1) {
      regime = 'LOW_VOLATILITY';
      confidence = 70;
      characteristics.push('Low volatility', 'Stable conditions', 'Complacency risk');
    }
    // Sideways market
    else {
      regime = 'SIDEWAYS';
      confidence = 60;
      characteristics.push('Range-bound market', 'Lack of clear direction');
    }

    // Risk adjustments based on regime
    const riskAdjustments = this.getRegimeRiskAdjustments(regime);

    return {
      regime,
      confidence,
      characteristics,
      riskAdjustments
    };
  }

  // Generate comprehensive risk report
  generateRiskReport(
    positions: Position[],
    portfolioValue: number,
    marketData: any
  ): RiskReport {
    // Portfolio risk metrics
    const portfolioRisk = this.calculatePortfolioRisk(positions, portfolioValue);
    
    // Concentration risk
    const concentrationRisk = this.analyzeConcentrationRisk(positions, portfolioValue);
    
    // Liquidity risk
    const liquidityRisk = this.analyzeLiquidityRisk(positions);
    
    // Market risk
    const marketRisk = this.analyzeMarketRisk(positions, marketData);
    
    // Generate recommendations
    const recommendations = this.generateRiskRecommendations(
      portfolioRisk,
      concentrationRisk,
      liquidityRisk,
      marketRisk
    );

    return {
      portfolioRisk,
      concentrationRisk,
      liquidityRisk,
      marketRisk,
      recommendations
    };
  }

  // Helper methods
  private calculateSectorConcentration(
    positions: Position[],
    newSymbol: string,
    newOrderValue: number,
    portfolioValue: number
  ): number {
    // Mock sector assignment for now
    const sectors = ['Technology', 'Financial', 'Healthcare', 'Energy'];
    const newSector = sectors[Math.floor(Math.random() * sectors.length)];
    
    const sectorValue = positions
      .filter(p => (p.sector || newSector) === newSector)
      .reduce((sum, p) => sum + p.marketValue, 0) + newOrderValue;
    
    return (sectorValue / portfolioValue) * 100;
  }

  private checkCorrelationRisk(
    positions: Position[],
    newSymbol: string,
    maxCorrelation: number
  ): { violation: boolean; correlatedSymbols: string[]; maxCorrelation: number } {
    // Mock correlation check
    const correlatedSymbols: string[] = [];
    let maxCorr = 0;
    
    positions.forEach(pos => {
      const correlation = 0.3 + Math.random() * 0.4; // Mock correlation
      if (correlation > maxCorrelation) {
        correlatedSymbols.push(pos.symbol);
        maxCorr = Math.max(maxCorr, correlation);
      }
    });

    return {
      violation: correlatedSymbols.length > 0,
      correlatedSymbols,
      maxCorrelation: maxCorr
    };
  }

  private calculateKellyCriterion(expectedReturn: number, volatility: number): number {
    if (volatility === 0) return 0;
    const winRate = Math.max(0.5, Math.min(0.8, 0.55 + expectedReturn)); // Estimate win rate
    const avgWin = expectedReturn / winRate;
    const avgLoss = expectedReturn / (winRate - 1);
    return Math.max(0, (winRate * avgWin - (1 - winRate) * Math.abs(avgLoss)) / avgWin * 100);
  }

  private calculateRiskParitySize(positions: Position[], volatility: number): number {
    if (positions.length === 0) return 5; // Default for first position
    
    const totalRiskBudget = 100; // 100% risk budget
    const targetRiskContribution = totalRiskBudget / (positions.length + 1);
    
    // Inverse volatility weighting approximation
    const inverseVol = 1 / volatility;
    const totalInverseVol = positions.reduce((sum, pos) => sum + (1 / (pos.beta || 1)), 0) + inverseVol;
    
    return (inverseVol / totalInverseVol) * 100;
  }

  private calculateMomentumMultiplier(expectedReturn: number): number {
    // Higher expected returns get larger position sizes
    return Math.max(0.5, Math.min(2, 1 + expectedReturn * 2));
  }

  private calculateSizingConfidence(
    symbol: string,
    positionPercent: number,
    volatility: number,
    positions: Position[],
    expectedReturn: number
  ): number {
    let confidence = 70; // Base confidence
    
    // Reduce confidence for high volatility
    if (volatility > 0.3) confidence -= 20;
    else if (volatility < 0.1) confidence += 10;
    
    // Reduce confidence for large positions
    if (positionPercent > 8) confidence -= 15;
    else if (positionPercent < 3) confidence += 5;
    
    // Reduce confidence for low expected returns
    if (expectedReturn < 0.05) confidence -= 25;
    else if (expectedReturn > 0.15) confidence += 15;
    
    // Reduce confidence for over-diversification
    if (positions.length > 20) confidence -= 10;
    
    return Math.max(0, Math.min(100, confidence));
  }

  private getRegimeRiskAdjustments(regime: MarketRegime['regime']): MarketRegime['riskAdjustments'] {
    switch (regime) {
      case 'CRISIS':
        return {
          positionSizeMultiplier: 0.3,
          maxDrawdownAdjustment: -5,
          cashReserveAdjustment: 15,
          correlationThreshold: 0.5
        };
      case 'HIGH_VOLATILITY':
        return {
          positionSizeMultiplier: 0.6,
          maxDrawdownAdjustment: -3,
          cashReserveAdjustment: 10,
          correlationThreshold: 0.6
        };
      case 'BEAR_MARKET':
        return {
          positionSizeMultiplier: 0.7,
          maxDrawdownAdjustment: -2,
          cashReserveAdjustment: 8,
          correlationThreshold: 0.65
        };
      case 'BULL_MARKET':
        return {
          positionSizeMultiplier: 1.2,
          maxDrawdownAdjustment: 2,
          cashReserveAdjustment: -3,
          correlationThreshold: 0.8
        };
      case 'LOW_VOLATILITY':
        return {
          positionSizeMultiplier: 1.1,
          maxDrawdownAdjustment: 1,
          cashReserveAdjustment: -2,
          correlationThreshold: 0.75
        };
      default: // SIDEWAYS
        return {
          positionSizeMultiplier: 1.0,
          maxDrawdownAdjustment: 0,
          cashReserveAdjustment: 0,
          correlationThreshold: 0.7
        };
    }
  }

  private calculatePortfolioRisk(positions: Position[], portfolioValue: number): RiskReport['portfolioRisk'] {
    // Mock calculations for comprehensive portfolio risk
    return {
      currentVaR: portfolioValue * 0.02, // 2% of portfolio
      expectedShortfall: portfolioValue * 0.035, // 3.5% of portfolio
      maxDrawdown: 12.5, // 12.5% max drawdown
      beta: 1.15, // Portfolio beta
      sharpeRatio: 1.25, // Sharpe ratio
      volatility: 0.18 // 18% annualized volatility
    };
  }

  private analyzeConcentrationRisk(positions: Position[], portfolioValue: number): RiskReport['concentrationRisk'] {
    const sortedPositions = [...positions].sort((a, b) => b.marketValue - a.marketValue);
    
    const topPositions = sortedPositions.slice(0, 5).map(pos => ({
      symbol: pos.symbol,
      percentage: (pos.marketValue / portfolioValue) * 100,
      risk: (pos.marketValue / portfolioValue) > 0.15 ? 'HIGH' as const : 
            (pos.marketValue / portfolioValue) > 0.1 ? 'MEDIUM' as const : 'LOW' as const
    }));

    // Mock sector concentration
    const sectorConcentration = {
      'Technology': 35.2,
      'Financial': 22.1,
      'Healthcare': 18.7,
      'Energy': 12.3,
      'Consumer': 11.7
    };

    // Mock correlation clusters
    const correlationClusters = [
      { symbols: ['AAPL', 'MSFT', 'GOOGL'], avgCorrelation: 0.75 },
      { symbols: ['JPM', 'BAC', 'WFC'], avgCorrelation: 0.82 }
    ];

    return {
      topPositions,
      sectorConcentration,
      correlationClusters
    };
  }

  private analyzeLiquidityRisk(positions: Position[]): RiskReport['liquidityRisk'] {
    // Mock liquidity analysis
    const illiquidPositions = positions
      .filter(() => Math.random() < 0.1) // 10% chance of being illiquid
      .map(pos => pos.symbol);

    const averageDailyVolume: { [symbol: string]: number } = {};
    positions.forEach(pos => {
      averageDailyVolume[pos.symbol] = 1000000 + Math.random() * 5000000;
    });

    const liquidityScore = 100 - (illiquidPositions.length / positions.length) * 100;

    return {
      illiquidPositions,
      averageDailyVolume,
      liquidityScore
    };
  }

  private analyzeMarketRisk(positions: Position[], marketData: any): RiskReport['marketRisk'] {
    // Mock market regime identification
    const regime = this.identifyMarketRegime({
      returns: Array(50).fill(0).map(() => (Math.random() - 0.5) * 0.1),
      volatility: 0.25,
      trendStrength: 0.6,
      correlations: Array(10).fill(0).map(() => 0.4 + Math.random() * 0.3)
    });

    const volatilityRegime = regime.regime === 'CRISIS' ? 'EXTREME' as const :
                           regime.regime === 'HIGH_VOLATILITY' ? 'HIGH' as const :
                           regime.regime === 'LOW_VOLATILITY' ? 'LOW' as const : 'NORMAL' as const;

    const trends: { [symbol: string]: 'UPTREND' | 'DOWNTREND' | 'SIDEWAYS' } = {};
    positions.forEach(pos => {
      const trendTypes: Array<'UPTREND' | 'DOWNTREND' | 'SIDEWAYS'> = ['UPTREND', 'DOWNTREND', 'SIDEWAYS'];
      trends[pos.symbol] = trendTypes[Math.floor(Math.random() * 3)];
    });

    return {
      regime,
      volatilityRegime,
      trends
    };
  }

  private generateRiskRecommendations(
    portfolioRisk: RiskReport['portfolioRisk'],
    concentrationRisk: RiskReport['concentrationRisk'],
    liquidityRisk: RiskReport['liquidityRisk'],
    marketRisk: RiskReport['marketRisk']
  ): RiskReport['recommendations'] {
    const immediateActions: string[] = [];
    const positionAdjustments: RiskReport['recommendations']['positionAdjustments'] = [];
    const strategicChanges: string[] = [];

    // High concentration risk
    if (concentrationRisk.topPositions.some(pos => pos.risk === 'HIGH')) {
      immediateActions.push('Reduce position sizes for over-concentrated holdings');
      concentrationRisk.topPositions
        .filter(pos => pos.risk === 'HIGH')
        .forEach(pos => {
          positionAdjustments.push({
            symbol: pos.symbol,
            action: 'REDUCE',
            reason: `Position size ${pos.percentage.toFixed(1)}% too high`,
            urgency: 'HIGH'
          });
        });
    }

    // High portfolio beta
    if (portfolioRisk.beta > 1.5) {
      strategicChanges.push('Consider adding defensive positions to reduce portfolio beta');
      immediateActions.push('Review high-beta positions for potential reduction');
    }

    // Low liquidity positions
    if (liquidityRisk.liquidityScore < 70) {
      immediateActions.push('Monitor illiquid positions for exit opportunities');
      liquidityRisk.illiquidPositions.forEach(symbol => {
        positionAdjustments.push({
          symbol,
          action: 'REDUCE',
          reason: 'Low liquidity risk',
          urgency: 'MEDIUM'
        });
      });
    }

    // Market regime adjustments
    if (marketRisk.regime.regime === 'CRISIS' || marketRisk.regime.regime === 'HIGH_VOLATILITY') {
      immediateActions.push('Reduce overall position sizes due to high volatility regime');
      strategicChanges.push('Increase cash reserves for defensive positioning');
    }

    // Sector concentration
    Object.entries(concentrationRisk.sectorConcentration).forEach(([sector, percentage]) => {
      if (percentage > 30) {
        strategicChanges.push(`Reduce ${sector} sector concentration (currently ${percentage.toFixed(1)}%)`);
      }
    });

    return {
      immediateActions,
      positionAdjustments,
      strategicChanges
    };
  }
}

export default new RiskManagementService();
