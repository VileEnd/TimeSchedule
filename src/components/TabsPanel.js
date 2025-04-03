import React from 'react';
import { useSchedule } from '../context/ScheduleContext.js';

const TabsPanel = () => {
  const { daysOfWeek, currentDay, setCurrentDay } = useSchedule();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-4 overflow-hidden">
      <nav className="flex flex-wrap border-b border-gray-200 dark:border-gray-700 overflow-x-auto" aria-label="Days of the week">
        <div className="flex flex-nowrap -mb-px w-full" role="tablist">
          {daysOfWeek.map((day) => (
            <button
              key={day}
              className={`tab whitespace-nowrap py-3 px-3 md:px-4 border-b-2 ${
                currentDay === day 
                  ? 'border-purple-500 text-purple-600 dark:border-purple-400 dark:text-purple-400 font-semibold' 
                  : 'border-transparent text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-300 hover:border-purple-300 dark:hover:border-purple-600'
              } focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 flex-1 min-w-[80px] transition-all duration-150`}
              onClick={() => setCurrentDay(day)}
              role="tab"
              aria-current={currentDay === day ? 'page' : undefined}
              aria-controls={`panel-${day}`}
              id={`tab-${day}`}
            >
              <span className="block text-center truncate">{day}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default TabsPanel;