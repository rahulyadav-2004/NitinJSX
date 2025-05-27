import axios from 'axios';

const GROQ_API_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;

export const analyzeSentimentWithGroq = async (articles) => {
  try {
    if (!GROQ_API_KEY) {
      throw new Error('Groq API key is not configured');
    }

    console.log('Analyzing sentiment for articles:', articles.length);

    // Prepare the prompt
    const prompt = `Analyze these financial news articles for forex market sentiment:

${articles.map((article, idx) => `
[Article ${idx + 1}]
Title: ${article.title}
Content: ${article.content || article.description || 'No content available'}
Source: ${article.source_id}
Date: ${article.pubDate}
---`).join('\n')}

Provide your analysis in exactly this format:
SENTIMENT: [a number between 0 and 1]
POSITIVE SIGNAL: [description] | CONFIDENCE: [number between 1-100]
POSITIVE SIGNAL: [description] | CONFIDENCE: [number between 1-100]
NEGATIVE SIGNAL: [description] | CONFIDENCE: [number between 1-100]
NEGATIVE SIGNAL: [description] | CONFIDENCE: [number between 1-100]
ANALYSIS: [2-3 sentence market analysis]`;

    const response = await axios.post(
      GROQ_API_ENDPOINT,
      {
        model: "llama3-8b-8192",
        messages: [
          {
            role: "system",
            content: "You are an expert financial analyst specializing in forex markets. Analyze news articles and provide detailed market sentiment analysis. Always format your response exactly as specified."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    if (!content) {
      throw new Error('No response content from Groq');
    }

    // Parse the response
    const lines = content.split('\n');
    let overallSentiment = 0.5;
    const positiveSignals = [];
    const negativeSignals = [];
    let analysis = "";

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine.toLowerCase().startsWith('sentiment:')) {
        let sentiment = parseFloat(trimmedLine.split(':')[1].trim());
        if (sentiment > 1) {
          sentiment = sentiment / 100;
        }
        overallSentiment = sentiment;
      } else if (trimmedLine.toLowerCase().startsWith('positive signal:')) {
        const [signal, confidence] = trimmedLine.split('|');
        const signalText = signal.replace('POSITIVE SIGNAL:', '').trim();
        const confidenceValue = parseFloat(confidence.split(':')[1].trim()) / 100;
        positiveSignals.push({
          title: signalText,
          timestamp: new Date().toISOString(),
          impact: 'positive',
          confidence: confidenceValue
        });
      } else if (trimmedLine.toLowerCase().startsWith('negative signal:')) {
        const [signal, confidence] = trimmedLine.split('|');
        const signalText = signal.replace('NEGATIVE SIGNAL:', '').trim();
        const confidenceValue = parseFloat(confidence.split(':')[1].trim()) / 100;
        negativeSignals.push({
          title: signalText,
          timestamp: new Date().toISOString(),
          impact: 'negative',
          confidence: confidenceValue
        });
      } else if (trimmedLine.toLowerCase().startsWith('analysis:')) {
        analysis = trimmedLine.replace('ANALYSIS:', '').trim();
      }
    });

    console.log('Sentiment analysis complete');
    return {
      overallSentiment,
      positiveSignals,
      negativeSignals,
      analysis
    };
  } catch (error) {
    console.error('Error in analyzeSentimentWithGroq:', error);
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('Groq API key is invalid or not configured properly. Please check your settings.');
      }
      if (error.message.includes('429')) {
        throw new Error('Groq API rate limit reached. Please try again in a few minutes.');
      }
      throw new Error(`Failed to analyze sentiment: ${error.message}`);
    }
    throw new Error('Failed to analyze sentiment with Groq');
  }
}; 