import React, { createContext, useState, useEffect, useContext } from 'react';
import { saveToLocalStorage, loadFromLocalStorage, timeToMinutes } from '../utils.js';
import defaultSchedule from '../data/schedule.json';

const ScheduleContext = createContext();

export const useSchedule = () => useContext(ScheduleContext);

export const ScheduleProvider = ({ children }) => {
  const [scheduleData, setScheduleData] = useState({});
  const [currentDay, setCurrentDay] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const initializeSchedule = async () => {
    setIsLoading(true);
    
    // Try loading from local storage first
    const storedData = loadFromLocalStorage();
    
    if (storedData && Object.keys(storedData).length > 0) {
      console.log("Loaded schedule from local storage.");
      setScheduleData(ensureDaysExist(storedData));
    } else {
      console.log("No local storage data found, using default schedule");
      setScheduleData(ensureDaysExist(defaultSchedule));
    }
    
    // Set initial active day (today or Monday)
    const now = new Date();
    const todayIndexLocal = now.getDay(); // Sunday = 0, Monday = 1, ...
    const adjustedTodayIndex = (todayIndexLocal === 0) ? 6 : todayIndexLocal - 1; // Mon=0, Sun=6
    setCurrentDay(daysOfWeek[adjustedTodayIndex]);
    
    setIsLoading(false);
  };

  useEffect(() => {
    initializeSchedule();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ensureDaysExist = (data) => {
    const updatedData = { ...data };
    daysOfWeek.forEach(day => {
      if (!updatedData[day] || !Array.isArray(updatedData[day])) {
        updatedData[day] = [];
      }
    });
    return updatedData;
  };

  const addActivity = (day, activity) => {
    const updatedSchedule = { ...scheduleData };
    
    if (!updatedSchedule[day]) {
      updatedSchedule[day] = [];
    }
    
    // Mark the activity with animation flag if it's not marked as auto-generated
    if (!activity.isAutoGenerated) {
      activity.isNewlyAdded = true;
      
      // Clear the flag after 2 seconds to stop the animation
      setTimeout(() => {
        const current = { ...scheduleData };
        const index = current[day].findIndex(item => 
          item.activity === activity.activity && 
          item.start_time === activity.start_time && 
          item.end_time === activity.end_time
        );
        
        if (index !== -1) {
          current[day][index] = { ...current[day][index], isNewlyAdded: false };
          setScheduleData(current);
          saveToLocalStorage(current);
        }
      }, 2000);
    }
    
    updatedSchedule[day].push(activity);
    updatedSchedule[day].sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
    
    setScheduleData(updatedSchedule);
    saveToLocalStorage(updatedSchedule);
    return updatedSchedule;
  };

  const updateActivity = (day, index, updatedActivity) => {
    const updatedSchedule = { ...scheduleData };
    
    if (!updatedSchedule[day] || index >= updatedSchedule[day].length) {
      console.error("Invalid day or index for updating activity");
      return scheduleData;
    }
    
    updatedSchedule[day][index] = updatedActivity;
    updatedSchedule[day].sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
    
    setScheduleData(updatedSchedule);
    saveToLocalStorage(updatedSchedule);
    return updatedSchedule;
  };

  const deleteActivity = (day, index) => {
    const updatedSchedule = { ...scheduleData };
    
    if (!updatedSchedule[day] || index >= updatedSchedule[day].length) {
      console.error("Invalid day or index for deleting activity");
      return scheduleData;
    }
    
    updatedSchedule[day].splice(index, 1);
    
    setScheduleData(updatedSchedule);
    saveToLocalStorage(updatedSchedule);
    return updatedSchedule;
  };

  const reorderActivities = (day, newOrder) => {
    if (!scheduleData[day] || !Array.isArray(newOrder)) {
      console.error("Invalid day or order array for reordering activities");
      return scheduleData;
    }
    
    // Create a completely new object to ensure React sees the change
    const updatedSchedule = JSON.parse(JSON.stringify(scheduleData));
    
    // Ensure we're not keeping any temporary IDs or ReactSortable properties in stored data
    updatedSchedule[day] = newOrder.map(item => {
      // Keep only the relevant activity data properties
      const { 
        activity, start_time, end_time, type, details,
        isAutoGenerated, isNewlyAdded
      } = item;
      
      return { 
        activity, start_time, end_time, type, details,
        isAutoGenerated, isNewlyAdded
      };
    });
    
    // Force a state update with new reference
    setScheduleData(updatedSchedule);
    
    // Save to local storage
    saveToLocalStorage(updatedSchedule);
    
    // Return updated schedule
    return updatedSchedule;
  };

  const exportToJson = () => {
    if (Object.keys(scheduleData).length === 0) {
      alert("No schedule data to download.");
      return;
    }
    
    try {
      // Create a copy without the temporary 'id' field before saving
      const dataToSave = JSON.parse(JSON.stringify(scheduleData)); // Deep copy
      for (const day in dataToSave) {
        if (Array.isArray(dataToSave[day])) {
          dataToSave[day].forEach(item => delete item.id); // Remove temp id
        }
      }

      const jsonData = JSON.stringify(dataToSave, null, 2); // Pretty print JSON
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'my_schedule.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error creating JSON download:", error);
      alert("Failed to create JSON file for download.");
    }
  };

  const importFromJson = (jsonData) => {
    try {
      if (typeof jsonData !== 'object' || jsonData === null) {
        throw new Error("Uploaded file is not a valid JSON object.");
      }
      
      const hasDayKeys = daysOfWeek.some(day => 
        jsonData.hasOwnProperty(day) && Array.isArray(jsonData[day])
      );
      
      if (!hasDayKeys) {
        throw new Error("JSON structure doesn't match the expected weekly schedule format.");
      }
      
      const updatedData = ensureDaysExist(jsonData);
      setScheduleData(updatedData);
      saveToLocalStorage(updatedData);
      return true;
    } catch (error) {
      console.error("Error processing JSON data:", error);
      alert(`Failed to load schedule from data: ${error.message}`);
      return false;
    }
  };
  
  const clearAllData = () => {
    const emptySchedule = {};
    daysOfWeek.forEach(day => {
      emptySchedule[day] = [];
    });
    setScheduleData(emptySchedule);
    saveToLocalStorage(emptySchedule);
    return true;
  };

  return (
    <ScheduleContext.Provider 
      value={{
        scheduleData,
        setScheduleData,
        currentDay,
        setCurrentDay,
        daysOfWeek,
        isLoading,
        addActivity,
        updateActivity,
        deleteActivity,
        reorderActivities,
        exportToJson,
        importFromJson,
        clearAllData,
        saveToLocalStorage: () => saveToLocalStorage(scheduleData),
        loadFromStorage: initializeSchedule
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
};

export default ScheduleContext;