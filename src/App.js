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
                
                <div className="flex justify-end mb-2">
                  <button 
                    onClick={() => setShowSearch(!showSearch)}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium rounded-full p-2.5 shadow-md hover:shadow-lg flex items-center transition-all"
                    aria-expanded={showSearch}
                    title="Filter Schedule"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
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