import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import News from './pages/News';
import Predictions from './pages/Predictions';
import Settings from './pages/Settings';
import './App.css';

function App() {
  const [themeMode, setThemeMode] = useState(() => {
    // Get initial theme from localStorage or default to dark
    try {
      const savedSettings = localStorage.getItem('tradingSettings');
      if (savedSettings) {
        const { displaySettings } = JSON.parse(savedSettings);
        return displaySettings?.darkMode ? 'dark' : 'light';
      }
    } catch (error) {
      console.error('Error loading theme settings:', error);
    }
    return 'dark';
  });

  const theme = createTheme({
    palette: {
      mode: themeMode,
      primary: {
        main: '#007AFF',
      },
      secondary: {
        main: '#5856D6',
      },
      background: {
        default: themeMode === 'dark' ? '#000000' : '#F2F2F7',
        paper: themeMode === 'dark' ? '#1C1C1E' : '#FFFFFF',
      },
    },
    typography: {
      fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
          },
        },
      },
    },
  });

  // Listen for settings changes
  useEffect(() => {
    const handleSettingsChange = (event) => {
      const { displaySettings } = event.detail;
      if (displaySettings) {
        setThemeMode(displaySettings.darkMode ? 'dark' : 'light');
        // Apply dark mode class for Tailwind
        document.documentElement.classList.toggle('dark', displaySettings.darkMode);
      }
    };

    window.addEventListener('settingsChanged', handleSettingsChange);
    return () => window.removeEventListener('settingsChanged', handleSettingsChange);
  }, []);

  // Apply initial dark mode class
  useEffect(() => {
    document.documentElement.classList.toggle('dark', themeMode === 'dark');
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="App min-h-screen bg-[#000000] dark:bg-black">
          <Navbar />
          <main className="ml-72 p-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/news" element={<News />} />
              <Route path="/predictions" element={<Predictions />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
