import React, { useEffect, useState } from 'react';
import {
  Paper,
  Typography,
  Chip,
  InputBase,
  IconButton,
  CircularProgress,
  Button,
  Box,
} from '@mui/material';
import {
  MagnifyingGlassIcon,
  ClockIcon,
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { retryGetFinancialNews } from '../services/newsService';
import { format } from 'date-fns';

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [nextPageToken, setNextPageToken] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [retryTimeout, setRetryTimeout] = useState(null);

  const handleRetry = () => {
    if (retryTimeout) {
      clearTimeout(retryTimeout);
    }
    
    const timeout = window.setTimeout(() => {
      fetchNews();
      setRetryTimeout(null);
    }, 5000);
    
    setRetryTimeout(timeout);
  };

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await retryGetFinancialNews('All News');
      if (response.results.length === 0) {
        setError('No news articles found. Please try again later.');
      } else {
        setNews(response.results);
        setNextPageToken(response.nextPage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch news. Please try again later.';
      setError(errorMessage);
      setNews([]);
      setNextPageToken(null);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!nextPageToken || loadingMore) return;
    
    try {
      setLoadingMore(true);
      const response = await retryGetFinancialNews('All News');
      setNews(prev => [...prev, ...response.results]);
      setNextPageToken(response.nextPage);
    } catch (err) {
      setError('Failed to load more news.');
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchNews();
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, []);

  const filteredNews = news.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (article.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSentimentColor = (sentiment) => {
    if (sentiment >= 0.7) return 'rgb(34 197 94)';
    if (sentiment <= 0.3) return 'rgb(239 68 68)';
    return 'rgb(234 179 8)';
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy h:mm a');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col space-y-6 md:flex-row md:justify-between md:items-center">
        <div>
          <Typography variant="h4" className="font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
            Financial News
          </Typography>
          <Typography variant="body1" className="text-gray-400 mt-1">
            Stay updated with the latest market insights
          </Typography>
        </div>

        {/* Search Bar */}
        <Paper className="flex items-center px-4 py-2 bg-[#1C1C1E]/80 backdrop-blur-xl border border-gray-800/50 rounded-xl w-full md:w-96 transition-all duration-300 hover:border-blue-500/20">
          <InputBase
            placeholder="Search news..."
            className="flex-1 text-gray-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <IconButton className="text-gray-400 hover:text-blue-500 transition-colors">
            <MagnifyingGlassIcon className="w-5 h-5" />
          </IconButton>
        </Paper>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="relative">
            <CircularProgress size={48} sx={{ color: '#007AFF' }} />
            <div className="absolute inset-0 animate-pulse-slow">
              <div className="w-12 h-12 rounded-full bg-blue-500/10" />
            </div>
          </div>
          <Typography variant="body1" className="text-gray-400">
            Fetching latest news...
          </Typography>
        </div>
      ) : error ? (
        <Paper className="p-8 bg-[#1C1C1E]/80 backdrop-blur-xl rounded-2xl border border-gray-800/50 text-center">
          <Typography color="error" className="mb-4">
            {error}
          </Typography>
          <Button
            variant="contained"
            onClick={handleRetry}
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
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6">
            {filteredNews.map((article, index) => (
              <Paper
                key={index}
                className="p-6 bg-[#1C1C1E]/80 backdrop-blur-xl rounded-2xl border border-gray-800/50 transition-all duration-300 hover:border-blue-500/20 hover:shadow-2xl group"
              >
                <div className="space-y-4">
                  {/* Article Header */}
                  <div className="flex justify-between items-start gap-4">
                    <Typography variant="h6" className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {article.title}
                    </Typography>
                    <Chip
                      label={`${(article.sentiment * 100).toFixed(1)}% ${article.sentiment >= 0.5 ? 'Bullish' : 'Bearish'}`}
                      sx={{
                        backgroundColor: `${getSentimentColor(article.sentiment)}20`,
                        color: getSentimentColor(article.sentiment),
                        fontWeight: 500,
                        '& .MuiChip-label': { px: 2 },
                        minWidth: 100,
                        textAlign: 'center',
                      }}
                    />
                  </div>

                  {/* Article Content */}
                  <Typography variant="body2" className="text-gray-400 leading-relaxed">
                    {article.description}
                  </Typography>

                  {/* Article Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-800/50">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-gray-500 text-sm">
                        <ClockIcon className="w-4 h-4 mr-1.5" />
                        {formatDate(article.publishedAt)}
                      </div>
                      <Chip
                        label={article.source}
                        size="small"
                        sx={{
                          backgroundColor: '#2C2C2E',
                          color: '#999',
                          height: 24,
                        }}
                      />
                    </div>
                    <a
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-500 hover:text-blue-400 transition-colors group/link"
                    >
                      <span className="mr-1.5">Read More</span>
                      <ArrowTopRightOnSquareIcon className="w-4 h-4 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                    </a>
                  </div>
                </div>
              </Paper>
            ))}
          </div>

          {nextPageToken && (
            <div className="flex justify-center mt-8">
              <Button
                variant="contained"
                onClick={loadMore}
                disabled={loadingMore}
                sx={{
                  background: 'linear-gradient(45deg, #007AFF, #5856D6)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #0062CC, #4845AA)',
                  },
                  minWidth: 150,
                  borderRadius: '12px',
                }}
              >
                {loadingMore ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default News; 