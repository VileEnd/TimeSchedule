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
    const savedPendingSchedule = localStorage.getItem('pendingAISchedule');
    const savedPendingSource = localStorage.getItem('pendingAISource');
    const savedTotalBlocks = localStorage.getItem('pendingAITotalBlocks');
    
    if (savedPendingSchedule) {
      try {
        setPendingSchedule(JSON.parse(savedPendingSchedule));
        setPendingSource(savedPendingSource || '');
        setTotalBlocks(parseInt(savedTotalBlocks || '0', 10));
      } catch (error) {
        console.error('Error loading pending AI schedule:', error);
        clearPendingSchedule();
      }
    }
  }, []);
  
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