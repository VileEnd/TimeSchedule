import React from 'react';
import { useNotification } from '../context/NotificationContext.js';

const Toast = ({ notification, onClose }) => {
  const { id, message, type } = notification;
  
  // Tailwind classes based on notification type
  const getToastClasses = () => {
    const baseClasses = "p-3 rounded-lg shadow-md mb-2 flex justify-between items-start transition-all duration-300 transform translate-x-0";
    
    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-100 dark:bg-green-900 border-l-4 border-green-500 dark:border-green-700 text-green-800 dark:text-green-200`;
      case 'error':
        return `${baseClasses} bg-red-100 dark:bg-red-900 border-l-4 border-red-500 dark:border-red-700 text-red-800 dark:text-red-200`;
      case 'warning':
        return `${baseClasses} bg-yellow-100 dark:bg-yellow-900 border-l-4 border-yellow-500 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200`;
      case 'info':
        return `${baseClasses} bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500 dark:border-blue-700 text-blue-800 dark:text-blue-200`;
      case 'confirm':
        return `${baseClasses} bg-purple-100 dark:bg-purple-900 border-l-4 border-purple-500 dark:border-purple-700 text-purple-800 dark:text-purple-200`;
      default:
        return `${baseClasses} bg-gray-100 dark:bg-gray-900 border-l-4 border-gray-500 dark:border-gray-700 text-gray-800 dark:text-gray-200`;
    }
  };
  
  // Check if this is a loading notification (shows a spinner instead of checkmark)
  const isLoadingNotification = type === 'success' && 
    (message.toLowerCase().includes('generating') || 
     message.toLowerCase().includes('connecting') ||
     message.toLowerCase().includes('loading') ||
     message.toLowerCase().includes('processing') ||
     message.toLowerCase().includes('this may take'));
  
  const getIcon = () => {
    if (isLoadingNotification) {
      return (
        <svg className="animate-spin h-5 w-5 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      );
    }
    
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      case 'confirm':
        return '?';
      default:
        return '';
    }
  };
  
  return (
    <div className={getToastClasses()} role="alert">
      <div className="flex">
        <span className="font-bold mr-2">{getIcon()}</span>
        <div className="text-sm">{message}</div>
      </div>
      
      {type === 'confirm' ? (
        <div className="flex mt-2 space-x-2">
          <button
            onClick={notification.onConfirm}
            className="px-3 py-1 text-xs font-medium text-white bg-purple-500 rounded hover:bg-purple-600"
          >
            Confirm
          </button>
          <button
            onClick={notification.onCancel}
            className="px-3 py-1 text-xs font-medium text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => onClose(id)}
          className="ml-2 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Close notification"
        >
          ✕
        </button>
      )}
    </div>
  );
};

const NotificationSystem = () => {
  const { notifications, removeNotification } = useNotification();
  
  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm space-y-2" aria-live="polite">
      {notifications.map(notification => (
        <Toast 
          key={notification.id} 
          notification={notification} 
          onClose={removeNotification} 
        />
      ))}
    </div>
  );
};

export default NotificationSystem;