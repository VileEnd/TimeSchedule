import { useState, useEffect } from 'react';
import { 
  isNotificationsSupported, 
  getNotificationPermission,
  requestNotificationPermission, 
  isTaskNotificationsEnabled,
  setTaskNotificationsEnabled
} from '../services/NotificationService.js';

/**
 * React hook for handling notification permissions and settings
 */
export const useNotifications = () => {
  const [notificationsSupported, setNotificationsSupported] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [taskNotificationsEnabled, setTaskNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize notification state
  useEffect(() => {
    const initNotifications = async () => {
      const supported = isNotificationsSupported();
      setNotificationsSupported(supported);
      
      if (supported) {
        // Get current permission state
        const permission = getNotificationPermission();
        setNotificationPermission(permission);
        
        // Check if task notifications are enabled
        setTaskNotificationsEnabled(isTaskNotificationsEnabled());
      }
      
      setLoading(false);
    };
    
    initNotifications();
  }, []);

  // Request permission for notifications
  const requestPermission = async () => {
    setLoading(true);
    
    try {
      const { granted, permission } = await requestNotificationPermission();
      setNotificationPermission(permission);
      
      if (granted) {
        // If permission is granted, enable task notifications by default
        setAndUpdateTaskNotifications(true);
      }
      
      return { granted, permission };
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return { granted: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Enable or disable task notifications
  const setAndUpdateTaskNotifications = (enabled) => {
    const result = setTaskNotificationsEnabled(enabled);
    setTaskNotificationsEnabled(result);
    return result;
  };

  return {
    notificationsSupported,
    notificationPermission,
    taskNotificationsEnabled,
    loading,
    requestPermission,
    setTaskNotificationsEnabled: setAndUpdateTaskNotifications
  };
};

export default useNotifications;