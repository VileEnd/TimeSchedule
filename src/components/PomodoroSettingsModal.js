import React, { useState } from 'react';
import { usePomodoroSettings } from '../context/PomodoroSettingsContext.js';
import { useNotification } from '../context/NotificationContext.js';

const PomodoroSettingsModal = ({ onClose }) => {
  const { settings, updateSettings } = usePomodoroSettings();
  const { showSuccess } = useNotification();
  const [formValues, setFormValues] = useState({ ...settings });

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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Pomodoro Timer Settings</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Work Duration (minutes)
              </label>
              <input
                type="number"
                name="workDuration"
                min="1"
                max="120"
                value={formValues.workDuration}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Short Break (minutes)
              </label>
              <input
                type="number"
                name="shortBreakDuration"
                min="1"
                max="30"
                value={formValues.shortBreakDuration}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Long Break (minutes)
              </label>
              <input
                type="number"
                name="longBreakDuration"
                min="1"
                max="60"
                value={formValues.longBreakDuration}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cycles Before Long Break
              </label>
              <input
                type="number"
                name="cyclesBeforeLongBreak"
                min="1"
                max="10"
                value={formValues.cyclesBeforeLongBreak}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="autoStartBreaks" className="ml-2 block text-sm text-gray-700">
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
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="autoStartPomodoros" className="ml-2 block text-sm text-gray-700">
              Auto-start work sessions after breaks
            </label>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Alarm Sound</label>
            <select
              name="alarmSound"
              value={formValues.alarmSound}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="bell">Bell</option>
              <option value="chime">Chime</option>
              <option value="digital">Digital</option>
            </select>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700">
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
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
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