import React, { useState } from 'react';
import { useSchedule } from '../context/ScheduleContext.js';
import { generateICS } from '../utils.js';

const SaveTools = () => {
  const { 
    scheduleData, 
    daysOfWeek, 
    saveToLocalStorage, 
    exportToJson, 
    importFromJson 
  } = useSchedule();

  const [isOpen, setIsOpen] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);

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
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center rounded-full p-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-md hover:shadow-lg transition-all"
        aria-label="Save & Export Options"
        title="Save & Export Options"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l-4-4m4 4l4-4" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 p-2 z-40">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 px-2">Save & Export</h3>
          
          <div className="grid grid-cols-1 gap-1">
            <button 
              onClick={handleSaveToStorage} 
              className="flex items-center p-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              </span>
              <div>
                <div className="font-medium">Save to Browser</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Store locally</div>
              </div>
              {saveFeedback && (
                <span className="ml-auto text-xs text-green-600 dark:text-green-400">Saved!</span>
              )}
            </button>
            
            <button 
              onClick={exportToJson} 
              className="flex items-center p-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400 mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </span>
              <div>
                <div className="font-medium">Export JSON</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Download file</div>
              </div>
            </button>
            
            <label className="flex items-center p-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors cursor-pointer">
              <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </span>
              <div>
                <div className="font-medium">Import JSON</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Upload file</div>
              </div>
              <input 
                type="file" 
                accept=".json" 
                className="hidden" 
                onChange={handleJsonUpload}
              />
            </label>
            
            <button 
              onClick={handleDownloadICS} 
              className="flex items-center p-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
              <div>
                <div className="font-medium">Download ICS</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Calendar file</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaveTools;