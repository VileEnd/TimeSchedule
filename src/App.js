import React, { useState } from 'react';
import { ScheduleProvider } from './context/ScheduleContext.js';
import { NotificationProvider } from './context/NotificationContext.js';
import { PomodoroSettingsProvider } from './context/PomodoroSettingsContext.js';
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
    <NotificationProvider>
      <ScheduleProvider>
        <PomodoroSettingsProvider>
          <div className="container mx-auto p-4 max-w-4xl">
            <Header />
            
            <div className="flex justify-end mb-2">
              <button 
                onClick={() => setShowSearch(!showSearch)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
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
        </PomodoroSettingsProvider>
      </ScheduleProvider>
    </NotificationProvider>
  );
};

export default App;