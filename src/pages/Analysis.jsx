import React, { useEffect, useState } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { retryGetFinancialNews } from '../services/newsService';
import { analyzeSentimentWithGroq } from '../services/groqService';

const CURRENCY_PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD'];

const Analysis = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currencyPairData, setCurrencyPairData] = useState([]);
  const [distributionData, setDistributionData] = useState([]);

  const analyzeCurrencyPairs = async () => {
    try {
      setLoading(true);
      setError(null);

      const newsResponse = await retryGetFinancialNews('All News');
      if (!newsResponse.results || newsResponse.results.length === 0) {
        throw new Error('No news articles available');
      }

      // Group news articles by currency pair
      const currencyPairNews = CURRENCY_PAIRS.map(pair => ({
        pair,
        articles: newsResponse.results.filter(article => 
          article.title.includes(pair) || 
          (article.description || '').includes(pair) ||
          (article.content || '').includes(pair)
        )
      }));

      // Analyze sentiment for each currency pair
      const analysisResults = await Promise.all(
        currencyPairNews.map(async ({ pair, articles }) => {
          if (articles.length === 0) {
            return {
              currency: pair,
              positive: 0,
              negative: 0,
              neutral: 0,
              overall: 0.5
            };
          }

          const sentiment = await analyzeSentimentWithGroq(articles);
          const positiveCount = sentiment.positiveSignals.length;
          const negativeCount = sentiment.negativeSignals.length;
          const total = positiveCount + negativeCount;
          
          return {
            currency: pair,
            positive: Math.round((positiveCount / total) * 100),
            negative: Math.round((negativeCount / total) * 100),
            neutral: 100 - Math.round((positiveCount / total) * 100) - Math.round((negativeCount / total) * 100),
            overall: sentiment.overallSentiment
          };
        })
      );

      setCurrencyPairData(analysisResults);

      // Calculate overall sentiment distribution
      const totalSentiments = analysisResults.reduce((acc, curr) => {
        return {
          highlyPositive: acc.highlyPositive + (curr.overall >= 0.8 ? 1 : 0),
          positive: acc.positive + (curr.overall >= 0.6 && curr.overall < 0.8 ? 1 : 0),
          neutral: acc.neutral + (curr.overall >= 0.4 && curr.overall < 0.6 ? 1 : 0),
          negative: acc.negative + (curr.overall >= 0.2 && curr.overall < 0.4 ? 1 : 0),
          highlyNegative: acc.highlyNegative + (curr.overall < 0.2 ? 1 : 0),
        };
      }, {
        highlyPositive: 0,
        positive: 0,
        neutral: 0,
        negative: 0,
        highlyNegative: 0,
      });

      const total = Object.values(totalSentiments).reduce((a, b) => a + b, 0);
      
      setDistributionData([
        { name: 'Highly Positive', value: Math.round((totalSentiments.highlyPositive / total) * 100), color: '#22c55e' },
        { name: 'Positive', value: Math.round((totalSentiments.positive / total) * 100), color: '#86efac' },
        { name: 'Neutral', value: Math.round((totalSentiments.neutral / total) * 100), color: '#fde047' },
        { name: 'Negative', value: Math.round((totalSentiments.negative / total) * 100), color: '#fca5a5' },
        { name: 'Highly Negative', value: Math.round((totalSentiments.highlyNegative / total) * 100), color: '#ef4444' },
      ]);

    } catch (error) {
      console.error('Error in analyzeCurrencyPairs:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze sentiment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    analyzeCurrencyPairs();
    
    // Refresh every 5 minutes
    const interval = setInterval(analyzeCurrencyPairs, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <CircularProgress />
        <Typography variant="body1" className="ml-3">
          Analyzing market sentiment...
        </Typography>
      </div>
    );
  }

  if (error) {
    return (
      <Paper className="p-6 bg-[#1C1C1E] text-center">
        <Typography color="error" className="mb-4">
          {error}
        </Typography>
      </Paper>
    );
  }

  return (
    <div className="space-y-6">
      <Typography variant="h4" component="h1" className="font-bold mb-6">
        Sentiment Analysis
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper className="p-6 bg-[#1C1C1E]">
            <Typography variant="h6" className="mb-4">
              Sentiment Distribution by Currency Pair
            </Typography>
            <Box className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={currencyPairData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="currency" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1C1C1E',
                      border: 'none',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="positive" stackId="a" fill="#22c55e" name="Positive" />
                  <Bar dataKey="negative" stackId="a" fill="#ef4444" name="Negative" />
                  <Bar dataKey="neutral" stackId="a" fill="#fde047" name="Neutral" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper className="p-6 bg-[#1C1C1E]">
            <Typography variant="h6" className="mb-4">
              Overall Sentiment Distribution
            </Typography>
            <Box className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1C1C1E',
                      border: 'none',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => `${value}%`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <div className="mt-4">
              {distributionData.map((item) => (
                <div key={item.name} className="flex items-center mb-2">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: item.color }}
                  />
                  <Typography variant="body2">
                    {item.name}: {item.value}%
                  </Typography>
                </div>
              ))}
            </div>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper className="p-6 bg-[#1C1C1E]">
            <Typography variant="h6" className="mb-4">
              Detailed Analysis by Currency Pair
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Currency Pair</TableCell>
                    <TableCell align="right">Positive</TableCell>
                    <TableCell align="right">Negative</TableCell>
                    <TableCell align="right">Neutral</TableCell>
                    <TableCell align="right">Overall Score</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currencyPairData.map((row) => (
                    <TableRow key={row.currency}>
                      <TableCell component="th" scope="row">
                        {row.currency}
                      </TableCell>
                      <TableCell align="right">{row.positive}%</TableCell>
                      <TableCell align="right">{row.negative}%</TableCell>
                      <TableCell align="right">{row.neutral}%</TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color:
                            row.overall >= 0.7
                              ? '#22c55e'
                              : row.overall <= 0.3
                              ? '#ef4444'
                              : '#fde047',
                        }}
                      >
                        {row.overall.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default Analysis; 