/**
 * Task Tracker Service - Monitors current tasks and sends push notifications
 */
import { sendCurrentTaskNotification } from './NotificationService.js';
import { isTaskNotificationsEnabled } from './NotificationService.js';

// Parse time string "HH:MM" to minutes since midnight
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours * 60) + minutes;
};

// Format time range "HH:MM-HH:MM"
const formatTimeRange = (startTime, endTime) => {
  return `${startTime} - ${endTime}`;
};

// Get the current day of the week
const getCurrentDay = () => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
};

// Get current time in minutes since midnight
const getCurrentTimeInMinutes = () => {
  const now = new Date();
  return (now.getHours() * 60) + now.getMinutes();
};

// Find current task from schedule data
export const findCurrentTask = (scheduleData) => {
  const currentDay = getCurrentDay();
  const nowInMinutes = getCurrentTimeInMinutes();
  
  // No schedule for today
  if (!scheduleData || !scheduleData[currentDay] || !Array.isArray(scheduleData[currentDay])) {
    return null;
  }
  
  // Find tasks that are currently active
  const currentTasks = scheduleData[currentDay].filter(task => {
    const startTimeMinutes = parseTimeToMinutes(task.start_time);
    const endTimeMinutes = parseTimeToMinutes(task.end_time);
    
    return nowInMinutes >= startTimeMinutes && nowInMinutes < endTimeMinutes;
  });
  
  // Return the first current task or null
  return currentTasks.length > 0 ? currentTasks[0] : null;
};

// Find upcoming tasks in the next N minutes
export const findUpcomingTasks = (scheduleData, minutesAhead = 15) => {
  const currentDay = getCurrentDay();
  const nowInMinutes = getCurrentTimeInMinutes();
  const lookAheadTime = nowInMinutes + minutesAhead;
  
  // No schedule for today
  if (!scheduleData || !scheduleData[currentDay] || !Array.isArray(scheduleData[currentDay])) {
    return [];
  }
  
  // Find tasks that will start within the time window
  const upcomingTasks = scheduleData[currentDay].filter(task => {
    const startTimeMinutes = parseTimeToMinutes(task.start_time);
    
    return startTimeMinutes > nowInMinutes && startTimeMinutes <= lookAheadTime;
  });
  
  // Sort by start time
  return upcomingTasks.sort((a, b) => 
    parseTimeToMinutes(a.start_time) - parseTimeToMinutes(b.start_time)
  );
};

// Update app title with current task
export const updateAppTitle = (currentTask) => {
  if (currentTask) {
    const { activity, start_time, end_time } = currentTask;
    document.title = `${activity} (${start_time}-${end_time}) - TimeBloc`;
  } else {
    document.title = 'TimeBloc Schedule Planner';
  }
};

// Send notification for current task if enabled
export const notifyCurrentTask = async (task) => {
  // Skip if notifications are disabled
  if (!isTaskNotificationsEnabled()) {
    return false;
  }
  
  // Skip if no task is current
  if (!task) {
    return false;
  }
  
  const { id, activity, start_time, end_time } = task;
  const timeRange = formatTimeRange(start_time, end_time);
  
  return await sendCurrentTaskNotification(
    id || `task-${Date.now()}`, 
    activity,
    timeRange
  );
};

// Check and process current tasks
let lastProcessedTaskId = null;
export const processCurrentTask = async (scheduleData) => {
  const currentTask = findCurrentTask(scheduleData);
  
  // Update app title
  updateAppTitle(currentTask);
  
  // Send notification if it's a different task than the last one we processed
  if (currentTask) {
    const currentTaskId = currentTask.id || `${currentTask.activity}-${currentTask.start_time}`;
    
    if (currentTaskId !== lastProcessedTaskId) {
      await notifyCurrentTask(currentTask);
      lastProcessedTaskId = currentTaskId;
    }
  } else {
    // Reset last processed task if no current task
    lastProcessedTaskId = null;
  }
  
  return currentTask;
};

// Create the service object before exporting
const TaskTrackerService = {
  findCurrentTask,
  findUpcomingTasks,
  updateAppTitle,
  notifyCurrentTask,
  processCurrentTask
};

export default TaskTrackerService;