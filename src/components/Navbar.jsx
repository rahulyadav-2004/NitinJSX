import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  NewspaperIcon,
  ArrowTrendingUpIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  { path: '/', icon: ChartBarIcon, label: 'Dashboard' },
  { path: '/news', icon: NewspaperIcon, label: 'News' },
  { path: '/predictions', icon: ArrowTrendingUpIcon, label: 'Predictions' },
  { path: '/settings', icon: Cog6ToothIcon, label: 'Settings' },
];

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="fixed left-0 top-0 h-screen w-72 bg-[#1C1C1E]/95 backdrop-blur-2xl border-r border-gray-800/50 z-50">
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="p-8">
          <div className="flex items-center space-x-3 mb-12">
            <div className="relative">
              <SparklesIcon className="w-10 h-10 text-blue-500" />
              <div className="absolute inset-0 animate-pulse-slow">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
                Renaissance
              </h1>
              <p className="text-sm text-gray-500">AI Trading Assistant</p>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20'
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                  }`}
                >
                  {/* Background glow effect for active item */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 blur-xl" />
                  )}
                  
                  {/* Icon with hover animation */}
                  <div className={`relative transition-transform duration-300 ${
                    isActive ? 'scale-110' : 'group-hover:scale-110'
                  }`}>
                    <Icon className="w-5 h-5 mr-3" />
                  </div>
                  
                  {/* Label */}
                  <span className="font-medium tracking-wide">{item.label}</span>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute right-3 w-2 h-2 rounded-full bg-white shadow-glow animate-pulse" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Status Section */}
        <div className="mt-auto p-8 border-t border-gray-800/50 bg-gradient-to-t from-gray-900/50">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse">
                <div className="absolute w-full h-full rounded-full bg-green-500 animate-ping opacity-75" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">Real-time Updates</p>
              <p className="text-xs text-gray-500">Last sync: {new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 