#!/usr/bin/env python3
"""
AI Trading System - Main Application
Serves machine learning models and trading strategies via FastAPI
"""

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Dict, List, Optional

import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import redis.asyncio as redis
from loguru import logger

from models.trading_models import TradingModelManager
from services.data_service import DataService
from services.strategy_service import StrategyService
from services.risk_service import RiskService
from utils.config import Settings
from utils.database import DatabaseManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger.add("logs/ai_models.log", rotation="1 day", retention="30 days")

# Load settings
settings = Settings()

# Global variables for services
trading_models: Optional[TradingModelManager] = None
data_service: Optional[DataService] = None
strategy_service: Optional[StrategyService] = None
risk_service: Optional[RiskService] = None
redis_client: Optional[redis.Redis] = None
db_manager: Optional[DatabaseManager] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global trading_models, data_service, strategy_service, risk_service, redis_client, db_manager
    
    # Startup
    logger.info("Starting AI Trading Models Service...")
    
    try:
        # Initialize Redis
        redis_client = redis.from_url(settings.REDIS_URL)
        await redis_client.ping()
        logger.info("Redis connected successfully")
        
        # Initialize database
        db_manager = DatabaseManager(settings.DATABASE_URL)
        await db_manager.connect()
        logger.info("Database connected successfully")
        
        # Initialize services
        data_service = DataService(redis_client, db_manager)
        strategy_service = StrategyService(data_service)
        risk_service = RiskService()
        trading_models = TradingModelManager(data_service, strategy_service, risk_service)
        
        # Load and initialize models
        await trading_models.initialize_models()
        logger.info("All services initialized successfully")
        
        yield
        
    except Exception as e:
        logger.error(f"Failed to initialize services: {e}")
        raise
    finally:
        # Shutdown
        logger.info("Shutting down AI Trading Models Service...")
        if redis_client:
            await redis_client.close()
        if db_manager:
            await db_manager.disconnect()


# Create FastAPI app
app = FastAPI(
    title="AI Trading Models API",
    description="Machine learning models and trading strategies for algorithmic trading",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic models for API requests/responses
class PredictionRequest(BaseModel):
    symbol: str
    timeframe: str = "1d"
    features: Optional[Dict] = None


class PredictionResponse(BaseModel):
    symbol: str
    prediction: str  # "buy", "sell", "hold"
    confidence: float
    target_price: Optional[float] = None
    stop_loss: Optional[float] = None
    reasoning: str
    timestamp: str


class StrategyRequest(BaseModel):
    symbols: List[str]
    strategy_type: str
    parameters: Optional[Dict] = None


class StrategyResponse(BaseModel):
    strategy_id: str
    recommendations: List[Dict]
    risk_score: float
    expected_return: float
    timestamp: str


class ModelStatusResponse(BaseModel):
    models: Dict[str, str]
    last_updated: str
    performance_metrics: Dict[str, float]


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ai-trading-models",
        "version": "1.0.0",
        "models_loaded": len(trading_models.models) if trading_models else 0
    }


# Model prediction endpoint
@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """Get trading prediction for a symbol"""
    try:
        if not trading_models:
            raise HTTPException(status_code=503, detail="Trading models not initialized")
        
        prediction = await trading_models.predict(
            symbol=request.symbol,
            timeframe=request.timeframe,
            features=request.features
        )
        
        return PredictionResponse(
            symbol=request.symbol,
            prediction=prediction["action"],
            confidence=prediction["confidence"],
            target_price=prediction.get("target_price"),
            stop_loss=prediction.get("stop_loss"),
            reasoning=prediction["reasoning"],
            timestamp=prediction["timestamp"]
        )
        
    except Exception as e:
        logger.error(f"Prediction error for {request.symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Strategy analysis endpoint
@app.post("/strategy", response_model=StrategyResponse)
async def analyze_strategy(request: StrategyRequest):
    """Analyze trading strategy for multiple symbols"""
    try:
        if not strategy_service:
            raise HTTPException(status_code=503, detail="Strategy service not initialized")
        
        strategy_result = await strategy_service.analyze_strategy(
            symbols=request.symbols,
            strategy_type=request.strategy_type,
            parameters=request.parameters
        )
        
        return StrategyResponse(
            strategy_id=strategy_result["strategy_id"],
            recommendations=strategy_result["recommendations"],
            risk_score=strategy_result["risk_score"],
            expected_return=strategy_result["expected_return"],
            timestamp=strategy_result["timestamp"]
        )
        
    except Exception as e:
        logger.error(f"Strategy analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Risk assessment endpoint
@app.post("/risk-assessment")
async def assess_risk(symbols: List[str], portfolio_value: float):
    """Assess risk for a portfolio"""
    try:
        if not risk_service:
            raise HTTPException(status_code=503, detail="Risk service not initialized")
        
        risk_assessment = await risk_service.assess_portfolio_risk(
            symbols=symbols,
            portfolio_value=portfolio_value
        )
        
        return risk_assessment
        
    except Exception as e:
        logger.error(f"Risk assessment error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Model status endpoint
@app.get("/status", response_model=ModelStatusResponse)
async def get_model_status():
    """Get status of all loaded models"""
    try:
        if not trading_models:
            raise HTTPException(status_code=503, detail="Trading models not initialized")
        
        status = await trading_models.get_status()
        
        return ModelStatusResponse(
            models=status["models"],
            last_updated=status["last_updated"],
            performance_metrics=status["performance_metrics"]
        )
        
    except Exception as e:
        logger.error(f"Status check error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Model retraining endpoint
@app.post("/retrain")
async def retrain_models(background_tasks: BackgroundTasks, symbols: Optional[List[str]] = None):
    """Retrain models in the background"""
    try:
        if not trading_models:
            raise HTTPException(status_code=503, detail="Trading models not initialized")
        
        # Add retraining task to background
        background_tasks.add_task(trading_models.retrain_models, symbols)
        
        return {"message": "Model retraining started in background", "task_id": "retrain_models"}
        
    except Exception as e:
        logger.error(f"Model retraining error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Market data endpoint
@app.get("/market-data/{symbol}")
async def get_market_data(symbol: str, timeframe: str = "1d", limit: int = 100):
    """Get market data for a symbol"""
    try:
        if not data_service:
            raise HTTPException(status_code=503, detail="Data service not initialized")
        
        data = await data_service.get_market_data(symbol, timeframe, limit)
        return data
        
    except Exception as e:
        logger.error(f"Market data error for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Technical indicators endpoint
@app.get("/indicators/{symbol}")
async def get_technical_indicators(symbol: str, timeframe: str = "1d"):
    """Get technical indicators for a symbol"""
    try:
        if not data_service:
            raise HTTPException(status_code=503, detail="Data service not initialized")
        
        indicators = await data_service.get_technical_indicators(symbol, timeframe)
        return indicators
        
    except Exception as e:
        logger.error(f"Technical indicators error for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# WebSocket endpoint for real-time predictions
@app.websocket("/ws/predictions")
async def websocket_predictions(websocket):
    """WebSocket endpoint for real-time predictions"""
    try:
        await websocket.accept()
        logger.info("WebSocket connection established for predictions")
        
        while True:
            # Wait for client message
            data = await websocket.receive_text()
            
            try:
                # Parse request
                import json
                request_data = json.loads(data)
                symbol = request_data.get("symbol")
                
                if not symbol:
                    await websocket.send_text(json.dumps({"error": "Symbol required"}))
                    continue
                
                # Get prediction
                prediction = await trading_models.predict(
                    symbol=symbol,
                    timeframe=request_data.get("timeframe", "1d")
                )
                
                # Send prediction back
                await websocket.send_text(json.dumps(prediction))
                
            except Exception as e:
                logger.error(f"WebSocket prediction error: {e}")
                await websocket.send_text(json.dumps({"error": str(e)}))
                
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        logger.info("WebSocket connection closed")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
