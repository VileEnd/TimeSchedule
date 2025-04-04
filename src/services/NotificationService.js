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
  
  try {
    // First try to use the Push API for native push notifications on mobile
    const registration = await navigator.serviceWorker.ready;
    if (!registration.active) return false;

    // Store processing state for background tracking
    localStorage.setItem('aiProcessingInProgress', 'true');
    localStorage.setItem('aiProcessingStartTime', Date.now().toString());
    
    // Send push notification
    registration.active.postMessage({
      type: 'AI_PROCESSING'
    });
    
    // Try to create an Android specific notification if available
    if ('Notification' in window && 'android' in navigator) {
      try {
        // Create a notification with high priority for Android
        const notification = new Notification('AI Processing', {
          body: 'Processing your schedule in the background. You will be notified when complete.',
          icon: '/icons/icon_x192.png',
          badge: '/icons/icon_x192.png',
          tag: 'ai-processing-notification',
          silent: false,
          renotify: true,
          requireInteraction: true,
          vibrate: [100, 50, 100]
        });
        
        console.log('Created Android notification');
      } catch (error) {
        console.error('Error creating Android notification:', error);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error sending AI processing notification:', error);
    return false;
  }
};

// Send a notification when AI processing is complete
export const sendAICompleteNotification = async (message, totalBlocksAdded) => {
  if (!isNotificationsSupported()) return false;
  
  try {
    // Clear processing state
    localStorage.removeItem('aiProcessingInProgress');
    localStorage.removeItem('aiProcessingStartTime');
    
    // First try to use the Push API
    const registration = await navigator.serviceWorker.ready;
    if (!registration.active) return false;
    
    // Default message if none provided
    const notificationMessage = message || `AI has created a schedule with ${totalBlocksAdded} blocks. Ready to review!`;
    
    // Send service worker push notification
    registration.active.postMessage({
      type: 'AI_COMPLETE',
      message: notificationMessage,
      totalBlocksAdded
    });
    
    // Try to create a native notification for Android/iOS
    if ('Notification' in window) {
      try {
        // Close any existing processing notifications
        const notifications = await registration.getNotifications({tag: 'ai-processing-notification'});
        notifications.forEach(notification => notification.close());
        
        // Check if we should use Android-specific features
        const notificationOptions = {
          body: notificationMessage,
          icon: '/icons/icon_x192.png',
          badge: '/icons/icon_x192.png',
          tag: 'ai-complete-notification',
          renotify: true,
          requireInteraction: true,
          vibrate: [200, 100, 200]
        };
        
        // Create a high-importance notification on Android/iOS
        const notification = new Notification('Schedule Ready', notificationOptions);
        
        // Add click handler for the notification
        notification.onclick = () => {
          // Focus on the app window when notification is clicked
          window.focus();
          
          // Navigate to the right tab/view
          if (window.location.href.indexOf('?viewAiSchedule=true') === -1) {
            window.location.href = window.location.origin + '?viewAiSchedule=true';
          }
          
          notification.close();
        };
        
        console.log('Created native notification for completion');
      } catch (error) {
        console.error('Error creating native notification:', error);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error sending AI complete notification:', error);
    return false;
  }
};

// Send a notification for the current task
export const sendCurrentTaskNotification = async (taskId, taskName, timeRange) => {
  if (!isNotificationsSupported()) return false;
  
  try {
    // First try to use the service worker for push notifications
    const registration = await navigator.serviceWorker.ready;
    if (!registration.active) return false;
    
    // Send to service worker
    registration.active.postMessage({
      type: 'CURRENT_TASK',
      taskId,
      taskName,
      timeRange
    });
    
    // Try to create a native notification for Android/iOS
    if ('Notification' in window) {
      try {
        // Create task notification options
        const notificationOptions = {
          body: `${taskName} - ${timeRange}`,
          icon: '/icons/icon_x192.png',
          badge: '/icons/icon_x192.png',
          tag: `task-${taskId}`,
          renotify: true,
          requireInteraction: true,
          vibrate: [100, 50, 100],
          actions: [
            {
              action: 'startTimer',
              title: 'Start Timer'
            }
          ],
          data: {
            taskId: taskId,
            url: window.location.origin + '?startTimer=' + taskId
          }
        };
        
        // Try to use actions for Android
        if ('android' in navigator) {
          notificationOptions.actions = [
            {
              action: 'startTimer',
              title: 'Start Timer',
              icon: '/icons/timer-icon.png'
            },
            {
              action: 'dismiss',
              title: 'Dismiss',
              icon: '/icons/dismiss-icon.png'
            }
          ];
        }
        
        // Create a high-importance notification
        const notification = new Notification('Task Reminder', notificationOptions);
        
        // Add click handler for the notification
        notification.onclick = (event) => {
          // Handle action clicks
          if (event.action === 'startTimer') {
            window.focus();
            window.location.href = window.location.origin + '?startTimer=' + taskId;
          } else {
            // Regular notification click
            window.focus();
          }
          
          notification.close();
        };
        
        console.log('Created native task notification');
      } catch (error) {
        console.error('Error creating native task notification:', error);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error sending current task notification:', error);
    return false;
  }
};

// Send a generic notification
export const sendNotification = async (title, body, options = {}) => {
  if (!isNotificationsSupported()) return false;
  
  try {
    // First try to use service worker
    const registration = await navigator.serviceWorker.ready;
    if (!registration.active) return false;
    
    // Send to service worker for PWA support
    registration.active.postMessage({
      type: 'SHOW_NOTIFICATION',
      title,
      body,
      ...options
    });
    
    // Try to create a native notification for Android/iOS
    if ('Notification' in window) {
      try {
        // Prepare notification options
        const notificationOptions = {
          body: body,
          icon: '/icons/icon_x192.png',
          badge: '/icons/icon_x192.png',
          tag: options.tag || 'general-notification',
          vibrate: options.vibrate || [100, 50, 100],
          requireInteraction: options.requireInteraction || false,
          renotify: options.renotify || false,
          ...options,
          // Handle special properties that might cause issues
          data: {
            url: window.location.origin,
            ...(options.data || {})
          }
        };
        
        // Create notification
        const notification = new Notification(title, notificationOptions);
        
        // Handle notification click
        notification.onclick = () => {
          window.focus();
          if (notificationOptions.data && notificationOptions.data.url) {
            window.location.href = notificationOptions.data.url;
          }
          notification.close();
        };
        
        console.log('Created native notification');
      } catch (error) {
        console.error('Error creating native notification:', error);
      }
    }
    
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