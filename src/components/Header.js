import React, { useState, useEffect } from 'react';
import ThemeToggle from './ThemeToggle.js';
import AISettingsModal from './AISettingsModal.js';
import SaveTools from './SaveTools.js';

const Header = () => {
  const [currentTime, setCurrentTime] = useState('Loading...');
  const [showAISettings, setShowAISettings] = useState(false);

  useEffect(() => {
    updateLiveTimer();
    const interval = setInterval(updateLiveTimer, 1000);
    return () => clearInterval(interval);
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

  return (
    <>
      <header className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-4 flex flex-col sm:flex-row justify-between items-center border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-3 sm:mb-0">
          <h1 className="text-xl sm:text-2xl font-bold text-purple-700 dark:text-purple-400 mr-3">TimeSchedule Pro</h1>
          <ThemeToggle />
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-2 w-full sm:w-auto">
          <div id="live-timer" className="text-sm sm:text-base font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded text-center sm:text-left order-1 w-full sm:w-auto">
            {currentTime}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 order-2 mt-2 sm:mt-0">
            <SaveTools />
            <button 
              onClick={() => setShowAISettings(true)} 
              title="AI Settings"
              className="flex items-center rounded-full p-1.5 bg-indigo-500 hover:bg-indigo-600 text-white shadow-md hover:shadow-lg transition-all"
              aria-label="AI Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </button>
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