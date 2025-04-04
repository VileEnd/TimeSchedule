import { useEffect, useState } from 'react';
import { useSchedule } from '../context/ScheduleContext.js';
import { processCurrentTask, findUpcomingTasks } from '../services/TaskTrackerService.js';

/**
 * TaskTracker component - Silently tracks current tasks and sends notifications
 * This component doesn't render any UI but performs background tasks
 */
const TaskTracker = () => {
  const { scheduleData } = useSchedule();
  // eslint-disable-next-line no-unused-vars
  const [currentTask, setCurrentTask] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  
  // Set up task tracking
  useEffect(() => {
    // Initial check
    const checkCurrentTask = async () => {
      const task = await processCurrentTask(scheduleData);
      setCurrentTask(task);
      
      // Check for upcoming tasks
      const upcoming = findUpcomingTasks(scheduleData);
      setUpcomingTasks(upcoming);
    };
    
    // Run immediately
    checkCurrentTask();
    
    // Then set up interval to check every minute
    const interval = setInterval(checkCurrentTask, 60 * 1000);
    
    return () => clearInterval(interval);
  }, [scheduleData]);
  
  // This component doesn't render anything visual
  return null;
};

export default TaskTracker;