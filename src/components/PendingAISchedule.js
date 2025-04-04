import React, { useEffect, useState } from 'react';
import { useAISchedule } from '../context/AIScheduleContext.js';
import { useSchedule } from '../context/ScheduleContext.js';
import { useNotification } from '../context/NotificationContext.js';

const PendingAISchedule = () => {
  const { pendingSchedule, pendingSource, totalBlocks, clearPendingSchedule, getPendingScheduleDescription } = useAISchedule();
  const { setScheduleData, saveToLocalStorage } = useSchedule();
  const { showSuccess } = useNotification();
  const [isVisible, setIsVisible] = useState(false);
  
  // Add animation when mounting component
  useEffect(() => {
    if (pendingSchedule) {
      // Small delay to ensure animation plays properly
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [pendingSchedule]);
  
  // Check URL parameters on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewAiSchedule = params.get('viewAiSchedule');
    
    // If URL has viewAiSchedule=true param and we have a pending schedule
    if (viewAiSchedule === 'true' && pendingSchedule) {
      // Focus on the banner element
      setTimeout(() => {
        const bannerElement = document.getElementById('pending-ai-banner');
        if (bannerElement) {
          bannerElement.scrollIntoView({ behavior: 'smooth' });
          bannerElement.classList.add('highlight-banner');
          
          // Remove highlight after animation completes
          setTimeout(() => {
            bannerElement.classList.remove('highlight-banner');
          }, 2000);
        }
      }, 500);
      
      // Clean up the URL parameter
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    }
  }, [pendingSchedule]);
  
  if (!pendingSchedule) return null;
  
  const handleApply = () => {
    // Apply the pending schedule
    setScheduleData(pendingSchedule);
    saveToLocalStorage(pendingSchedule);
    
    // Show a success message based on source
    let successMessage = '';
    
    if (pendingSource === 'text') {
      successMessage = `Successfully created schedule with ${totalBlocks} blocks`;
    } else if (pendingSource === 'calendar') {
      successMessage = `Successfully created schedule with ${totalBlocks} blocks from your calendar`;
    } else if (pendingSource === 'optimize') {
      successMessage = `Successfully applied schedule with ${totalBlocks} study blocks`;
    } else {
      successMessage = `Successfully applied schedule with ${totalBlocks} blocks`;
    }
    
    showSuccess(successMessage);
    
    // Clear the pending schedule and notification data
    clearPendingSchedule();
    localStorage.removeItem('pendingAINotification');
    
    // Set to not visible for animation
    setIsVisible(false);
  };
  
  const handleDiscard = () => {
    // Start exit animation
    setIsVisible(false);
    
    // Wait for animation to complete before removing
    setTimeout(() => {
      // Clear the pending schedule without applying
      clearPendingSchedule();
      localStorage.removeItem('pendingAINotification');
    }, 300);
  };
  
  return (
    <div className="fixed inset-x-0 bottom-0 p-4 z-40">
      <div 
        id="pending-ai-banner"
        className={`mx-auto max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-purple-200 dark:border-purple-800 p-4 flex flex-col sm:flex-row items-center justify-between transform transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}
      >
        <div className="mb-3 sm:mb-0">
          <div className="flex items-center text-purple-600 dark:text-purple-400 mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            <h3 className="font-semibold">Pending AI Schedule</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">{getPendingScheduleDescription()}</p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleDiscard}
            className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
            aria-label="Discard AI schedule"
          >
            Discard
          </button>
          <button
            onClick={handleApply}
            className="px-3 py-2 text-sm bg-purple-500 hover:bg-purple-600 text-white rounded-md shadow-sm hover:shadow transition-colors"
            aria-label="Apply AI schedule"
          >
            Apply Schedule
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingAISchedule;