import React, { useState, useEffect } from 'react';
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
import TaskTracker from './components/TaskTracker.js';
import { getNotificationPermission } from './services/NotificationService.js';
import './styles/index.css';

const App = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  
  // Check notification permission on first load
  useEffect(() => {
    // Check if service worker is active
    if ('serviceWorker' in navigator) {
      // Check notification permission
      const permission = getNotificationPermission();
      
      // If permission hasn't been requested yet, show the prompt after a delay
      if (permission === 'default') {
        const timer = setTimeout(() => {
          setShowNotificationPrompt(true);
        }, 5000); // Show after 5 seconds
        
        return () => clearTimeout(timer);
      }
    }
  }, []);
  
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
                
                {/* Notification permission prompt */}
                {showNotificationPrompt && (
                  <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 max-w-sm border border-purple-100 dark:border-purple-800/40 z-50 animate-fade-in-up">
                    <div className="flex items-start mb-3">
                      <div className="flex-shrink-0 mr-3 text-purple-500">
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Enable Notifications</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                          Get notified when tasks start and when AI processing is complete.
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => setShowNotificationPrompt(false)}
                        className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                      >
                        Not now
                      </button>
                      <button 
                        onClick={() => {
                          import('./services/NotificationService.js').then(module => {
                            module.requestNotificationPermission();
                            setShowNotificationPrompt(false);
                          });
                        }}
                        className="px-3 py-1.5 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
                      >
                        Enable
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Task tracker for notifications */}
                <TaskTracker />
              </div>
            </AISettingsProvider>
          </PomodoroSettingsProvider>
        </ScheduleProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
};

export default App;