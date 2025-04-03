import React, { useState } from 'react';
import { ReactSortable } from 'react-sortablejs';
import { useSchedule } from '../context/ScheduleContext.js';
import { useNotification } from '../context/NotificationContext.js';
import ScheduleItem from './ScheduleItem.js';
import ActivityModal from './ActivityModal.js';
import EnhancedPomodoroTimer from './EnhancedPomodoroTimer.js';
import LearningTimeMenu from './LearningTimeMenu.js';

const DaySchedule = () => {
  const { scheduleData, currentDay, reorderActivities, deleteActivity } = useSchedule();
  const { showConfirm } = useNotification();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [pomodoroActivity, setPomodoroActivity] = useState('');
  
  const dayActivities = scheduleData[currentDay] || [];
  
  // Add temp IDs for Sortable.js
  const activitiesWithIds = dayActivities.map((item, index) => ({
    ...item,
    id: `${currentDay}-${index}`
  }));

  const handleAddActivity = () => {
    setEditingIndex(null);
    setModalOpen(true);
  };

  const handleEditActivity = (index) => {
    setEditingIndex(index);
    setModalOpen(true);
  };

  const handleDeleteActivity = (index) => {
    showConfirm(
      `Are you sure you want to delete "${dayActivities[index].activity}" from ${currentDay}?`,
      () => deleteActivity(currentDay, index)
    );
  };

  const handlePomodoroClick = (index) => {
    const item = dayActivities[index];
    setPomodoroActivity(item.activity);
    setShowPomodoro(true);
  };

  const handleSortEnd = (newOrder) => {
    reorderActivities(currentDay, newOrder);
  };

  return (
    <>
      {showPomodoro && (
        <EnhancedPomodoroTimer 
          activity={pomodoroActivity} 
          onClose={() => setShowPomodoro(false)} 
        />
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{currentDay}'s Schedule</h2>
        <div className="flex space-x-2">
          <LearningTimeMenu />
          <button 
            onClick={handleAddActivity}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
            aria-label={`Add activity to ${currentDay}`}
          >
            Add Activity
          </button>
        </div>
      </div>
      
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 min-h-[300px]"
        role="tabpanel"
        id={`panel-${currentDay}`}
        aria-labelledby={`tab-${currentDay}`}
      >
        {activitiesWithIds.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-6">
            No activities scheduled. Click "Add Activity" above!
          </p>
        ) : (
          <ReactSortable
            list={activitiesWithIds}
            setList={handleSortEnd}
            animation={150}
            handle=".schedule-item"
            filter=".action-btn, button, input, textarea, select, .btn-pomodoro"
            preventOnFilter={true}
            ghostClass="sortable-ghost"
            chosenClass="sortable-chosen"
            dragClass="sortable-drag"
          >
            {activitiesWithIds.map((item, index) => (
              <ScheduleItem
                key={item.id}
                item={item}
                index={index}
                onEdit={handleEditActivity}
                onDelete={handleDeleteActivity}
                onPomodoroClick={handlePomodoroClick}
              />
            ))}
          </ReactSortable>
        )}
      </div>

      {modalOpen && (
        <ActivityModal
          day={currentDay}
          editIndex={editingIndex}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
};

export default DaySchedule;