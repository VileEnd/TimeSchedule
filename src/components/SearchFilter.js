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
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Search & Filter</h3>
      
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
        {/* Search input */}
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search Activities
          </label>
          <input
            type="text"
            id="search"
            placeholder="Enter activity name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3"
          />
        </div>
        
        {/* Type filter */}
        <div className="flex-1">
          <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Type
          </label>
          <select
            id="type-filter"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3"
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
        <div className="self-end mb-0.5 mt-6">
          <button
            onClick={handleClearFilters}
            className="py-2 px-3 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 text-sm transition duration-150 ease-in-out"
            disabled={!searchTerm && !selectedType}
          >
            Clear
          </button>
        </div>
      </div>
      
      {/* Results display */}
      {isSearching && (
        <div className="mt-4">
          <h4 className="text-md font-medium text-gray-700 mb-2">
            Results {searchResults.length > 0 ? `(${searchResults.length})` : ''}
          </h4>
          
          {searchResults.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No activities found matching your search criteria.
            </p>
          ) : (
            <div className="max-h-96 overflow-y-auto pr-1">
              {searchResults.map((result, resultIndex) => (
                <div 
                  key={`${result.day}-${result.index}-${resultIndex}`}
                  className={`p-3 mb-2 rounded border-l-4 ${getTypeColor(result.type)} shadow-sm hover:shadow-md cursor-pointer transition-shadow duration-200`}
                  onClick={() => handleResultClick(result.day)}
                >
                  <div className="flex justify-between items-start mb-1 flex-wrap">
                    <span className="font-semibold text-gray-800">{result.activity}</span>
                    <span className="text-xs font-mono bg-gray-200 px-2 py-0.5 rounded text-gray-700">
                      {result.start_time} - {result.end_time}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 flex justify-between items-center">
                    <span className="truncate max-w-md">
                      {result.details || <i className="text-gray-400">No details</i>}
                    </span>
                    <span className="text-xs font-medium text-blue-600 whitespace-nowrap ml-2">
                      ({result.day})
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