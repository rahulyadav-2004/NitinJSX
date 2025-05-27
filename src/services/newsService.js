import axios from 'axios';

const API_KEY = 'pub_71860a8c452eca5ebf93447255a71fcbc0f97';
const BASE_URL = 'https://newsdata.io/api/1';

// Cache structure
const NEWS_CACHE = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

const analyzeSentiment = (text) => {
  const positiveWords = ['bullish', 'surge', 'gain', 'positive', 'up', 'rise', 'growth', 'strong', 'boost', 'rally', 'recover'];
  const negativeWords = ['bearish', 'fall', 'drop', 'negative', 'down', 'decline', 'weak', 'loss', 'crash', 'plunge', 'risk'];
  
  const lowerText = text.toLowerCase();
  let score = 0.5;
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });
  
  // Calculate weighted score
  if (positiveCount > 0 || negativeCount > 0) {
    score = (positiveCount) / (positiveCount + negativeCount);
  }
  
  return Math.max(0, Math.min(1, score));
};

// Check if cache is valid
const isCacheValid = (cacheKey) => {
  const cache = NEWS_CACHE[cacheKey];
  if (!cache) return false;
  
  const now = Date.now();
  return now - cache.timestamp < CACHE_DURATION;
};

export const getFinancialNews = async (selectedCategory = 'All News') => {
  try {
    console.log('Fetching news...');
    
    // Create cache key based on timestamp (hourly)
    const cacheKey = `news-${Math.floor(Date.now() / (60 * 60 * 1000))}`;
    
    // Check cache first
    if (isCacheValid(cacheKey)) {
      console.log('Returning cached news');
      return NEWS_CACHE[cacheKey].data;
    }

    console.log('Making API request to newsdata.io...');
    
    const response = await axios.get(`${BASE_URL}/news`, {
      params: {
        apikey: API_KEY,
        language: 'en',
        category: 'business',
        q: 'forex OR "foreign exchange" OR currency OR financial markets OR economy OR trading',
        size: 10  // Number of articles per request
      },
      timeout: 10000, // 10 second timeout
    });

    console.log('API Response status:', response.status);

    if (!response.data || response.data.status === 'error') {
      throw new Error(response.data?.message || 'Invalid response from news API');
    }

    if (!Array.isArray(response.data.results)) {
      console.error('Invalid response format:', response.data);
      throw new Error('Invalid response format from news API');
    }

    const newsData = response.data;
    const articlesWithSentiment = newsData.results.map(article => ({
      ...article,
      sentiment: analyzeSentiment(article.title + ' ' + (article.description || '')),
    }));

    const processedData = {
      ...newsData,
      results: articlesWithSentiment,
    };

    // Cache the results
    NEWS_CACHE[cacheKey] = {
      data: processedData,
      timestamp: Date.now(),
    };

    console.log('Successfully fetched and processed news articles:', processedData.results.length);
    return processedData;
  } catch (error) {
    console.error('Error details:', error);
    
    if (error.response) {
      console.error('API Error Response:', error.response.data);
      
      // Handle rate limit error
      if (error.response.status === 429) {
        console.log('Rate limit reached, checking cache...');
        // Return cached data if available
        const cacheKey = `news-${Math.floor(Date.now() / (60 * 60 * 1000))}`;
        if (NEWS_CACHE[cacheKey]) {
          console.log('Returning cached data due to rate limit');
          return NEWS_CACHE[cacheKey].data;
        }
        throw new Error(
          'Rate limit reached. We can fetch new articles in a few minutes. ' +
          'This is a limitation of our free API tier. ' +
          'Please try again shortly.'
        );
      }

      throw new Error(`News API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }

    if (error.request) {
      throw new Error('Unable to reach the news service. Please check your internet connection.');
    }

    throw new Error('Failed to fetch news: ' + error.message);
  }
};

// Add a delay utility function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const retryGetFinancialNews = async (
  selectedCategory,
  maxRetries = 3
) => {
  let lastError = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Attempt ${i + 1} of ${maxRetries} to fetch news...`);
      return await getFinancialNews(selectedCategory);
    } catch (error) {
      lastError = error;
      console.error(`Retry attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) break;
      const delayTime = 1000 * Math.pow(2, i); // Exponential backoff
      console.log(`Waiting ${delayTime}ms before next retry...`);
      await delay(delayTime);
    }
  }

  throw new Error(`Failed to fetch news after ${maxRetries} attempts: ${lastError?.message}`);
};

export const getNextPage = async (nextPageToken) => {
  try {
    console.log('Fetching next page with token:', nextPageToken);
    
    const response = await axios.get(`${BASE_URL}/news`, {
      params: {
        apikey: API_KEY,
        page: nextPageToken,
      }
    });

    if (!response.data || response.data.status === 'error') {
      throw new Error(response.data?.message || 'Invalid response from news API');
    }

    const newsData = response.data;
    
    const articlesWithSentiment = newsData.results.map(article => ({
      ...article,
      sentiment: analyzeSentiment(article.title + ' ' + (article.description || '')),
    }));

    console.log('Successfully fetched next page:', articlesWithSentiment.length, 'articles');
    return {
      ...newsData,
      results: articlesWithSentiment,
    };
  } catch (error) {
    console.error('Error fetching next page:', error);
    throw error;
  }
}; 