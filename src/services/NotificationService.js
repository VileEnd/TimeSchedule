/**
 * Notification Service - Handles browser push notifications and task reminder notifications
 */

// Check if notifications are supported
export const isNotificationsSupported = () => {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
};

// Request permission for notifications
export const requestNotificationPermission = async () => {
  if (!isNotificationsSupported()) {
    return { granted: false, error: 'Notifications not supported in this browser' };
  }
  
  try {
    const permission = await Notification.requestPermission();
    return { granted: permission === 'granted', permission };
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return { granted: false, error };
  }
};

// Check current notification permission
export const getNotificationPermission = () => {
  if (!isNotificationsSupported()) return 'unsupported';
  return Notification.permission;
};

// Send a notification when AI processing starts
export const sendAIProcessingNotification = async () => {
  if (!isNotificationsSupported()) return false;
  
  const registration = await navigator.serviceWorker.ready;
  if (!registration.active) return false;
  
  try {
    registration.active.postMessage({
      type: 'AI_PROCESSING'
    });
    return true;
  } catch (error) {
    console.error('Error sending AI processing notification:', error);
    return false;
  }
};

// Send a notification when AI processing is complete
export const sendAICompleteNotification = async (message, totalBlocksAdded) => {
  if (!isNotificationsSupported()) return false;
  
  const registration = await navigator.serviceWorker.ready;
  if (!registration.active) return false;
  
  try {
    registration.active.postMessage({
      type: 'AI_COMPLETE',
      message: message || `AI has created a schedule with ${totalBlocksAdded} blocks. Ready to review!`,
      totalBlocksAdded
    });
    return true;
  } catch (error) {
    console.error('Error sending AI complete notification:', error);
    return false;
  }
};

// Send a notification for the current task
export const sendCurrentTaskNotification = async (taskId, taskName, timeRange) => {
  if (!isNotificationsSupported()) return false;
  
  const registration = await navigator.serviceWorker.ready;
  if (!registration.active) return false;
  
  try {
    registration.active.postMessage({
      type: 'CURRENT_TASK',
      taskId,
      taskName,
      timeRange
    });
    return true;
  } catch (error) {
    console.error('Error sending current task notification:', error);
    return false;
  }
};

// Send a generic notification
export const sendNotification = async (title, body, options = {}) => {
  if (!isNotificationsSupported()) return false;
  
  const registration = await navigator.serviceWorker.ready;
  if (!registration.active) return false;
  
  try {
    registration.active.postMessage({
      type: 'SHOW_NOTIFICATION',
      title,
      body,
      ...options
    });
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
};

// Check if task notifications are currently enabled
export const isTaskNotificationsEnabled = () => {
  return localStorage.getItem('enableTaskNotifications') === 'true';
};

// Enable or disable task notifications
export const setTaskNotificationsEnabled = (enabled) => {
  localStorage.setItem('enableTaskNotifications', enabled.toString());
  return enabled;
};

export default {
  isNotificationsSupported,
  requestNotificationPermission,
  getNotificationPermission,
  sendAIProcessingNotification,
  sendAICompleteNotification,
  sendCurrentTaskNotification,
  sendNotification,
  isTaskNotificationsEnabled,
  setTaskNotificationsEnabled
};