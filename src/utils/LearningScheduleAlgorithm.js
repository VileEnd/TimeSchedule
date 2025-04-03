import { timeToMinutes } from '../utils.js';

// Helper function to convert minutes back to "HH:MM" time format
export const minutesToTimeStr = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

// Determine if an activity is fixed (immovable)
const isFixedActivity = (activity) => {
  const fixedTypes = ['University', 'Work', 'Sleep', 'Meal', 'Routine', 'Travel'];
  return fixedTypes.includes(activity.type);
};

// Determine if an activity is a possible learning option
const isPossibleLearningOption = (activity) => {
  return activity.type === 'Flexible' || 
         (activity.details && activity.details.toLowerCase().includes('possible learn option'));
};

// Get all time slots between fixed activities that might be available for learning
const findAvailableSlots = (daySchedule) => {
  // First, sort the schedule by start time
  const sortedSchedule = [...daySchedule].sort(
    (a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
  );
  
  const fixedActivities = sortedSchedule.filter(isFixedActivity);
  const slots = [];
  
  // Check each gap between fixed activities
  for (let i = 0; i < fixedActivities.length - 1; i++) {
    const current = fixedActivities[i];
    const next = fixedActivities[i + 1];
    
    const currentEndMinutes = timeToMinutes(current.end_time);
    const nextStartMinutes = timeToMinutes(next.start_time);
    
    // If there's a gap, create a slot
    if (nextStartMinutes > currentEndMinutes) {
      slots.push({
        start_time: current.end_time,
        end_time: next.start_time,
        durationMinutes: nextStartMinutes - currentEndMinutes,
        afterActivity: current.activity,
        beforeActivity: next.activity
      });
    }
  }
  
  return slots;
};

// Analyze the slot and determine if it's suitable for learning
const analyzeSlot = (slot, existingActivities, config) => {
  const { durationMinutes, afterActivity } = slot; // beforeActivity removed as unused
  
  // Skip slots that are too short
  if (durationMinutes < config.minimumLearningBlockMinutes) {
    return { suitability: 0, reason: 'Too short' };
  }
  
  // Check if any activities already in this time slot
  const overlappingActivities = existingActivities.filter(activity => {
    const activityStart = timeToMinutes(activity.start_time);
    const activityEnd = timeToMinutes(activity.end_time);
    const slotStart = timeToMinutes(slot.start_time);
    const slotEnd = timeToMinutes(slot.end_time);
    
    // Check for any overlap
    return (activityStart < slotEnd && activityEnd > slotStart);
  });
  
  // If there are fixed activities here, the slot is unusable
  if (overlappingActivities.some(isFixedActivity)) {
    return { suitability: 0, reason: 'Contains fixed activities' };
  }
  
  // If it only has flexible activities, we can potentially replace/adjust them
  const hasFlexibleActivities = overlappingActivities.some(
    a => !isFixedActivity(a) && !isPossibleLearningOption(a)
  );
  
  // Calculate suitability score (0-100)
  let suitability = 100;
  
  // Reduce suitability if slot has flexible activities
  if (hasFlexibleActivities) {
    suitability -= 30;
  }
  
  // Analyze if the preceding activity is conducive to learning
  // Lower suitability after mentally taxing activities
  if (afterActivity.toLowerCase().includes('intensive') || 
      afterActivity.toLowerCase().includes('exam')) {
    suitability -= 20;
  }
  
  // Increase suitability after breaks or meals (good transition to learning)
  if (afterActivity.toLowerCase().includes('break') || 
      afterActivity.toLowerCase().includes('meal')) {
    suitability += 10;
  }
  
  // Calculate optimal learning time based on time of day
  const startTimeMinutes = timeToMinutes(slot.start_time);
  const hourOfDay = Math.floor(startTimeMinutes / 60);
  
  // Apply time-of-day preferences from config
  if (config.preferredLearningHours.includes(hourOfDay)) {
    suitability += 15;
  }
  
  // Prefer slots that match the learning block duration exactly
  if (Math.abs(durationMinutes - config.idealLearningBlockMinutes) < 15) {
    suitability += 10;
  }
  
  // Cap suitability at 100
  suitability = Math.min(100, suitability);
  
  return {
    suitability,
    hasFlexibleActivities,
    overlappingActivities,
    reason: suitability < 50 ? 'Low suitability score' : null
  };
};

// Create a learning block for a given slot
const createLearningBlock = (slot, daySchedule, config) => {
  const { start_time, end_time, durationMinutes } = slot;
  
  // Determine actual duration (may be adjusted based on config)
  let actualDuration = Math.min(
    durationMinutes, 
    config.maximumLearningBlockMinutes
  );
  
  // Ensure minimum duration
  if (actualDuration < config.minimumLearningBlockMinutes) {
    return null;
  }
  
  // Calculate start and end times
  const startMinutes = timeToMinutes(start_time);
  let endMinutes = startMinutes + actualDuration;
  
  // Round to nearest 5 or 15 minutes if configured
  if (config.roundToMinutes > 0) {
    endMinutes = Math.round(endMinutes / config.roundToMinutes) * config.roundToMinutes;
  }
  
  // If rounded end time exceeds slot end time, adjust
  const slotEndMinutes = timeToMinutes(end_time);
  if (endMinutes > slotEndMinutes) {
    endMinutes = slotEndMinutes;
  }
  
  // Final check on duration after adjustments
  const finalDuration = endMinutes - startMinutes;
  if (finalDuration < config.minimumLearningBlockMinutes) {
    return null;
  }
  
  // Determine subject based on config priorities
  const subject = config.subjectPriorities[0]?.name || 'General Learning';
  
  // Create the learning block
  return {
    start_time: minutesToTimeStr(startMinutes),
    end_time: minutesToTimeStr(endMinutes),
    activity: `Learning: ${subject}`,
    type: 'Study_Intensive',
    details: 'Automatically scheduled learning block',
    isAutoGenerated: true // Flag to identify auto-generated blocks
  };
};

// Main function to generate learning blocks for a day
export const generateLearningBlocksForDay = (daySchedule, config) => {
  // Find available time slots
  const availableSlots = findAvailableSlots(daySchedule);
  
  // Analyze each slot
  const analyzedSlots = availableSlots.map(slot => ({
    ...slot,
    ...analyzeSlot(slot, daySchedule, config)
  }));
  
  // Sort slots by suitability (highest first)
  const suitableSlots = analyzedSlots
    .filter(slot => slot.suitability >= config.minimumSuitabilityScore)
    .sort((a, b) => b.suitability - a.suitability);
  
  // Determine how many learning blocks to create based on config
  const targetBlockCount = Math.min(
    config.maximumDailyBlocks,
    suitableSlots.length
  );
  
  // Create learning blocks
  const learningBlocks = [];
  let remainingLearningTime = config.dailyLearningMinutes;
  
  for (let i = 0; i < suitableSlots.length && learningBlocks.length < targetBlockCount; i++) {
    const slot = suitableSlots[i];
    
    // Skip if we've already allocated all learning time
    if (remainingLearningTime <= 0) break;
    
    // Adjust config to respect remaining learning time
    const adjustedConfig = {
      ...config,
      maximumLearningBlockMinutes: Math.min(
        config.maximumLearningBlockMinutes,
        remainingLearningTime
      )
    };
    
    const learningBlock = createLearningBlock(slot, daySchedule, adjustedConfig);
    
    if (learningBlock) {
      learningBlocks.push(learningBlock);
      
      // Update remaining learning time
      const blockDuration = timeToMinutes(learningBlock.end_time) - 
                           timeToMinutes(learningBlock.start_time);
      remainingLearningTime -= blockDuration;
    }
  }
  
  return learningBlocks;
};

// Main function to automate learning schedule across all days
export const generateLearningSchedule = (scheduleData, config) => {
  const newSchedule = { ...scheduleData };
  
  // Process each day
  Object.keys(newSchedule).forEach(day => {
    // First, remove any previously auto-generated learning blocks
    newSchedule[day] = newSchedule[day].filter(activity => !activity.isAutoGenerated);
    
    // Generate new learning blocks
    const learningBlocks = generateLearningBlocksForDay(newSchedule[day], config);
    
    // Add new learning blocks to the schedule
    newSchedule[day] = [...newSchedule[day], ...learningBlocks];
    
    // Sort by start time
    newSchedule[day].sort((a, b) => 
      timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
    );
  });
  
  return newSchedule;
};

// Default configuration for learning block insertion
export const defaultLearningConfig = {
  minimumLearningBlockMinutes: 25, // Minimum duration for a learning block (1 pomodoro)
  idealLearningBlockMinutes: 50,   // Ideal duration (2 pomodoros)
  maximumLearningBlockMinutes: 90, // Maximum duration for a single block
  minimumSuitabilityScore: 50,     // Minimum score to consider a slot
  maximumDailyBlocks: 3,           // Maximum learning blocks per day
  dailyLearningMinutes: 120,       // Target daily learning minutes
  roundToMinutes: 5,               // Round to nearest X minutes (0 to disable)
  preferredLearningHours: [8, 9, 10, 14, 15, 16], // Preferred hours of day (0-23)
  subjectPriorities: [
    { name: 'Business Statistics', weight: 3 },
    { name: 'Micro-Economics', weight: 2 },
    { name: 'Spanish', weight: 1 }
  ],
  respectExistingBreaks: true,     // Don't schedule learning right after another learning block
  preserveFlexibleActivities: false // If true, don't replace flexible activities
};