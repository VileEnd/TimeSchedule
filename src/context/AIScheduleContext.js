import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the context
const AIScheduleContext = createContext();

// Custom hook to use the context
export const useAISchedule = () => useContext(AIScheduleContext);

// Provider component
export const AIScheduleProvider = ({ children }) => {
  // State for storing pending AI-generated schedules
  const [pendingSchedule, setPendingSchedule] = useState(null);
  const [pendingSource, setPendingSource] = useState('');
  const [totalBlocks, setTotalBlocks] = useState(0);
  
  // Check local storage for any saved pending schedules on initialization
  useEffect(() => {
    // Load pending schedule data
    const savedPendingSchedule = localStorage.getItem('pendingAISchedule');
    const savedPendingSource = localStorage.getItem('pendingAISource');
    const savedTotalBlocks = localStorage.getItem('pendingAITotalBlocks');
    
    // Check for pending notification data from service worker
    const pendingNotification = localStorage.getItem('pendingAINotification');
    
    if (savedPendingSchedule) {
      try {
        setPendingSchedule(JSON.parse(savedPendingSchedule));
        setPendingSource(savedPendingSource || '');
        setTotalBlocks(parseInt(savedTotalBlocks || '0', 10));
      } catch (error) {
        console.error('Error loading pending AI schedule:', error);
        clearPendingSchedule();
      }
    } else if (pendingNotification) {
      // If there's no pending schedule but there is a notification,
      // show a system message about a lost schedule
      try {
        const notificationData = JSON.parse(pendingNotification);
        console.log('Found pending notification without schedule data', notificationData);
        
        // Check if notification is less than 24 hours old
        const notificationTime = notificationData.timestamp || 0;
        const currentTime = Date.now();
        const timeDiff = currentTime - notificationTime;
        
        // Only show the message if the notification is recent (less than 24 hours old)
        if (timeDiff < 24 * 60 * 60 * 1000) {
          // Could implement a UI indicator here that a schedule was created but not available
          console.log('Recent AI schedule notification found, but schedule data is missing');
        } else {
          // Clean up old notification data
          localStorage.removeItem('pendingAINotification');
        }
      } catch (error) {
        console.error('Error parsing pending notification data:', error);
        localStorage.removeItem('pendingAINotification');
      }
    }
    
    // Add event listener for app visibility changes to recheck storage
    document.addEventListener('visibilitychange', checkPendingOnVisibilityChange);
    
    // Clean up event listener on unmount
    return () => {
      document.removeEventListener('visibilitychange', checkPendingOnVisibilityChange);
    };
  }, []);
  
  // Function to check pending schedule data when visibility changes
  const checkPendingOnVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      const savedPendingSchedule = localStorage.getItem('pendingAISchedule');
      if (savedPendingSchedule && !pendingSchedule) {
        // If there's a pending schedule in storage but not in state, load it
        try {
          const savedPendingSource = localStorage.getItem('pendingAISource');
          const savedTotalBlocks = localStorage.getItem('pendingAITotalBlocks');
          
          setPendingSchedule(JSON.parse(savedPendingSchedule));
          setPendingSource(savedPendingSource || '');
          setTotalBlocks(parseInt(savedTotalBlocks || '0', 10));
        } catch (error) {
          console.error('Error loading pending AI schedule on visibility change:', error);
        }
      }
    }
  };
  
  // Save pending schedule to local storage
  const savePendingSchedule = (schedule, source, blocks) => {
    if (!schedule) return false;
    
    try {
      localStorage.setItem('pendingAISchedule', JSON.stringify(schedule));
      localStorage.setItem('pendingAISource', source || '');
      localStorage.setItem('pendingAITotalBlocks', blocks.toString());
      
      setPendingSchedule(schedule);
      setPendingSource(source || '');
      setTotalBlocks(blocks);
      
      return true;
    } catch (error) {
      console.error('Error saving pending AI schedule:', error);
      return false;
    }
  };
  
  // Clear the pending schedule
  const clearPendingSchedule = () => {
    localStorage.removeItem('pendingAISchedule');
    localStorage.removeItem('pendingAISource');
    localStorage.removeItem('pendingAITotalBlocks');
    
    setPendingSchedule(null);
    setPendingSource('');
    setTotalBlocks(0);
  };
  
  // Generate pendingScheduleDescription for notifications
  const getPendingScheduleDescription = () => {
    if (!pendingSchedule) return '';
    
    let description = '';
    
    if (pendingSource === 'text') {
      description = `AI has created a schedule with ${totalBlocks} blocks based on your description`;
    } else if (pendingSource === 'calendar') {
      description = `AI has created a schedule with ${totalBlocks} blocks from your calendar`;
    } else if (pendingSource === 'optimize') {
      description = `AI has optimized your schedule with ${totalBlocks} study blocks`;
    } else {
      description = `AI has created a schedule with ${totalBlocks} blocks`;
    }
    
    return description;
  };
  
  return (
    <AIScheduleContext.Provider
      value={{
        pendingSchedule,
        pendingSource,
        totalBlocks,
        savePendingSchedule,
        clearPendingSchedule,
        hasPendingSchedule: !!pendingSchedule,
        getPendingScheduleDescription
      }}
    >
      {children}
    </AIScheduleContext.Provider>
  );
};

export default AIScheduleContext;