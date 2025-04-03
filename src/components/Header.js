import React, { useState, useEffect } from 'react';
import { useSchedule } from '../context/ScheduleContext.js';
import { generateICS } from '../utils.js';

const Header = () => {
  const { 
    scheduleData, 
    daysOfWeek, 
    saveToLocalStorage, 
    exportToJson, 
    importFromJson 
  } = useSchedule();
  
  const [currentTime, setCurrentTime] = useState('Loading...');
  const [saveFeedback, setSaveFeedback] = useState(false);

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

  const handleSaveToStorage = () => {
    saveToLocalStorage();
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 1500);
  };

  const handleJsonUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const uploadedData = JSON.parse(e.target.result);
        if (window.confirm('Successfully read JSON file. Replace current schedule with uploaded data?')) {
          importFromJson(uploadedData);
          alert('Schedule updated from uploaded file.');
        }
      } catch (error) {
        console.error("Error processing uploaded JSON:", error);
        alert(`Failed to load schedule from file: ${error.message}`);
      } finally {
        event.target.value = '';
      }
    };
    
    reader.onerror = () => {
      alert('Error reading file.');
      event.target.value = '';
    };
    
    reader.readAsText(file);
  };

  const handleDownloadICS = () => {
    generateICS(scheduleData, daysOfWeek);
  };

  return (
    <header className="bg-white rounded-lg shadow p-4 mb-4 flex flex-col md:flex-row justify-between items-center">
      <h1 className="text-2xl font-bold text-gray-800 mb-3 md:mb-0">My Weekly Schedule</h1>
      <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full md:w-auto">
        <div id="live-timer" className="text-base font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded mb-2 sm:mb-0 order-1 sm:order-none text-center sm:text-left">
          {currentTime}
        </div>
        <div className="flex space-x-1 order-3 sm:order-none mt-2 sm:mt-0 flex-wrap justify-center">
          <button 
            onClick={() => saveToLocalStorage()} 
            title="Load from Browser" 
            className="bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs font-bold py-1 px-2 rounded"
          >
            &#x1F4BE;
          </button>
          <button 
            onClick={handleSaveToStorage} 
            title="Save to Browser" 
            className="bg-green-100 hover:bg-green-200 text-green-800 text-xs font-bold py-1 px-2 rounded"
          >
            {saveFeedback ? 'Saved!' : '💾'}
          </button>
          <button 
            onClick={exportToJson} 
            title="Download JSON" 
            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-xs font-bold py-1 px-2 rounded"
          >
            &#x2B07;
          </button>
          <label 
            title="Upload JSON" 
            className="bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-bold py-1 px-2 rounded cursor-pointer"
          >
            &#x2B06;
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              onChange={handleJsonUpload}
            />
          </label>
        </div>
        <button 
          onClick={handleDownloadICS} 
          title="Download Week (.ics)" 
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded transition duration-150 ease-in-out text-sm order-2 sm:order-none"
        >
          ICS
        </button>
      </div>
    </header>
  );
};

export default Header;