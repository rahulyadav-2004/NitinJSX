import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Slider,
  Alert,
  Snackbar,
  Box,
} from '@mui/material';
import {
  BellIcon,
  ChartBarIcon,
  SwatchIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const Settings = () => {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    frequency: 'realtime',
  });

  const [tradingPreferences, setTradingPreferences] = useState({
    defaultRiskReward: 2,
    stopLossPercent: 1.5,
    takeProfitPercent: 3.0,
    volatilityThreshold: 2.0,
  });

  const [displaySettings, setDisplaySettings] = useState({
    darkMode: true,
    realtimeUpdates: true,
    showConfidence: true,
    chartType: 'area',
    timeframe: '24h',
  });

  const [selectedPairs, setSelectedPairs] = useState([
    'EURUSD',
    'GBPUSD',
    'USDINR',
  ]);

  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load saved settings on component mount
  useEffect(() => {
    const loadSavedSettings = () => {
      try {
        const savedSettings = localStorage.getItem('tradingSettings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          
          // Update each state with saved values if they exist
          if (parsed.notifications) setNotifications(parsed.notifications);
          if (parsed.tradingPreferences) setTradingPreferences(parsed.tradingPreferences);
          if (parsed.displaySettings) {
            setDisplaySettings(prev => {
              const newSettings = { ...prev, ...parsed.displaySettings };
              // Apply dark mode
              document.documentElement.classList.toggle('dark', newSettings.darkMode);
              return newSettings;
            });
          }
          if (parsed.selectedPairs) setSelectedPairs(parsed.selectedPairs);
        }
      } catch (error) {
        console.error('Error loading saved settings:', error);
      }
    };

    loadSavedSettings();
  }, []);

  // Track changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [notifications, tradingPreferences, displaySettings, selectedPairs]);

  // Handle dark mode changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', displaySettings.darkMode);
  }, [displaySettings.darkMode]);

  const handleNotificationChange = (key) => (event) => {
    setNotifications(prev => ({
      ...prev,
      [key]: event.target.checked,
    }));
  };

  const handleFrequencyChange = (event) => {
    setNotifications(prev => ({
      ...prev,
      frequency: event.target.value,
    }));
  };

  const handleDisplaySettingChange = (key) => (event) => {
    setDisplaySettings(prev => ({
      ...prev,
      [key]: event.target.checked,
    }));
  };

  const handleChartTypeChange = (event) => {
    setDisplaySettings(prev => ({
      ...prev,
      chartType: event.target.value,
    }));
  };

  const handleTimeframeChange = (event) => {
    setDisplaySettings(prev => ({
      ...prev,
      timeframe: event.target.value,
    }));
  };

  const handlePairsChange = (event) => {
    setSelectedPairs(event.target.value);
  };

  const handleRiskRewardChange = (_event, newValue) => {
    setTradingPreferences(prev => ({
      ...prev,
      defaultRiskReward: newValue,
    }));
  };

  const handleStopLossChange = (_event, newValue) => {
    setTradingPreferences(prev => ({
      ...prev,
      stopLossPercent: newValue,
    }));
  };

  const handleTakeProfitChange = (_event, newValue) => {
    setTradingPreferences(prev => ({
      ...prev,
      takeProfitPercent: newValue,
    }));
  };

  const handleVolatilityThresholdChange = (_event, newValue) => {
    setTradingPreferences(prev => ({
      ...prev,
      volatilityThreshold: newValue,
    }));
  };

  const handleSaveSettings = () => {
    try {
      // Save to localStorage
      const settingsToSave = {
        notifications,
        tradingPreferences,
        displaySettings,
        selectedPairs,
      };
      
      localStorage.setItem('tradingSettings', JSON.stringify(settingsToSave));
      
      // Publish settings changed event for other components
      const event = new CustomEvent('settingsChanged', { 
        detail: settingsToSave 
      });
      window.dispatchEvent(event);
      
      setShowSaveSuccess(true);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      // Show error notification
      setShowSaveSuccess(false);
      // You might want to add error state and show error notification
    }
  };

  // Prompt user when leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col space-y-2">
        <Typography variant="h4" className="font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
          Settings
        </Typography>
        <Typography variant="body1" className="text-gray-400">
          Customize your trading experience and preferences
          {hasUnsavedChanges && (
            <span className="ml-2 text-yellow-500">(Unsaved changes)</span>
          )}
        </Typography>
      </div>

      <Grid container spacing={4}>
        {/* Trading Preferences */}
        <Grid item xs={12} md={6}>
          <Paper className="p-6 bg-[#1C1C1E]/80 backdrop-blur-xl rounded-2xl border border-gray-800/50 transition-all duration-300 hover:shadow-2xl hover:border-blue-500/20">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-500/10 rounded-xl">
                <CurrencyDollarIcon className="w-6 h-6 text-blue-500" />
              </div>
              <Typography variant="h6" className="font-semibold">
                Trading Preferences
              </Typography>
            </div>
            <div className="space-y-8">
              <div>
                <Typography variant="subtitle2" className="text-gray-400 mb-2">
                  Risk/Reward Ratio
                </Typography>
                <Slider
                  value={tradingPreferences.defaultRiskReward}
                  onChange={handleRiskRewardChange}
                  min={1}
                  max={5}
                  step={0.1}
                  marks
                  valueLabelDisplay="auto"
                  sx={{
                    '& .MuiSlider-thumb': {
                      backgroundColor: '#007AFF',
                    },
                    '& .MuiSlider-track': {
                      background: 'linear-gradient(90deg, #007AFF, #5856D6)',
                    },
                  }}
                />
              </div>
              <div>
                <Typography variant="subtitle2" className="text-gray-400 mb-2">
                  Stop Loss (%)
                </Typography>
                <Slider
                  value={tradingPreferences.stopLossPercent}
                  onChange={handleStopLossChange}
                  min={0.5}
                  max={5}
                  step={0.1}
                  marks
                  valueLabelDisplay="auto"
                  sx={{
                    '& .MuiSlider-thumb': {
                      backgroundColor: '#FF453A',
                    },
                    '& .MuiSlider-track': {
                      background: 'linear-gradient(90deg, #FF453A, #FF9F0A)',
                    },
                  }}
                />
              </div>
              <div>
                <Typography variant="subtitle2" className="text-gray-400 mb-2">
                  Take Profit (%)
                </Typography>
                <Slider
                  value={tradingPreferences.takeProfitPercent}
                  onChange={handleTakeProfitChange}
                  min={1}
                  max={10}
                  step={0.5}
                  marks
                  valueLabelDisplay="auto"
                  sx={{
                    '& .MuiSlider-thumb': {
                      backgroundColor: '#30D158',
                    },
                    '& .MuiSlider-track': {
                      background: 'linear-gradient(90deg, #30D158, #34C759)',
                    },
                  }}
                />
              </div>
              <div>
                <Typography variant="subtitle2" className="text-gray-400 mb-2">
                  Volatility Alert (%)
                </Typography>
                <Slider
                  value={tradingPreferences.volatilityThreshold}
                  onChange={handleVolatilityThresholdChange}
                  min={0.5}
                  max={5}
                  step={0.1}
                  marks
                  valueLabelDisplay="auto"
                  sx={{
                    '& .MuiSlider-thumb': {
                      backgroundColor: '#FF9F0A',
                    },
                    '& .MuiSlider-track': {
                      background: 'linear-gradient(90deg, #FF9F0A, #FFD60A)',
                    },
                  }}
                />
              </div>
            </div>
          </Paper>
        </Grid>

        {/* Notifications */}
        <Grid item xs={12} md={6}>
          <Paper className="p-6 bg-[#1C1C1E]/80 backdrop-blur-xl rounded-2xl border border-gray-800/50 transition-all duration-300 hover:shadow-2xl hover:border-blue-500/20">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-purple-500/10 rounded-xl">
                <BellIcon className="w-6 h-6 text-purple-500" />
              </div>
              <Typography variant="h6" className="font-semibold">
                Notifications
              </Typography>
            </div>
            <div className="space-y-6">
              <div className="space-y-4">
                <FormControlLabel
                  control={
                    <Switch
                      checked={notifications.email}
                      onChange={handleNotificationChange('email')}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#5856D6',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#5856D6',
                        },
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2" className="text-gray-300">
                      Email Alerts
                    </Typography>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={notifications.push}
                      onChange={handleNotificationChange('push')}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#5856D6',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#5856D6',
                        },
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2" className="text-gray-300">
                      Push Notifications
                    </Typography>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={notifications.sms}
                      onChange={handleNotificationChange('sms')}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#5856D6',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#5856D6',
                        },
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2" className="text-gray-300">
                      SMS Alerts
                    </Typography>
                  }
                />
              </div>
              <Divider className="border-gray-800" />
              <div>
                <Typography variant="subtitle2" className="text-gray-400 mb-3">
                  Alert Frequency
                </Typography>
                <FormControl fullWidth variant="outlined" size="small">
                  <Select
                    value={notifications.frequency}
                    onChange={handleFrequencyChange}
                    className="bg-[#2C2C2E] rounded-xl"
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(107, 114, 128, 0.2)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(88, 86, 214, 0.5)',
                      },
                    }}
                  >
                    <MenuItem value="realtime">Real-time</MenuItem>
                    <MenuItem value="hourly">Hourly</MenuItem>
                    <MenuItem value="daily">Daily</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>
          </Paper>
        </Grid>

        {/* Market Analysis */}
        <Grid item xs={12}>
          <Paper className="p-6 bg-[#1C1C1E]/80 backdrop-blur-xl rounded-2xl border border-gray-800/50 transition-all duration-300 hover:shadow-2xl hover:border-blue-500/20">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-500/10 rounded-xl">
                <ChartBarIcon className="w-6 h-6 text-green-500" />
              </div>
              <Typography variant="h6" className="font-semibold">
                Market Analysis
              </Typography>
            </div>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <div className="space-y-4">
                  <Typography variant="subtitle2" className="text-gray-400">
                    Currency Pairs
                  </Typography>
                  <FormControl fullWidth variant="outlined" size="small">
                    <Select
                      multiple
                      value={selectedPairs}
                      onChange={handlePairsChange}
                      className="bg-[#2C2C2E] rounded-xl"
                      sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(107, 114, 128, 0.2)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(52, 199, 89, 0.5)',
                        },
                      }}
                      renderValue={(selected) => (
                        <Box className="flex flex-wrap gap-1">
                          {selected.map((value) => (
                            <Box
                              key={value}
                              className="px-2 py-0.5 bg-green-500/10 rounded-md text-green-500 text-sm"
                            >
                              {value}
                            </Box>
                          ))}
                        </Box>
                      )}
                    >
                      <MenuItem value="EURUSD">EUR/USD</MenuItem>
                      <MenuItem value="GBPUSD">GBP/USD</MenuItem>
                      <MenuItem value="USDJPY">USD/JPY</MenuItem>
                      <MenuItem value="USDINR">USD/INR</MenuItem>
                      <MenuItem value="EURINR">EUR/INR</MenuItem>
                      <MenuItem value="GBPINR">GBP/INR</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </Grid>
              <Grid item xs={12} md={6}>
                <div className="space-y-4">
                  <Typography variant="subtitle2" className="text-gray-400">
                    Analysis Timeframe
                  </Typography>
                  <FormControl fullWidth variant="outlined" size="small">
                    <Select
                      value={displaySettings.timeframe}
                      onChange={handleTimeframeChange}
                      className="bg-[#2C2C2E] rounded-xl"
                      sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(107, 114, 128, 0.2)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(52, 199, 89, 0.5)',
                        },
                      }}
                    >
                      <MenuItem value="1h">1 Hour</MenuItem>
                      <MenuItem value="4h">4 Hours</MenuItem>
                      <MenuItem value="12h">12 Hours</MenuItem>
                      <MenuItem value="24h">24 Hours</MenuItem>
                      <MenuItem value="7d">7 Days</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Display Settings */}
        <Grid item xs={12}>
          <Paper className="p-6 bg-[#1C1C1E]/80 backdrop-blur-xl rounded-2xl border border-gray-800/50 transition-all duration-300 hover:shadow-2xl hover:border-blue-500/20">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-orange-500/10 rounded-xl">
                <SwatchIcon className="w-6 h-6 text-orange-500" />
              </div>
              <Typography variant="h6" className="font-semibold">
                Display Settings
              </Typography>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormControlLabel
                  control={
                    <Switch
                      checked={displaySettings.darkMode}
                      onChange={handleDisplaySettingChange('darkMode')}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#FF9F0A',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#FF9F0A',
                        },
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2" className="text-gray-300">
                      Dark Mode
                    </Typography>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={displaySettings.realtimeUpdates}
                      onChange={handleDisplaySettingChange('realtimeUpdates')}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#FF9F0A',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#FF9F0A',
                        },
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2" className="text-gray-300">
                      Real-time Updates
                    </Typography>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={displaySettings.showConfidence}
                      onChange={handleDisplaySettingChange('showConfidence')}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#FF9F0A',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#FF9F0A',
                        },
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2" className="text-gray-300">
                      Show Confidence
                    </Typography>
                  }
                />
              </div>
              <Divider className="border-gray-800" />
              <div>
                <Typography variant="subtitle2" className="text-gray-400 mb-3">
                  Chart Type
                </Typography>
                <FormControl fullWidth variant="outlined" size="small">
                  <Select
                    value={displaySettings.chartType}
                    onChange={handleChartTypeChange}
                    className="bg-[#2C2C2E] rounded-xl"
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(107, 114, 128, 0.2)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 159, 10, 0.5)',
                      },
                    }}
                  >
                    <MenuItem value="area">Area Chart</MenuItem>
                    <MenuItem value="line">Line Chart</MenuItem>
                    <MenuItem value="candlestick">Candlestick Chart</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>
          </Paper>
        </Grid>

        {/* Save Button */}
        <Grid item xs={12}>
          <div className="flex justify-end">
            <Button
              variant="contained"
              onClick={handleSaveSettings}
              className="px-8 py-3"
              startIcon={<ArrowPathIcon className="w-5 h-5" />}
              disabled={!hasUnsavedChanges}
              sx={{
                background: hasUnsavedChanges 
                  ? 'linear-gradient(45deg, #007AFF, #5856D6)'
                  : 'linear-gradient(45deg, #6B7280, #9CA3AF)',
                '&:hover': {
                  background: hasUnsavedChanges
                    ? 'linear-gradient(45deg, #0062CC, #4845AA)'
                    : 'linear-gradient(45deg, #6B7280, #9CA3AF)',
                },
                borderRadius: '12px',
                textTransform: 'none',
                opacity: hasUnsavedChanges ? 1 : 0.7,
              }}
            >
              {hasUnsavedChanges ? 'Save Changes' : 'No Changes'}
            </Button>
          </div>
        </Grid>
      </Grid>

      <Snackbar
        open={showSaveSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSaveSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          variant="filled"
          sx={{
            backgroundColor: '#34C759',
            color: 'white',
            borderRadius: '12px',
          }}
        >
          Settings saved successfully
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Settings; 