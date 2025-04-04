import React from 'react';
import useNotifications from '../hooks/useNotifications.js';

/**
 * Component for notification settings and permission management
 */
const NotificationSettings = () => {
  const { 
    notificationsSupported,
    notificationPermission, 
    taskNotificationsEnabled,
    loading,
    requestPermission,
    setTaskNotificationsEnabled
  } = useNotifications();
  
  // Handle request permission button click
  const handleRequestPermission = async () => {
    const { granted } = await requestPermission();
    if (granted) {
      // Show success message to the user
    }
  };
  
  // Handle toggle task notifications
  const handleToggleTaskNotifications = (e) => {
    setTaskNotificationsEnabled(e.target.checked);
  };
  
  // Show loading state
  if (loading) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Render unsupported state
  if (!notificationsSupported) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <p className="text-gray-700 dark:text-gray-300">
          Notifications are not supported in your browser. To receive notifications about schedule changes and reminders, try using a modern browser like Chrome, Firefox, or Edge.
        </p>
      </div>
    );
  }
  
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
        Push Notification Settings
      </h3>
      
      {/* Permission status */}
      <div className="mb-4">
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
          Notification permission: 
          <span className={`ml-2 font-medium ${
            notificationPermission === 'granted' ? 'text-green-600 dark:text-green-400' :
            notificationPermission === 'denied' ? 'text-red-600 dark:text-red-400' :
            'text-yellow-600 dark:text-yellow-400'
          }`}>
            {notificationPermission === 'granted' ? 'Allowed' :
             notificationPermission === 'denied' ? 'Blocked' : 'Not requested'}
          </span>
        </p>
        
        {notificationPermission === 'default' && (
          <button 
            onClick={handleRequestPermission}
            className="mt-2 flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg shadow-sm hover:shadow transition-all"
          >
            <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Allow Notifications
          </button>
        )}
        
        {notificationPermission === 'denied' && (
          <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">
              Notifications are blocked. To receive notifications, you'll need to enable them in your browser settings.
            </p>
          </div>
        )}
      </div>
      
      {/* Notification options - only show when permission is granted */}
      {notificationPermission === 'granted' && (
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              id="task-notifications"
              type="checkbox"
              checked={taskNotificationsEnabled}
              onChange={handleToggleTaskNotifications}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label htmlFor="task-notifications" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Task Reminders
            </label>
          </div>
          
          <p className="text-xs text-gray-600 dark:text-gray-400">
            You'll receive notifications about current tasks and when it's time to start working on scheduled items.
          </p>
          
          <div className="mt-2 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/40 rounded-lg">
            <p className="text-sm text-purple-700 dark:text-purple-300">
              You'll also receive notifications when AI processing is complete and your schedule is ready to review.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;