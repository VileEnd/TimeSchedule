import React, { useState, useEffect } from 'react';
import { useSchedule } from '../context/ScheduleContext.js';
import { useNotification } from '../context/NotificationContext.js';
import { timeToMinutes } from '../utils.js';

const ActivityModal = ({ day, editIndex, onClose }) => {
  const { scheduleData, addActivity, updateActivity } = useSchedule();
  const { showWarning, showSuccess } = useNotification();
  
  const isEditing = editIndex !== null;
  const initialData = isEditing ? scheduleData[day][editIndex] : {
    start_time: '',
    end_time: '',
    activity: '',
    type: 'Routine',
    details: ''
  };

  const [formData, setFormData] = useState(initialData);
  
  useEffect(() => {
    // Add event listener for ESC key to close modal
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.start_time || !formData.end_time || !formData.activity || !formData.type) {
      showWarning("Please fill in Start Time, End Time, Activity, and Type.");
      return;
    }
    
    if (timeToMinutes(formData.end_time) === timeToMinutes(formData.start_time)) {
      showWarning("End time cannot be the same as start time.");
      return;
    }
    
    // Process and save the data
    const activityData = {
      ...formData,
      activity: formData.activity.trim(),
      details: formData.details?.trim() || null
    };
    
    if (isEditing) {
      updateActivity(day, editIndex, activityData);
      showSuccess('Activity updated successfully.');
    } else {
      addActivity(day, activityData);
      showSuccess('Activity added successfully.');
    }
    
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            {isEditing ? 'Edit Activity' : `Add Activity to ${day}`}
          </h3>
          <form className="mt-2 px-7 py-3 space-y-3 text-left" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">Start Time:</label>
              <input 
                type="time" 
                id="start_time" 
                name="start_time" 
                value={formData.start_time} 
                onChange={handleChange}
                required 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">End Time:</label>
              <input 
                type="time" 
                id="end_time" 
                name="end_time" 
                value={formData.end_time} 
                onChange={handleChange}
                required 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="activity" className="block text-sm font-medium text-gray-700">Activity:</label>
              <input 
                type="text" 
                id="activity" 
                name="activity" 
                value={formData.activity} 
                onChange={handleChange}
                required 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type:</label>
              <select 
                id="type" 
                name="type" 
                value={formData.type} 
                onChange={handleChange}
                required 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="Routine">Routine</option>
                <option value="Travel">Travel</option>
                <option value="Buffer">Buffer</option>
                <option value="University">University</option>
                <option value="Break">Break</option>
                <option value="Study_Review">Study_Review</option>
                <option value="Study_Prep">Study_Prep</option>
                <option value="Study_Intensive">Study_Intensive</option>
                <option value="Meal">Meal</option>
                <option value="Housework">Housework</option>
                <option value="Flexible">Flexible</option>
                <option value="Work">Work</option>
                <option value="Language">Language</option>
                <option value="Free_Time">Free_Time</option>
                <option value="Sleep">Sleep</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="details" className="block text-sm font-medium text-gray-700">Details:</label>
              <textarea 
                id="details" 
                name="details" 
                value={formData.details || ''} 
                onChange={handleChange}
                rows="3" 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              ></textarea>
            </div>
            <div className="items-center px-4 py-3 flex justify-center">
              <button 
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-auto shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                Save
              </button>
              <button 
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md w-auto ml-2 shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ActivityModal;