import React from 'react';
import { useNotification } from '../context/NotificationContext.js';

const Toast = ({ notification, onClose }) => {
  const { id, message, type } = notification;
  
  // Tailwind classes based on notification type
  const getToastClasses = () => {
    const baseClasses = "p-3 rounded-lg shadow-md mb-2 flex justify-between items-start transition-all duration-300 transform translate-x-0";
    
    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-100 border-l-4 border-green-500 text-green-800`;
      case 'error':
        return `${baseClasses} bg-red-100 border-l-4 border-red-500 text-red-800`;
      case 'warning':
        return `${baseClasses} bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800`;
      case 'info':
        return `${baseClasses} bg-blue-100 border-l-4 border-blue-500 text-blue-800`;
      case 'confirm':
        return `${baseClasses} bg-purple-100 border-l-4 border-purple-500 text-purple-800`;
      default:
        return `${baseClasses} bg-gray-100 border-l-4 border-gray-500 text-gray-800`;
    }
  };
  
  const getIcon = () => {
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
            className="px-3 py-1 text-xs font-medium text-gray-800 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => onClose(id)}
          className="ml-2 text-sm font-medium text-gray-600 hover:text-gray-800"
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