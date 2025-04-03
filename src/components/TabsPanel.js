import React from 'react';
import { useSchedule } from '../context/ScheduleContext.js';

const TabsPanel = () => {
  const { daysOfWeek, currentDay, setCurrentDay } = useSchedule();

  return (
    <div className="bg-white rounded-lg shadow mb-4 overflow-hidden">
      <nav className="flex flex-wrap border-b border-gray-200" aria-label="Days of the week">
        <div className="flex flex-wrap -mb-px" role="tablist">
          {daysOfWeek.map((day) => (
            <button
              key={day}
              className={`tab whitespace-nowrap py-3 px-4 border-b-2 ${
                currentDay === day 
                  ? 'tab-active' 
                  : 'border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
              onClick={() => setCurrentDay(day)}
              role="tab"
              aria-selected={currentDay === day}
              aria-controls={`panel-${day}`}
              id={`tab-${day}`}
            >
              {day}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default TabsPanel;