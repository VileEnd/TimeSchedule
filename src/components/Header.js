import React, { useState, useEffect } from 'react';
import ThemeToggle from './ThemeToggle.js';
import AISettingsModal from './AISettingsModal.js';
import SaveTools from './SaveTools.js';
import UnifiedAITools from './UnifiedAITools.js';

const Header = () => {
  const [currentTime, setCurrentTime] = useState('Loading...');
  const [showAISettings, setShowAISettings] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    updateLiveTimer();
    const interval = setInterval(updateLiveTimer, 1000);
    
    // Check for dark mode
    const checkDarkMode = () => {
      const darkMode = document.documentElement.classList.contains('dark');
      setIsDarkMode(darkMode);
    };
    
    // Initial check
    checkDarkMode();
    
    // Set up a mutation observer to watch for dark mode changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  const updateLiveTimer = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      timeZone: 'Europe/Berlin' 
    });
    
    const dateString = now.toLocaleDateString('de-DE', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      timeZone: 'Europe/Berlin' 
    });
    
    setCurrentTime(`${dateString}, ${timeString}`);
  };

  // Logo SVG components
  const LightLogo = () => (
    <svg width="200" height="50" viewBox="0 0 260 64" xmlns="http://www.w3.org/2000/svg" fill="none">
      <defs>
        <linearGradient id="daygrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366F1"/>
          <stop offset="100%" stopColor="#EC4899"/>
        </linearGradient>
      </defs>

      {/* Croissant crescent body */}
      <path d="M26 44C17 41 13 32 18 24C21 18 28 15 32 15C36 15 43 18 46 24C51 32 47 41 38 44C34 45 30 45 26 44Z"
            stroke="url(#daygrad)" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Croissant segment curves */}
      <path d="M24 44C22 36 22 28 25 20" stroke="url(#daygrad)" strokeWidth="2" strokeLinecap="round"/>
      <path d="M32 45C32 36 32 28 32 20" stroke="url(#daygrad)" strokeWidth="2" strokeLinecap="round"/>
      <path d="M40 44C42 36 42 28 39 20" stroke="url(#daygrad)" strokeWidth="2" strokeLinecap="round"/>

      {/* Watch center */}
      <circle cx="32" cy="32" r="6" fill="url(#daygrad)" />
      <line x1="32" y1="32" x2="32" y2="27" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="32" y1="32" x2="35" y2="35" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>

      {/* TimeBloc text */}
      <text x="70" y="42" fontFamily="sans-serif" fontSize="28" fill="#1E293B" fontWeight="600">
        TimeBloc
      </text>
    </svg>
  );

  const DarkLogo = () => (
    <svg width="200" height="50" viewBox="0 0 260 64" xmlns="http://www.w3.org/2000/svg" fill="none">
      <defs>
        <linearGradient id="gradient-dark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A78BFA"/>
          <stop offset="100%" stopColor="#F472B6"/>
        </linearGradient>
      </defs>

      {/* Croissant base (3 segments) */}
      <path d="M26 44 C18 42, 14 32, 18 24 C20 20, 26 16, 32 16 C38 16, 44 20, 46 24 C50 32, 46 42, 38 44 Z" 
            fill="none" stroke="url(#gradient-dark)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Croissant segment arcs */}
      <path d="M26 44 C24 36, 24 28, 26 20" stroke="url(#gradient-dark)" strokeWidth="2" strokeLinecap="round"/>
      <path d="M32 44 C32 36, 32 28, 32 20" stroke="url(#gradient-dark)" strokeWidth="2" strokeLinecap="round"/>
      <path d="M38 44 C40 36, 40 28, 38 20" stroke="url(#gradient-dark)" strokeWidth="2" strokeLinecap="round"/>

      {/* Watch face */}
      <circle cx="32" cy="32" r="6" fill="url(#gradient-dark)" />
      <line x1="32" y1="32" x2="32" y2="28" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="32" y1="32" x2="35" y2="34" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>

      {/* Text */}
      <text x="70" y="42" fontFamily="sans-serif" fontSize="28" fill="white" fontWeight="600">TimeBloc</text>
    </svg>
  );

  return (
    <>
      <header className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-5 mb-4 flex flex-col sm:flex-row justify-between items-center border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-4 sm:mb-0">
          {isDarkMode ? <DarkLogo /> : <LightLogo />}
          <div className="ml-2">
            <ThemeToggle />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <div id="live-timer" className="flex items-center bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 px-4 py-2 rounded-full text-center sm:text-left order-1 w-full sm:w-auto border border-purple-100 dark:border-purple-800 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-500 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200">
              {currentTime}
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 order-2 mt-3 sm:mt-0">
            <SaveTools />
            <UnifiedAITools />
          </div>
        </div>
      </header>
      
      {showAISettings && (
        <AISettingsModal onClose={() => setShowAISettings(false)} />
      )}
    </>
  );
};

export default Header;