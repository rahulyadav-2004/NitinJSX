import React, { useEffect, useState } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Box,
  CircularProgress,
  Button,
  Chip,
} from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getFinancialNews, retryGetFinancialNews } from '../services/newsService';
import { analyzeSentimentWithGroq } from '../services/groqService';
import SentimentMeter from '../components/SentimentMeter';

const mockData = [
  { time: '00:00', sentiment: 0.6 },
  { time: '04:00', sentiment: 0.8 },
  { time: '08:00', sentiment: 0.4 },
  { time: '12:00', sentiment: 0.9 },
  { time: '16:00', sentiment: 0.7 },
  { time: '20:00', sentiment: 0.5 },
];

const CURRENCY_PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD'];

const Dashboard = () => {
  const [sentiment, setSentiment] = useState(0.5);
  const [loading, setLoading] = useState(true);
  const [positiveSignals, setPositiveSignals] = useState([]);
  const [negativeSignals, setNegativeSignals] = useState([]);
  const [analysis, setAnalysis] = useState('');
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [sentimentHistory, setSentimentHistory] = useState([]);
  const [totalArticles, setTotalArticles] = useState(0);
  const [marketMetrics, setMarketMetrics] = useState({
    volatilityIndex: 0,
    trendStrength: 0,
    supportLevel: 0,
    resistanceLevel: 0,
    tradingVolume: '0',
    marketMomentum: 'neutral',
    rsiValue: 50,
    macdSignal: 'neutral',
    pivotPoints: {
      r3: 0,
      r2: 0,
      r1: 0,
      pivot: 0,
      s1: 0,
      s2: 0,
      s3: 0
    },
    atrValue: 0,
    marketStructure: 'ranging',
    keyLevels: [],
    swingHighs: [],
    swingLows: [],
    trendlineAngle: 0,
    volumeProfile: {
      high: 0,
      medium: 0,
      low: 0
    }
  });

  // Helper functions for market metrics calculations
  const calculateVolatility = (positive, negative) => {
    const signals = [...positive, ...negative];
    const confidences = signals.map(s => s.confidence);
    const avg = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    const variance = confidences.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / confidences.length;
    return Math.min(Math.sqrt(variance) * 100, 100);
  };

  const calculateTrendStrength = (currentSentiment, history) => {
    if (history.length < 2) return 50;
    const trend = history.slice(-3).every((point, i, arr) => {
      if (i === 0) return true;
      return currentSentiment >= 0.5 ? point.sentiment >= arr[i-1].sentiment : point.sentiment <= arr[i-1].sentiment;
    });
    return trend ? 75 : 25;
  };

  const calculateSupportResistance = (positive, negative) => {
    const posConfidences = positive.map(s => s.confidence);
    const negConfidences = negative.map(s => s.confidence);
    return {
      support: Math.min(...posConfidences.concat(0.3)) * 100,
      resistance: Math.max(...negConfidences.concat(0.7)) * 100
    };
  };

  const calculateTradingVolume = (articles) => {
    const volumeKeywords = ['volume', 'trading', 'liquidity', 'flow'];
    const volumeArticles = articles.filter(article => 
      volumeKeywords.some(keyword => 
        article.title.toLowerCase().includes(keyword) || 
        (article.description || '').toLowerCase().includes(keyword)
      )
    );
    const volumeScore = (volumeArticles.length / articles.length) * 100;
    if (volumeScore > 66) return 'High';
    if (volumeScore > 33) return 'Moderate';
    return 'Low';
  };

  const calculateMarketMomentum = (currentSentiment, history) => {
    if (history.length < 3) return 'neutral';
    const recentTrend = history.slice(-3).map(h => h.sentiment);
    const momentum = recentTrend.reduce((a, b) => a + b, 0) / 3;
    if (momentum >= 0.6) return 'bullish';
    if (momentum <= 0.4) return 'bearish';
    return 'neutral';
  };

  const calculateRSI = (sentimentHistory) => {
    if (sentimentHistory.length < 14) return 50;
    const gains = [];
    const losses = [];
    
    for (let i = 1; i < sentimentHistory.length; i++) {
      const diff = sentimentHistory[i].sentiment - sentimentHistory[i-1].sentiment;
      if (diff >= 0) {
        gains.push(diff);
        losses.push(0);
      } else {
        gains.push(0);
        losses.push(Math.abs(diff));
      }
    }
    
    const avgGain = gains.reduce((a, b) => a + b, 0) / gains.length;
    const avgLoss = losses.reduce((a, b) => a + b, 0) / losses.length;
    
    const rs = avgGain / (avgLoss || 1);
    return 100 - (100 / (1 + rs));
  };

  const calculateMACD = (sentimentHistory) => {
    if (sentimentHistory.length < 26) return 'neutral';
    
    const ema12 = calculateEMA(sentimentHistory, 12);
    const ema26 = calculateEMA(sentimentHistory, 26);
    const macdLine = ema12 - ema26;
    const signalLine = calculateEMA(sentimentHistory.slice(-9), 9);
    
    if (macdLine > signalLine) return 'buy';
    if (macdLine < signalLine) return 'sell';
    return 'neutral';
  };

  const calculateEMA = (data, period) => {
    const k = 2 / (period + 1);
    return data.slice(-period).reduce((sum, point, index) => {
      const value = point.sentiment;
      return sum + value * k;
    }, 0) / period;
  };

  const calculatePivotPoints = (signals) => {
    if (!signals || signals.length === 0) {
      return {
        r3: 0.7,
        r2: 0.65,
        r1: 0.6,
        pivot: 0.5,
        s1: 0.4,
        s2: 0.35,
        s3: 0.3
      };
    }

    const confidences = signals.map(s => s.confidence);
    const high = Math.max(...confidences);
    const low = Math.min(...confidences);
    const close = signals[signals.length - 1]?.confidence || 0.5;
    
    const pivot = (high + low + close) / 3;
    const r1 = (2 * pivot) - low;
    const r2 = pivot + (high - low);
    const r3 = high + 2 * (pivot - low);
    const s1 = (2 * pivot) - high;
    const s2 = pivot - (high - low);
    const s3 = low - 2 * (high - pivot);
    
    return {
      r3: Math.min(Math.max(r3, 0), 1),
      r2: Math.min(Math.max(r2, 0), 1),
      r1: Math.min(Math.max(r1, 0), 1),
      pivot: Math.min(Math.max(pivot, 0), 1),
      s1: Math.min(Math.max(s1, 0), 1),
      s2: Math.min(Math.max(s2, 0), 1),
      s3: Math.min(Math.max(s3, 0), 1)
    };
  };

  const calculateATR = (signals) => {
    if (signals.length < 2) return 0;
    const ranges = [];
    for (let i = 1; i < signals.length; i++) {
      ranges.push(Math.abs(signals[i].confidence - signals[i-1].confidence));
    }
    return ranges.reduce((a, b) => a + b, 0) / ranges.length;
  };

  const calculateMarketStructure = (sentiment, history) => {
    if (history.length < 4) return 'ranging';
    
    const recentValues = history.slice(-4).map(h => h.sentiment);
    const higherHighs = recentValues[1] > recentValues[0] && recentValues[3] > recentValues[2];
    const higherLows = recentValues[2] > recentValues[0];
    const lowerLows = recentValues[1] < recentValues[0] && recentValues[3] < recentValues[2];
    const lowerHighs = recentValues[2] < recentValues[0];
    
    if (higherHighs && higherLows) return 'uptrend';
    if (lowerLows && lowerHighs) return 'downtrend';
    return 'ranging';
  };

  const fetchNewsAndAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const newsResponse = await retryGetFinancialNews('All News');
      
      if (!newsResponse.results || newsResponse.results.length === 0) {
        throw new Error('No news articles available. Please try again later.');
      }

      setTotalArticles(newsResponse.results.length);
      
      const sentimentResult = await analyzeSentimentWithGroq(newsResponse.results);
      
      // Update basic sentiment metrics
      setSentiment(sentimentResult.overallSentiment);
      setPositiveSignals(sentimentResult.positiveSignals);
      setNegativeSignals(sentimentResult.negativeSignals);
      setAnalysis(sentimentResult.analysis);

      // Calculate market metrics based on sentiment analysis
      const volatility = calculateVolatility(sentimentResult.positiveSignals, sentimentResult.negativeSignals);
      const trendStrength = calculateTrendStrength(sentimentResult.overallSentiment, sentimentHistory);
      const { support, resistance } = calculateSupportResistance(sentimentResult.positiveSignals, sentimentResult.negativeSignals);
      const volume = calculateTradingVolume(newsResponse.results);
      const momentum = calculateMarketMomentum(sentimentResult.overallSentiment, sentimentHistory);

      // Calculate additional metrics
      const rsi = calculateRSI(sentimentHistory);
      const macdSignal = calculateMACD(sentimentHistory);
      const pivotPoints = calculatePivotPoints([...positiveSignals, ...negativeSignals]);
      const atr = calculateATR([...positiveSignals, ...negativeSignals]);
      const marketStructure = calculateMarketStructure(sentiment, sentimentHistory);

      setMarketMetrics({
        volatilityIndex: volatility,
        trendStrength: trendStrength,
        supportLevel: support,
        resistanceLevel: resistance,
        tradingVolume: volume,
        marketMomentum: momentum,
        rsiValue: rsi,
        macdSignal,
        pivotPoints,
        atrValue: atr,
        marketStructure,
        keyLevels: [],
        swingHighs: [],
        swingLows: [],
        trendlineAngle: 0,
        volumeProfile: {
          high: 0,
          medium: 0,
          low: 0
        }
      });

      // Update sentiment history
      const newDataPoint = {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sentiment: sentimentResult.overallSentiment
      };
      
      setSentimentHistory(prev => {
        const updatedHistory = [...prev, newDataPoint];
        return updatedHistory.slice(-8);
      });

      setError(null);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze market sentiment');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchNewsAndAnalyze();
  };

  useEffect(() => {
    fetchNewsAndAnalyze();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchNewsAndAnalyze, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8 mt-4">
        <div>
          <Typography variant="h4" className="font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Market Sentiment
          </Typography>
          <Typography variant="body1" className="text-gray-400 mt-1">
            Real-time market analysis powered by AI
          </Typography>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 bg-[#1C1C1E] px-4 py-2 rounded-lg border border-gray-800">
            <div className="w-2 h-2 rounded-full bg-[#30d158] animate-pulse" />
            <Typography variant="body2" className="text-gray-400">
              Live Updates
            </Typography>
          </div>
          <div className="bg-[#1C1C1E] px-4 py-2 rounded-lg border border-gray-800">
            <Typography variant="body2" className="text-gray-400">
              Last updated: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </Typography>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="relative">
            <CircularProgress size={48} sx={{ color: '#0077ed' }} />
            <div className="absolute inset-0 animate-pulse-slow">
              <div className="w-12 h-12 rounded-full bg-blue-500/10" />
            </div>
          </div>
          <Typography variant="body1" className="text-gray-300 font-medium">
            {retryCount > 0 ? 'Retrying analysis...' : 'Analyzing market sentiment...'}
          </Typography>
        </div>
      ) : error ? (
        <Paper className="p-8 bg-[#1d1d1f] shadow-2xl rounded-2xl text-center border border-gray-800">
          <Typography color="error" className="mb-4 font-medium">
            {error}
          </Typography>
          <Button
            variant="contained"
            sx={{ 
              background: 'linear-gradient(45deg, #007AFF, #5856D6)',
              '&:hover': { 
                background: 'linear-gradient(45deg, #0062CC, #4845AA)',
              },
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 500,
              boxShadow: '0 8px 24px rgba(0, 122, 255, 0.2)',
              padding: '10px 24px',
            }}
            onClick={handleRetry}
            className="mt-2"
          >
            Retry Analysis
          </Button>
        </Paper>
      ) : (
        <>
          {/* Sentiment Meter Section */}
          <Paper className="p-8 bg-[#1d1d1f] shadow-2xl overflow-hidden w-full border border-gray-800/50 backdrop-blur-xl">
            <SentimentMeter value={sentiment} />
          </Paper>

          {/* Market Analysis Section */}
          <Paper className="p-8 bg-[#1d1d1f] shadow-2xl rounded-2xl overflow-hidden border border-gray-800/50 backdrop-blur-xl">
            <div className="flex justify-between items-start mb-8">
              <div>
                <Typography variant="h5" className="font-bold text-white mb-2">
                  AI Market Analysis
                </Typography>
                <div className="flex items-center space-x-3">
                  <Chip 
                    label={`Volume: ${marketMetrics.tradingVolume}`}
                    sx={{ 
                      backgroundColor: '#1C1C1E',
                      color: '#0077ed',
                      fontWeight: 500,
                      border: '1px solid rgba(0, 119, 237, 0.2)'
                    }}
                  />
                  <Chip 
                    label={`Articles: ${totalArticles}`}
                    sx={{ 
                      backgroundColor: '#1C1C1E',
                      color: '#0077ed',
                      fontWeight: 500,
                      border: '1px solid rgba(0, 119, 237, 0.2)'
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-col items-end">
                <Typography 
                  variant="h4" 
                  className="font-bold mb-1"
                  sx={{
                    background: sentiment >= 0.7 
                      ? 'linear-gradient(45deg, #34C759, #30d158)'
                      : sentiment <= 0.3 
                      ? 'linear-gradient(45deg, #FF453A, #ff3b30)'
                      : 'linear-gradient(45deg, #FF9F0A, #ff9500)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  {sentiment >= 0.7 ? 'BULLISH' : sentiment <= 0.3 ? 'BEARISH' : 'NEUTRAL'}
                </Typography>
                <Typography variant="body2" className="text-gray-400">
                  Overall Market Sentiment
                </Typography>
              </div>
            </div>

            {/* Metrics Cards */}
            <Grid container spacing={4} className="mb-8">
              <Grid item xs={12} md={4}>
                <Box className="p-6 bg-[#1C1C1E] rounded-xl h-full transition-all duration-300 hover:shadow-2xl border border-gray-800/50 backdrop-blur-xl hover:border-blue-500/20">
                  <Typography variant="subtitle1" className="font-bold mb-4 bg-gradient-to-r from-[#007AFF] to-[#5856D6] bg-clip-text text-transparent">
                    Market Structure
                  </Typography>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-[#1d1d1f] rounded-lg border border-gray-800/30">
                      <Typography variant="body2" className="text-gray-400">Current Phase</Typography>
                      <Typography variant="body2" className="font-medium" style={{
                        color: marketMetrics.marketStructure === 'uptrend' ? '#30d158' :
                               marketMetrics.marketStructure === 'downtrend' ? '#ff453a' : '#ff9f0a'
                      }}>
                        {marketMetrics.marketStructure.toUpperCase()}
                      </Typography>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-[#1d1d1f] rounded-lg border border-gray-800/30">
                      <Typography variant="body2" className="text-gray-400">Trend Strength</Typography>
                      <Typography variant="body2" className="font-medium" style={{
                        color: marketMetrics.trendStrength >= 70 ? '#30d158' :
                               marketMetrics.trendStrength <= 30 ? '#ff453a' : '#ff9f0a'
                      }}>
                        {marketMetrics.trendStrength}%
                      </Typography>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-[#1d1d1f] rounded-lg border border-gray-800/30">
                      <Typography variant="body2" className="text-gray-400">Momentum</Typography>
                      <Typography variant="body2" className="font-medium" style={{
                        color: marketMetrics.marketMomentum === 'bullish' ? '#30d158' :
                               marketMetrics.marketMomentum === 'bearish' ? '#ff453a' : '#ff9f0a'
                      }}>
                        {marketMetrics.marketMomentum.toUpperCase()}
                      </Typography>
                    </div>
                  </div>
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Box className="p-6 bg-[#1C1C1E] rounded-xl h-full transition-all duration-300 hover:shadow-2xl border border-gray-800/50 backdrop-blur-xl hover:border-blue-500/20">
                  <Typography variant="subtitle1" className="font-bold mb-4 bg-gradient-to-r from-[#007AFF] to-[#5856D6] bg-clip-text text-transparent">
                    Risk Assessment
                  </Typography>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-[#1d1d1f] rounded-lg border border-gray-800/30">
                      <Typography variant="body2" className="text-gray-400">Volatility</Typography>
                      <Typography variant="body2" className="font-medium" style={{
                        color: marketMetrics.volatilityIndex >= 70 ? '#ff453a' :
                               marketMetrics.volatilityIndex <= 30 ? '#30d158' : '#ff9f0a'
                      }}>
                        {marketMetrics.volatilityIndex.toFixed(1)}%
                      </Typography>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-[#1d1d1f] rounded-lg border border-gray-800/30">
                      <Typography variant="body2" className="text-gray-400">RSI Level</Typography>
                      <Typography variant="body2" className="font-medium" style={{
                        color: marketMetrics.rsiValue > 70 ? '#ff453a' :
                               marketMetrics.rsiValue < 30 ? '#30d158' : '#ff9f0a'
                      }}>
                        {marketMetrics.rsiValue.toFixed(1)}
                      </Typography>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-[#1d1d1f] rounded-lg border border-gray-800/30">
                      <Typography variant="body2" className="text-gray-400">ATR</Typography>
                      <Typography variant="body2" className="font-medium" style={{
                        color: marketMetrics.atrValue >= 0.1 ? '#ff453a' : '#30d158'
                      }}>
                        {(marketMetrics.atrValue * 100).toFixed(1)}%
                      </Typography>
                    </div>
                  </div>
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Box className="p-6 bg-[#1C1C1E] rounded-xl h-full transition-all duration-300 hover:shadow-2xl border border-gray-800/50 backdrop-blur-xl hover:border-blue-500/20">
                  <Typography variant="subtitle1" className="font-bold mb-4 bg-gradient-to-r from-[#007AFF] to-[#5856D6] bg-clip-text text-transparent">
                    Key Levels
                  </Typography>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-[#1d1d1f] rounded-lg border border-gray-800/30">
                      <Typography variant="body2" className="text-gray-400">Resistance</Typography>
                      <Typography variant="body2" className="font-medium text-[#ff453a]">
                        {marketMetrics.resistanceLevel.toFixed(1)}%
                      </Typography>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-[#1d1d1f] rounded-lg border border-gray-800/30">
                      <Typography variant="body2" className="text-gray-400">Support</Typography>
                      <Typography variant="body2" className="font-medium text-[#30d158]">
                        {marketMetrics.supportLevel.toFixed(1)}%
                      </Typography>
                    </div>
                  </div>
                </Box>
              </Grid>
            </Grid>

            {/* Analysis Summary */}
            <Box className="p-6 bg-[#1C1C1E] rounded-xl mb-8 transition-all duration-300 hover:shadow-2xl border border-gray-800/50 backdrop-blur-xl">
              <Typography variant="subtitle1" className="font-bold mb-4 bg-gradient-to-r from-[#007AFF] to-[#5856D6] bg-clip-text text-transparent">
                Market Analysis Summary
              </Typography>
              <Typography variant="body1" className="text-gray-300 whitespace-pre-line leading-relaxed">
                {analysis}
              </Typography>
            </Box>

            {/* Bullish & Bearish Factors */}
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Box className="p-6 bg-[#1C1C1E] rounded-xl h-full transition-all duration-300 hover:shadow-2xl border border-gray-800/50 backdrop-blur-xl">
                  <Typography variant="subtitle1" className="font-bold mb-4 bg-gradient-to-r from-[#34C759] to-[#30d158] bg-clip-text text-transparent">
                    Bullish Factors
                  </Typography>
                  <div className="space-y-3">
                    {positiveSignals.map((signal, index) => (
                      <div key={index} className="flex items-center p-4 bg-[#1d1d1f] rounded-lg border border-gray-800/30 hover:border-green-500/20 transition-all duration-300">
                        <div className="w-1.5 h-1.5 bg-[#30d158] rounded-full mr-3" />
                        <Typography variant="body2" className="text-gray-300 flex-grow">
                          {signal.title}
                        </Typography>
                        <div className="ml-4 px-3 py-1 rounded-full bg-[#30d15815] text-[#30d158] font-medium text-sm">
                          {(signal.confidence * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box className="p-6 bg-[#1C1C1E] rounded-xl h-full transition-all duration-300 hover:shadow-2xl border border-gray-800/50 backdrop-blur-xl">
                  <Typography variant="subtitle1" className="font-bold mb-4 bg-gradient-to-r from-[#FF453A] to-[#ff3b30] bg-clip-text text-transparent">
                    Bearish Factors
                  </Typography>
                  <div className="space-y-3">
                    {negativeSignals.map((signal, index) => (
                      <div key={index} className="flex items-center p-4 bg-[#1d1d1f] rounded-lg border border-gray-800/30 hover:border-red-500/20 transition-all duration-300">
                        <div className="w-1.5 h-1.5 bg-[#ff453a] rounded-full mr-3" />
                        <Typography variant="body2" className="text-gray-300 flex-grow">
                          {signal.title}
                        </Typography>
                        <div className="ml-4 px-3 py-1 rounded-full bg-[#ff453a15] text-[#ff453a] font-medium text-sm">
                          {(signal.confidence * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </>
      )}
    </div>
  );
};

export default Dashboard; 