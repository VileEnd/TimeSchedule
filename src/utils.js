// Time conversion functions
export const timeToMinutes = (timeStr) => {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return 0;
  return hours * 60 + minutes;
};

export const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime || !startTime.includes(':') || !endTime.includes(':')) return 'N/A';
  let startMinutes = timeToMinutes(startTime);
  let endMinutes = timeToMinutes(endTime);

  // Handle overnight or same minute end time
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  const durationMinutes = endMinutes - startMinutes;

  if (durationMinutes < 0 || isNaN(durationMinutes)) return 'Invalid';

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  let durationStr = '';
  if (hours > 0) {
    durationStr += `${hours}h `;
  }
  if (minutes > 0 || durationMinutes === 0) {
    durationStr += `${minutes}m`;
  } else if (hours > 0 && minutes === 0) {
    durationStr = durationStr.trim();
  }

  return durationStr.trim() || '0m';
};

// Activity type styling
export const getTypeColor = (type) => {
  switch (type) {
    case 'University': return 'border-blue-500 bg-blue-100';
    case 'Study_Intensive': return 'border-purple-600 bg-purple-100';
    case 'Study_Review': return 'border-indigo-600 bg-indigo-100';
    case 'Study_Prep': return 'border-teal-600 bg-teal-100';
    case 'Work': return 'border-green-600 bg-green-100';
    case 'Travel': return 'border-yellow-500 bg-yellow-100';
    case 'Routine': return 'border-gray-500 bg-gray-200';
    case 'Meal': return 'border-orange-500 bg-orange-100';
    case 'Break': return 'border-pink-500 bg-pink-100';
    case 'Sleep': return 'border-slate-600 bg-slate-200';
    case 'Flexible': return 'border-cyan-600 bg-cyan-100';
    case 'Language': return 'border-lime-600 bg-lime-100';
    case 'Free_Time': return 'border-rose-500 bg-rose-100';
    case 'Buffer': return 'border-stone-500 bg-stone-100';
    case 'Housework': return 'border-amber-600 bg-amber-100';
    case 'Other': return 'border-gray-400 bg-gray-100';
    default: return 'border-gray-400 bg-white';
  }
};

// ICS Calendar Generation
export const generateICS = (scheduleData, daysOfWeek) => {
  if (Object.keys(scheduleData).length === 0) {
    alert("Schedule data not loaded yet. Cannot generate ICS file.");
    return;
  }

  const cal = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//YourName//InteractiveScheduleApp-V2//EN',
    'CALSCALE:GREGORIAN'
  ];

  const now = new Date();
  const todayDow = (now.getDay() + 6) % 7;
  const daysUntilNextMonday = (7 - todayDow) % 7;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilNextMonday);
  nextMonday.setHours(0, 0, 0, 0);

  // Process the schedule data to ensure overnight activities are properly represented
  // The data is already split when loaded/saved, so we don't need to split it again here
  
  daysOfWeek.forEach((day, dayIndex) => {
    if (scheduleData[day] && scheduleData[day].length > 0) {
      const targetDate = new Date(nextMonday);
      targetDate.setDate(nextMonday.getDate() + dayIndex);

      scheduleData[day].forEach((item, itemIndex) => {
        if (!item.start_time || !item.end_time || !item.start_time.includes(':') || !item.end_time.includes(':')) {
          console.warn(`Skipping ICS entry due to invalid time: ${item.activity} on ${day}`);
          return;
        }

        const [startH, startM] = item.start_time.split(':').map(Number);
        const [endH, endM] = item.end_time.split(':').map(Number);

        if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) {
          console.warn(`Skipping ICS entry due to NaN time components: ${item.activity} on ${day}`);
          return;
        }

        const startDate = new Date(targetDate);
        startDate.setHours(startH, startM, 0, 0);

        const endDate = new Date(targetDate);
        endDate.setHours(endH, endM, 0, 0);

        // Handle end time correctly for the split activities
        // Activities ending at midnight are correctly handled as is
        // Activities that span midnight have already been split by our splitOvernightSchedules function
        if (endDate <= startDate && item.end_time !== '00:00') {
          endDate.setDate(endDate.getDate() + 1);
        }

        const formatLocalDate = (d) => {
          return d.getFullYear() +
                 ('0' + (d.getMonth() + 1)).slice(-2) +
                 ('0' + d.getDate()).slice(-2) + 'T' +
                 ('0' + d.getHours()).slice(-2) +
                 ('0' + d.getMinutes()).slice(-2) + '00';
        };
        
        const formatUtcDate = (d) => {
          return d.getUTCFullYear() +
                ('0' + (d.getUTCMonth() + 1)).slice(-2) +
                ('0' + d.getUTCDate()).slice(-2) + 'T' +
                ('0' + d.getUTCHours()).slice(-2) +
                ('0' + d.getUTCMinutes()).slice(-2) +
                ('0' + d.getUTCSeconds()).slice(-2) + 'Z';
        };

        const dtstamp = formatUtcDate(new Date());
        const dtstart = `DTSTART;TZID=Europe/Berlin:${formatLocalDate(startDate)}`;
        const dtend = `DTEND;TZID=Europe/Berlin:${formatLocalDate(endDate)}`;
        const summary = `SUMMARY:${(item.activity || 'Scheduled Event').replace(/([,;\\])/g, '\\$1')}`;
        const description = item.details
          ? `DESCRIPTION:${item.details.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n")}`
          : 'DESCRIPTION:';
        const uid = `UID:${formatLocalDate(startDate)}-${dayIndex}-${itemIndex}@yourscheduleapp.com`;

        cal.push('BEGIN:VEVENT');
        cal.push(uid);
        cal.push(`DTSTAMP:${dtstamp}`);
        cal.push(dtstart);
        cal.push(dtend);
        cal.push(summary);
        cal.push(description);
        cal.push(`CATEGORIES:${item.type || 'GENERAL'}`);
        cal.push('END:VEVENT');
      });
    }
  });

  cal.push('END:VCALENDAR');

  try {
    const blob = new Blob([cal.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'my_weekly_schedule.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error("Error creating or downloading ICS file:", e);
    alert("Sorry, there was an error creating the ICS file.");
  }
};

// Storage operations
// Function to handle splitting overnight schedules
export const splitOvernightSchedules = (scheduleData) => {
  if (!scheduleData) return scheduleData;
  
  const newScheduleData = JSON.parse(JSON.stringify(scheduleData)); // Deep clone
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  daysOfWeek.forEach((day, index) => {
    const nextDay = daysOfWeek[(index + 1) % 7];
    
    if (!newScheduleData[day]) return;
    
    // Find activities that go past midnight (primarily Sleep)
    const activitiesToSplit = newScheduleData[day].filter(activity => {
      const startMinutes = timeToMinutes(activity.start_time);
      const endMinutes = timeToMinutes(activity.end_time);
      return endMinutes <= startMinutes && activity.type === 'Sleep';
    });
    
    // Process each overnight activity
    activitiesToSplit.forEach(activity => {
      // Create a copy of the activity for the next day
      const nextDayActivity = {...activity};
      
      // Modify the original activity to end at midnight
      activity.end_time = '00:00';
      
      // Modify the next day activity to start at midnight
      nextDayActivity.start_time = '00:00';
      
      // Add the next day activity to the appropriate day
      if (!newScheduleData[nextDay]) {
        newScheduleData[nextDay] = [];
      }
      
      // Add to beginning of next day's schedule
      newScheduleData[nextDay].unshift(nextDayActivity);
    });
  });
  
  return newScheduleData;
};

export const saveToLocalStorage = (scheduleData) => {
  try {
    // Process schedule data to split overnight activities before saving
    const processedData = splitOvernightSchedules(scheduleData);
    
    localStorage.setItem('weeklyScheduleData', JSON.stringify(processedData));
    console.log("Schedule saved to Local Storage.");
    return true;
  } catch (error) {
    console.error("Error saving to Local Storage:", error);
    alert("Error saving schedule to browser storage. Storage might be full or permission denied.");
    return false;
  }
};

export const loadFromLocalStorage = () => {
  try {
    const storedData = localStorage.getItem('weeklyScheduleData');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      if (typeof parsedData !== 'object' || parsedData === null) {
        console.warn("Invalid data format in local storage");
        return null;
      }
      
      // No need to split again on load as it's saved already split
      return parsedData;
    }
    return null;
  } catch (error) {
    console.error("Error loading from Local Storage:", error);
    alert("Error reading schedule from browser storage. Data might be corrupted.");
    return null;
  }
};

/**
 * Process details string to extract summary and expanded details
 * @param {string} details - The details string potentially containing "||" separator
 * @returns {Object} - Object with summary and expandedDetails properties
 */
export const processDetailsSections = (details) => {
  if (!details) return { summary: "", expandedDetails: "" };
  
  // Check if the details string contains the separator
  if (details.includes("||")) {
    const [summary, expandedDetails] = details.split("||").map(part => part.trim());
    return { summary, expandedDetails };
  }
  
  // If no separator found, use the entire string as summary
  return { summary: details, expandedDetails: "" };
};