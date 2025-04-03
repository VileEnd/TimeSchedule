import React, { useState, useEffect } from 'react';
import { useSchedule } from '../context/ScheduleContext.js';
import { getTypeColor } from '../utils.js';

const SearchFilter = () => {
  const { scheduleData, daysOfWeek, setCurrentDay } = useSchedule();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Get all unique activity types from the schedule data
  const getActivityTypes = () => {
    const typeSet = new Set();
    
    daysOfWeek.forEach(day => {
      if (scheduleData[day] && Array.isArray(scheduleData[day])) {
        scheduleData[day].forEach(activity => {
          if (activity.type) {
            typeSet.add(activity.type);
          }
        });
      }
    });
    
    return Array.from(typeSet).sort();
  };
  
  const activityTypes = getActivityTypes();
  
  useEffect(() => {
    if (!searchTerm && !selectedType) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    
    const results = [];
    
    daysOfWeek.forEach(day => {
      if (scheduleData[day] && Array.isArray(scheduleData[day])) {
        scheduleData[day].forEach((activity, index) => {
          // Check if activity matches both search term and type filter (if provided)
          const matchesSearchTerm = !searchTerm || 
            activity.activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (activity.details && activity.details.toLowerCase().includes(searchTerm.toLowerCase()));
            
          const matchesType = !selectedType || activity.type === selectedType;
          
          if (matchesSearchTerm && matchesType) {
            results.push({
              day,
              index,
              ...activity
            });
          }
        });
      }
    });
    
    setSearchResults(results);
  }, [searchTerm, selectedType, scheduleData, daysOfWeek]);
  
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
  };
  
  const handleResultClick = (day) => {
    setCurrentDay(day);
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4 animate-fade-in">
      <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Search & Filter
      </h3>
      
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
        {/* Search input */}
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              id="search"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 p-2.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        {/* Type filter */}
        <div className="flex-1">
          <select
            id="type-filter"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Types</option>
            {activityTypes.map(type => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
        
        {/* Clear button */}
        <div className="self-end">
          <button
            onClick={handleClearFilters}
            disabled={!searchTerm && !selectedType}
            className={`py-2 px-3 rounded text-sm transition-colors ${
              !searchTerm && !selectedType
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Results display */}
      {isSearching && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Results {searchResults.length > 0 ? `(${searchResults.length})` : ''}
            </h4>
            {searchResults.length > 0 && (
              <span className="text-xs text-blue-600 dark:text-blue-400">
                Click on an item to navigate
              </span>
            )}
          </div>
          
          {searchResults.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400 text-center py-4 flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No activities found matching your search criteria.</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto pr-1 rounded-md">
              {searchResults.map((result, resultIndex) => (
                <div 
                  key={`${result.day}-${result.index}-${resultIndex}`}
                  className={`p-3 mb-2 rounded border-l-4 ${getTypeColor(result.type)} dark:bg-gray-700 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 hover:translate-x-1`}
                  onClick={() => handleResultClick(result.day)}
                >
                  <div className="flex justify-between items-start mb-1 flex-wrap">
                    <span className="font-semibold text-gray-800 dark:text-gray-100">{result.activity}</span>
                    <span className="text-xs font-mono bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">
                      {result.start_time} - {result.end_time}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 flex justify-between items-center">
                    <span className="truncate max-w-md">
                      {result.details || <i className="text-gray-400 dark:text-gray-500">No details</i>}
                    </span>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap ml-2 bg-blue-50 dark:bg-blue-900 px-1.5 py-0.5 rounded">
                      {result.day}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchFilter;