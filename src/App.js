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
import AISmartSchedulerEnhanced from './components/AISmartSchedulerEnhanced.js';
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
                
                <div className="flex justify-between mb-2">
                  <AISmartSchedulerEnhanced />
                  
                  <button 
                    onClick={() => setShowSearch(!showSearch)}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium flex items-center"
                    aria-expanded={showSearch}
                  >
                    {showSearch ? (
                      <>
                        <span>Hide Search & Filters</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </>
                    ) : (
                      <>
                        <span>Show Search & Filters</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
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