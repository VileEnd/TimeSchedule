import React, { useState, useEffect } from 'react';
import { usePomodoroSettings } from '../context/PomodoroSettingsContext.js';
import { useNotification } from '../context/NotificationContext.js';

const PomodoroSettingsModal = ({ onClose }) => {
  const { settings, updateSettings } = usePomodoroSettings();
  const { showSuccess } = useNotification();
  const [formValues, setFormValues] = useState({ ...settings });

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

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormValues({
      ...formValues,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value, 10) : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateSettings(formValues);
    showSuccess('Pomodoro settings updated successfully!');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto" 
      style={{padding: '1rem'}}
      onClick={handleBackdropClick}
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
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Pomodoro Timer Settings</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Work Duration (minutes)
              </label>
              <input
                type="number"
                name="workDuration"
                min="1"
                max="120"
                value={formValues.workDuration}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Short Break (minutes)
              </label>
              <input
                type="number"
                name="shortBreakDuration"
                min="1"
                max="30"
                value={formValues.shortBreakDuration}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Long Break (minutes)
              </label>
              <input
                type="number"
                name="longBreakDuration"
                min="1"
                max="60"
                value={formValues.longBreakDuration}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Cycles Before Long Break
              </label>
              <input
                type="number"
                name="cyclesBeforeLongBreak"
                min="1"
                max="10"
                value={formValues.cyclesBeforeLongBreak}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
          </div>
          
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="autoStartBreaks"
              name="autoStartBreaks"
              checked={formValues.autoStartBreaks}
              onChange={handleChange}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label htmlFor="autoStartBreaks" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Auto-start breaks
            </label>
          </div>
          
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="autoStartPomodoros"
              name="autoStartPomodoros"
              checked={formValues.autoStartPomodoros}
              onChange={handleChange}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label htmlFor="autoStartPomodoros" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Auto-start work sessions after breaks
            </label>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Alarm Sound</label>
            <div className="flex space-x-2">
              <select
                name="alarmSound"
                value={formValues.alarmSound}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="bell">Bell</option>
                <option value="chime">Chime</option>
                <option value="digital">Digital</option>
              </select>
              <button 
                type="button" 
                onClick={() => {
                  const audio = new Audio(`/sounds/${formValues.alarmSound}.mp3`);
                  audio.volume = formValues.alarmVolume;
                  audio.play().catch(err => console.error('Error playing sound:', err));
                }}
                className="mt-1 px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                aria-label="Test sound"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Alarm Volume: {Math.round(formValues.alarmVolume * 100)}%
            </label>
            <input
              type="range"
              name="alarmVolume"
              min="0"
              max="1"
              step="0.1"
              value={formValues.alarmVolume}
              onChange={handleChange}
              className="w-full"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
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
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PomodoroSettingsModal;