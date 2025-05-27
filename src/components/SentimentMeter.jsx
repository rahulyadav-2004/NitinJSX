import React, { useEffect, useState } from 'react';
import { Typography, Box } from '@mui/material';

const SentimentMeter = ({ value }) => {
  const [animatedValue, setAnimatedValue] = useState(0.5);
  
  useEffect(() => {
    setAnimatedValue(value);
  }, [value]);

  // Convert 0-1 range to degrees
  const rotation = -90 + (animatedValue * 180);
  
  // Apple-style colors with gradients
  const getGradientColors = () => {
    if (value >= 0.7) return {
      primary: '#30d158',
      secondary: '#28bd4c',
      gradient: 'from-[#34C759]/20 to-[#30d158]/5',
      glow: '#30d15840'
    };
    if (value <= 0.3) return {
      primary: '#ff453a',
      secondary: '#e03a30',
      gradient: 'from-[#ff453a]/20 to-[#ff453a]/5',
      glow: '#ff453a40'
    };
    return {
      primary: '#ff9f0a',
      secondary: '#f0950a',
      gradient: 'from-[#ff9f0a]/20 to-[#ff9f0a]/5',
      glow: '#ff9f0a40'
    };
  };

  const colors = getGradientColors();

  // Generate tick marks
  const ticks = Array.from({ length: 41 }, (_, i) => i * 4.5 - 90);

  return (
    <div className="relative w-full">
      <div className="aspect-[3/1.2] relative max-w-[1400px] mx-auto">
        {/* Speedometer background */}
        <div className="absolute inset-0 bottom-0 overflow-hidden">
          <div className="absolute bottom-0 left-1/2 w-full aspect-[3/1.2] -translate-x-1/2 bg-[#1d1d1f] rounded-t-[100px] border border-gray-800/50 shadow-2xl backdrop-blur-xl">
            {/* Animated gradient background */}
            <div className={`absolute inset-0 bg-gradient-radial ${colors.gradient} animate-pulse-slow`} />
            
            {/* Glass effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
            
            {/* Tick marks */}
            {ticks.map((deg) => (
              <div
                key={deg}
                className="absolute bottom-0 left-1/2 origin-bottom transform -translate-x-1/2"
                style={{
                  height: '65%',
                  transform: `rotate(${deg}deg)`,
                }}
              >
                <div
                  className={`transition-all duration-300 ${
                    deg > rotation - 2 && deg < rotation + 2
                      ? 'h-[32px] w-[3px] bg-white shadow-glow'
                      : deg % 9 === 0
                      ? 'h-[24px] w-[2px] bg-gray-400'
                      : 'h-[12px] w-[1.5px] bg-gray-600'
                  }`}
                  style={{
                    boxShadow: deg > rotation - 2 && deg < rotation + 2 ? `0 0 15px ${colors.primary}` : 'none'
                  }}
                />
                {deg % 36 === 0 && (
                  <div
                    className={`absolute left-1/2 transform -translate-x-1/2 transition-all duration-300 ${
                      // Special styling for main values (0.1, 0.3, 0.5, 0.7, 0.9)
                      [0.1, 0.3, 0.5, 0.7, 0.9].includes(((deg + 90) / 180))
                        ? '-top-10 text-base font-semibold bg-[#1d1d1f]/90 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-gray-800/50'
                        : '-top-4 text-xs font-medium'
                    }`}
                    style={{
                      transform: `translateX(-50%) rotate(${-deg}deg)`,
                      color: deg > rotation - 10 && deg < rotation + 10 
                        ? colors.primary 
                        : [0.1, 0.3, 0.5, 0.7, 0.9].includes(((deg + 90) / 180))
                          ? '#999'
                          : '#666',
                      textShadow: deg > rotation - 10 && deg < rotation + 10 ? `0 0 10px ${colors.glow}` : 'none',
                      boxShadow: [0.1, 0.3, 0.5, 0.7, 0.9].includes(((deg + 90) / 180))
                        ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                        : 'none',
                      opacity: [0.1, 0.3, 0.5, 0.7, 0.9].includes(((deg + 90) / 180)) ? 1 : 0.7,
                      zIndex: [0.1, 0.3, 0.5, 0.7, 0.9].includes(((deg + 90) / 180)) ? 10 : 1
                    }}
                  >
                    {/* Only show one decimal place for main values */}
                    {[0.1, 0.3, 0.5, 0.7, 0.9].includes(((deg + 90) / 180))
                      ? ((deg + 90) / 180).toFixed(1)
                      : ''}
                  </div>
                )}
              </div>
            ))}

            {/* Needle */}
            <div
              className="absolute bottom-0 left-1/2 w-1 origin-bottom transform -translate-x-1/2 transition-transform duration-1000 ease-out"
              style={{
                height: '64%',
                transform: `rotate(${rotation}deg)`,
              }}
            >
              {/* Needle glow effect */}
              <div 
                className="absolute h-full w-2 blur-sm opacity-50"
                style={{ backgroundColor: colors.primary }}
              />
              
              {/* Needle body */}
              <div className="absolute h-full w-1 bg-white" />
              
              {/* Needle tip */}
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <div 
                  className="h-6 w-6 rounded-full shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                    boxShadow: `0 0 30px ${colors.glow}`
                  }}
                />
              </div>
              
              {/* Needle base */}
              <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                <div className="h-6 w-6 rounded-full bg-white shadow-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Value display */}
      <Box
        className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-center"
        sx={{
          animation: 'float 3s ease-in-out infinite'
        }}
      >
        <div
          className="inline-block px-10 py-4 rounded-xl font-medium text-2xl backdrop-blur-xl transition-all duration-300 border border-white/10"
          style={{
            backgroundColor: `${colors.primary}10`,
            color: colors.primary,
            boxShadow: `0 8px 32px ${colors.glow}`,
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold">{(value * 100).toFixed(1)}%</span>
            <div className="h-8 w-[1px] bg-current opacity-20" />
            <span className="text-xl">{value >= 0.5 ? 'Bullish' : 'Bearish'}</span>
          </div>
        </div>
      </Box>

      {/* Labels */}
      <div className="absolute top-8 left-0 right-0 max-w-[1200px] mx-auto flex justify-between px-24">
        <Typography 
          variant="h6" 
          className="font-bold tracking-wider transition-all duration-300 text-sm"
          style={{ 
            color: value <= 0.3 ? '#ff453a' : '#666',
            textShadow: value <= 0.3 ? '0 0 20px rgba(255, 69, 58, 0.3)' : 'none',
            letterSpacing: '0.1em'
          }}
        >
          BEARISH
        </Typography>
        <Typography 
          variant="h6" 
          className="font-bold tracking-wider transition-all duration-300 text-sm"
          style={{ 
            color: value >= 0.7 ? '#30d158' : '#666',
            textShadow: value >= 0.7 ? '0 0 20px rgba(48, 209, 88, 0.3)' : 'none',
            letterSpacing: '0.1em'
          }}
        >
          BULLISH
        </Typography>
      </div>
    </div>
  );
};

export default SentimentMeter; 