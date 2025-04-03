import React, { useState } from 'react';
import { ScheduleProvider } from './context/ScheduleContext.js';
import { NotificationProvider } from './context/NotificationContext.js';
import { PomodoroSettingsProvider } from './context/PomodoroSettingsContext.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { AISettingsProvider } from './context/AISettingsContext.js';
import Header from './components/Header.js';
import TabsPanel from './components/TabsPanel.js';
import SearchFilter from './components/SearchFilter.js';
import DaySchedule from './components/DaySchedule.js';
import Footer from './components/Footer.js';
import NotificationSystem from './components/NotificationSystem.js';
import UnifiedAITools from './components/UnifiedAITools.js';
import './styles/index.css';

const App = () => {
  const [showSearch, setShowSearch] = useState(false);
  
  return (
    <ThemeProvider>
      <NotificationProvider>
        <ScheduleProvider>
          <PomodoroSettingsProvider>
            <AISettingsProvider>
              <div className="container mx-auto p-4 max-w-4xl dark:bg-gray-900 transition-colors duration-200">
                <Header />
                
                <div className="flex justify-between items-center mb-2">
                  <UnifiedAITools />
                  
                  <button 
                    onClick={() => setShowSearch(!showSearch)}
                    className="bg-blue-50 dark:bg-blue-900 hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-300 text-sm font-medium rounded-full p-2 flex items-center transition-colors"
                    aria-expanded={showSearch}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span className="ml-1 hidden sm:inline">{showSearch ? 'Hide Filters' : 'Show Filters'}</span>
                  </button>
                </div>
                
                {showSearch && <SearchFilter />}
                
                <TabsPanel />
                <DaySchedule />
                <Footer />
                <NotificationSystem />
              </div>
            </AISettingsProvider>
          </PomodoroSettingsProvider>
        </ScheduleProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
};

export default App;