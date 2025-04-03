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
      className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto"
      onClick={handleBackdropClick}
      style={{padding: '1rem'}}
    >
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md dark:bg-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 text-center">
          {isEditing ? 'Edit Activity' : `Add Activity to ${day}`}
        </h3>
        
        <form className="space-y-3 text-left" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Time:</label>
              <div className="relative">
                <select 
                  id="start_time_hour" 
                  name="start_time_hour" 
                  value={formData.start_time ? formData.start_time.split(':')[0] : ''}
                  onChange={(e) => {
                    const hour = e.target.value;
                    const minute = formData.start_time ? formData.start_time.split(':')[1] : '00';
                    setFormData({...formData, start_time: `${hour}:${minute}`});
                  }}
                  required 
                  className="mt-1 inline-block w-1/2 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="">Hour</option>
                  {Array.from({length: 24}, (_, i) => (
                    <option key={i} value={String(i).padStart(2, '0')}>
                      {String(i).padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <select 
                  id="start_time_minute" 
                  name="start_time_minute" 
                  value={formData.start_time ? formData.start_time.split(':')[1] : ''}
                  onChange={(e) => {
                    const hour = formData.start_time ? formData.start_time.split(':')[0] : '00';
                    const minute = e.target.value;
                    setFormData({...formData, start_time: `${hour}:${minute}`});
                  }}
                  required 
                  className="mt-1 inline-block w-1/2 px-3 py-2 border border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="">Min</option>
                  {['00', '15', '30', '45'].map((minute) => (
                    <option key={minute} value={minute}>{minute}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Time:</label>
              <div className="relative">
                <select 
                  id="end_time_hour" 
                  name="end_time_hour" 
                  value={formData.end_time ? formData.end_time.split(':')[0] : ''}
                  onChange={(e) => {
                    const hour = e.target.value;
                    const minute = formData.end_time ? formData.end_time.split(':')[1] : '00';
                    setFormData({...formData, end_time: `${hour}:${minute}`});
                  }}
                  required 
                  className="mt-1 inline-block w-1/2 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="">Hour</option>
                  {Array.from({length: 24}, (_, i) => (
                    <option key={i} value={String(i).padStart(2, '0')}>
                      {String(i).padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <select 
                  id="end_time_minute" 
                  name="end_time_minute" 
                  value={formData.end_time ? formData.end_time.split(':')[1] : ''}
                  onChange={(e) => {
                    const hour = formData.end_time ? formData.end_time.split(':')[0] : '00';
                    const minute = e.target.value;
                    setFormData({...formData, end_time: `${hour}:${minute}`});
                  }}
                  required 
                  className="mt-1 inline-block w-1/2 px-3 py-2 border border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="">Min</option>
                  {['00', '15', '30', '45'].map((minute) => (
                    <option key={minute} value={minute}>{minute}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="activity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Activity:</label>
              <input 
                type="text" 
                id="activity" 
                name="activity" 
                value={formData.activity} 
                onChange={handleChange}
                required 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type:</label>
              <select 
                id="type" 
                name="type" 
                value={formData.type} 
                onChange={handleChange}
                required 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
              <label htmlFor="details" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Details:</label>
              <textarea 
                id="details" 
                name="details" 
                value={formData.details || ''} 
                onChange={handleChange}
                rows="3" 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              ></textarea>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
              >
                Save
              </button>
            </div>
          </form>
      </div>
    </div>
  );
};

export default ActivityModal;