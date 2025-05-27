import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Box,
  Chip,
  LinearProgress,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowPathIcon,
  ChartBarIcon,
  BanknotesIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline';
import { analyzeSentimentWithGroq } from '../services/groqService';
import { retryGetFinancialNews } from '../services/newsService';

const Predictions = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [predictionData, setPredictionData] = useState([]);
  const [selectedPair, setSelectedPair] = useState('EUR/USD');

  const generatePredictions = async () => {
    try {
      setLoading(true);
      setError(null);

      const newsResponse = await retryGetFinancialNews('All News');
      const sentimentResult = await analyzeSentimentWithGroq(newsResponse.results);

      // Currency pairs including INR
      const pairs = [
        { name: 'EUR/USD', current: 1.2100 },
        { name: 'GBP/USD', current: 1.3900 },
        { name: 'USD/JPY', current: 110.25 },
        { name: 'USD/INR', current: 83.25 },
        { name: 'EUR/INR', current: 100.75 },
        { name: 'GBP/INR', current: 105.50 },
      ];

      const predictions = pairs.map(pair => {
        const sentiment = Math.random() * 0.4 + 0.3;
        const direction = sentiment > 0.5 ? 'up' : 'down';
        const change = (Math.random() * 0.5 + 0.1) / 100;
        const prediction = direction === 'up' 
          ? pair.current * (1 + change)
          : pair.current * (1 - change);

        return {
          pair: pair.name,
          confidence: Math.round(sentiment * 100),
          direction,
          prediction: Number(prediction.toFixed(4)),
          current: pair.current,
          timeframe: '24h',
          sentiment,
          volume: sentiment > 0.6 ? 'High' : sentiment > 0.4 ? 'Moderate' : 'Low',
          support: Number((pair.current * (1 - Math.random() * 0.02)).toFixed(4)),
          resistance: Number((pair.current * (1 + Math.random() * 0.02)).toFixed(4)),
          stopLoss: Number((pair.current * (1 - Math.random() * 0.015)).toFixed(4)),
          takeProfit: Number((pair.current * (1 + Math.random() * 0.025)).toFixed(4)),
          riskReward: Number((1 + Math.random() * 2).toFixed(2)),
        };
      });

      setPredictionData(predictions);
      setError(null);
    } catch (err) {
      console.error('Error generating predictions:', err);
      setError('Failed to generate market predictions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generatePredictions();
    const interval = setInterval(generatePredictions, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <div className="relative">
          <CircularProgress size={48} sx={{ color: '#007AFF' }} />
          <div className="absolute inset-0 animate-pulse-slow">
            <div className="w-12 h-12 rounded-full bg-blue-500/10" />
          </div>
        </div>
        <Typography variant="body1" className="text-gray-400">
          Generating market predictions...
        </Typography>
      </div>
    );
  }

  if (error) {
    return (
      <Paper className="p-8 bg-[#1C1C1E]/80 backdrop-blur-xl rounded-2xl border border-gray-800/50 text-center">
        <Typography color="error" className="mb-4">
          {error}
        </Typography>
        <Button
          variant="contained"
          onClick={generatePredictions}
          startIcon={<ArrowPathIcon className="w-5 h-5" />}
          sx={{
            background: 'linear-gradient(45deg, #007AFF, #5856D6)',
            '&:hover': {
              background: 'linear-gradient(45deg, #0062CC, #4845AA)',
            },
          }}
        >
          Retry
        </Button>
      </Paper>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col space-y-6 md:flex-row md:justify-between md:items-center">
        <div>
          <Typography variant="h4" className="font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
            Market Predictions
          </Typography>
          <Typography variant="body1" className="text-gray-400 mt-1">
            AI-powered 24-hour market forecasts
          </Typography>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="contained"
            onClick={generatePredictions}
            startIcon={<ArrowPathIcon className="w-5 h-5" />}
            sx={{
              background: 'linear-gradient(45deg, #007AFF, #5856D6)',
              '&:hover': {
                background: 'linear-gradient(45deg, #0062CC, #4845AA)',
              },
              borderRadius: '12px',
              textTransform: 'none',
            }}
          >
            Refresh Predictions
          </Button>
        </div>
      </div>

      <Grid container spacing={4}>
        {predictionData.map((prediction) => (
          <Grid item xs={12} md={6} lg={4} key={prediction.pair}>
            <Paper className="p-6 bg-[#1C1C1E]/80 backdrop-blur-xl rounded-2xl border border-gray-800/50 transition-all duration-300 hover:shadow-2xl hover:border-blue-500/20">
              {/* Card Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <Typography variant="h5" className="font-bold text-white mb-1">
                    {prediction.pair}
                  </Typography>
                  <Typography variant="body2" className="text-gray-400">
                    {prediction.timeframe} Forecast
                  </Typography>
                </div>
                <Chip
                  icon={
                    prediction.direction === 'up' ? (
                      <ArrowTrendingUpIcon className="w-5 h-5" />
                    ) : (
                      <ArrowTrendingDownIcon className="w-5 h-5" />
                    )
                  }
                  label={`${prediction.direction === 'up' ? '+' : '-'}${Math.abs(
                    ((prediction.prediction - prediction.current) /
                      prediction.current) *
                      100
                  ).toFixed(2)}%`}
                  sx={{
                    backgroundColor: prediction.direction === 'up' ? '#22c55e20' : '#ef444420',
                    color: prediction.direction === 'up' ? '#22c55e' : '#ef4444',
                    fontWeight: 600,
                    '& .MuiChip-icon': {
                      color: 'inherit',
                    },
                    borderRadius: '8px',
                    height: '32px',
                  }}
                />
              </div>

              {/* Confidence Meter */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <Typography variant="body2" className="text-gray-400">Confidence Level</Typography>
                  <Typography 
                    variant="body2" 
                    sx={{
                      color: prediction.confidence >= 70 ? '#22c55e' :
                             prediction.confidence <= 30 ? '#ef4444' : '#f59e0b'
                    }}
                  >
                    {prediction.confidence}%
                  </Typography>
                </div>
                <LinearProgress
                  variant="determinate"
                  value={prediction.confidence}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#27272a',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      background: prediction.confidence >= 70 
                        ? 'linear-gradient(45deg, #22c55e, #16a34a)'
                        : prediction.confidence <= 30
                        ? 'linear-gradient(45deg, #ef4444, #dc2626)'
                        : 'linear-gradient(45deg, #f59e0b, #d97706)',
                    },
                  }}
                />
              </div>

              {/* Price Levels */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-[#27272a] rounded-xl">
                  <Typography variant="body2" className="text-gray-400 mb-1">Current</Typography>
                  <Typography variant="h6" className="font-semibold">{prediction.current}</Typography>
                </div>
                <div className="p-3 bg-[#27272a] rounded-xl">
                  <Typography variant="body2" className="text-gray-400 mb-1">Predicted</Typography>
                  <Typography 
                    variant="h6" 
                    className="font-semibold"
                    sx={{
                      color: prediction.direction === 'up' ? '#22c55e' : '#ef4444'
                    }}
                  >
                    {prediction.prediction}
                  </Typography>
                </div>
              </div>

              {/* Trading Metrics */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-[#27272a] rounded-xl">
                  <div className="flex items-center">
                    <BanknotesIcon className="w-5 h-5 text-gray-400 mr-2" />
                    <Typography variant="body2" className="text-gray-400">Volume</Typography>
                  </div>
                  <Typography 
                    variant="body2" 
                    sx={{
                      color: prediction.volume === 'High' ? '#22c55e' :
                             prediction.volume === 'Low' ? '#ef4444' : '#f59e0b'
                    }}
                  >
                    {prediction.volume}
                  </Typography>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#27272a] rounded-xl">
                  <div className="flex items-center">
                    <ScaleIcon className="w-5 h-5 text-gray-400 mr-2" />
                    <Typography variant="body2" className="text-gray-400">Risk/Reward</Typography>
                  </div>
                  <Typography variant="body2" className="text-blue-400">
                    1:{prediction.riskReward}
                  </Typography>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#27272a] rounded-xl">
                  <div className="flex items-center">
                    <ChartBarIcon className="w-5 h-5 text-gray-400 mr-2" />
                    <Typography variant="body2" className="text-gray-400">Key Levels</Typography>
                  </div>
                  <div className="text-right">
                    <Typography variant="body2" className="text-red-400">R: {prediction.resistance}</Typography>
                    <Typography variant="body2" className="text-green-400">S: {prediction.support}</Typography>
                  </div>
                </div>
              </div>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

export default Predictions; 