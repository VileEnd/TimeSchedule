import React, { createContext, useState, useContext, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  
  const generateId = () => `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const addNotification = useCallback((message, type = 'info', duration = 3000) => {
    const id = generateId();
    const newNotification = {
      id,
      message,
      type, // 'success', 'error', 'warning', 'info'
      duration
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
    
    return id;
  }, [removeNotification]);
  
  const showAlert = useCallback((message) => {
    return addNotification(message, 'info', 5000);
  }, [addNotification]);
  
  const showSuccess = useCallback((message) => {
    return addNotification(message, 'success', 3000);
  }, [addNotification]);
  
  const showError = useCallback((message) => {
    return addNotification(message, 'error', 5000);
  }, [addNotification]);
  
  const showWarning = useCallback((message) => {
    return addNotification(message, 'warning', 4000);
  }, [addNotification]);
  
  const showConfirm = useCallback((message, onConfirm, onCancel) => {
    const id = generateId();
    const newNotification = {
      id,
      message,
      type: 'confirm',
      duration: 0, // Confirm notifications don't auto-dismiss
      onConfirm: () => {
        removeNotification(id);
        if (onConfirm) onConfirm();
      },
      onCancel: () => {
        removeNotification(id);
        if (onCancel) onCancel();
      }
    };
    
    setNotifications(prev => [...prev, newNotification]);
    return id;
  }, [removeNotification]);
  
  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        showAlert,
        showSuccess,
        showError,
        showWarning,
        showConfirm
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;