document.addEventListener('DOMContentLoaded', () => {
    const scheduleContainer = document.getElementById('schedule-container');
    const tabsContainer = document.getElementById('tabs-container');
    const liveTimerElement = document.getElementById('live-timer');
    const downloadButton = document.getElementById('download-ics');
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    let scheduleData = {};
    let activeTab = null;

    // --- Data Loading ---
    async function loadSchedule() {
        try {
            const response = await fetch('schedule.json'); // Relative path works well
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            scheduleData = await response.json();
            console.log("Schedule data loaded:", scheduleData);
            createTabs();
            // Automatically select and display today's or Monday's schedule
            const todayIndex = new Date().getDay(); // Sunday = 0, Monday = 1, etc.
            // Adjust index so Monday=0, Sunday=6 to match daysOfWeek array
            const adjustedTodayIndex = (todayIndex === 0) ? 6 : todayIndex - 1;
            const defaultDay = daysOfWeek[adjustedTodayIndex]; // Select current day
            setActiveDay(defaultDay);
        } catch (error) {
            console.error("Failed to load schedule:", error);
            scheduleContainer.innerHTML = `<p class="text-red-500">Error loading schedule data. Please check console or ensure schedule.json is in the repository root.</p>`;
            downloadButton.disabled = true;
            downloadButton.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }

    // --- Tab Handling ---
    function createTabs() {
        tabsContainer.innerHTML = ''; // Clear existing tabs
        daysOfWeek.forEach(day => {
            const tabButton = document.createElement('button');
            tabButton.className = 'tab whitespace-nowrap py-3 px-4 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 focus:outline-none';
            tabButton.textContent = day;
            tabButton.dataset.day = day;
            tabButton.addEventListener('click', () => setActiveDay(day));
            tabsContainer.appendChild(tabButton);
        });
    }

    function setActiveDay(day) {
        if (!scheduleData[day]) {
            console.warn(`No schedule data found for ${day}`);
             // Check if scheduleData itself is empty due to load failure
            if (Object.keys(scheduleData).length === 0) {
                 scheduleContainer.innerHTML = `<p class="text-red-500">Schedule data failed to load. Cannot display ${day}.</p>`;
            } else {
                scheduleContainer.innerHTML = `<p class="text-gray-500">No schedule available for ${day}.</p>`;
            }
            // Deselect active tab if switching to a day with no data
            if (activeTab) {
                activeTab.classList.remove('tab-active');
                activeTab = null;
            }
             // Try finding the button even if data is missing, to maybe disable/style it?
             const tabButton = tabsContainer.querySelector(`[data-day="${day}"]`);
             if (tabButton && activeTab !== tabButton) { // Only remove active class if it's not already the (potentially broken) active tab
                 // No need to add active class here since data is missing
             }
            return;
        }


        // Update tab appearance
        if (activeTab) {
            activeTab.classList.remove('tab-active');
        }
        const newActiveTab = tabsContainer.querySelector(`[data-day="${day}"]`);
        if (newActiveTab) {
            newActiveTab.classList.add('tab-active');
            activeTab = newActiveTab;
        } else {
             console.error(`Tab button for ${day} not found!`); // Should not happen if createTabs worked
             activeTab = null; // Reset activeTab if button not found
        }


        renderSchedule(scheduleData[day]);
    }


    // --- Schedule Rendering ---
    function renderSchedule(daySchedule) {
        scheduleContainer.innerHTML = ''; // Clear previous content

        if (!daySchedule || daySchedule.length === 0) {
            scheduleContainer.innerHTML = '<p class="text-gray-500">No activities scheduled for this day.</p>';
            return;
        }

        daySchedule.forEach(item => {
            const duration = calculateDuration(item.start_time, item.end_time);
            const card = document.createElement('div');
            card.className = `p-3 mb-3 rounded border-l-4 ${getTypeColor(item.type)} shadow-sm transition-shadow duration-200 hover:shadow-md`;

            card.innerHTML = `
                <div class="flex justify-between items-start mb-1 flex-wrap">
                    <span class="font-semibold text-gray-800 mr-2">${item.activity}</span>
                    <span class="text-xs font-mono bg-gray-200 px-2 py-0.5 rounded text-gray-700 whitespace-nowrap">${item.start_time} - ${item.end_time}</span>
                </div>
                <div class="text-sm text-gray-600 flex justify-between items-center flex-wrap">
                    <span class="mr-2">${item.details ? item.details.replace(/Pomodoro[s]?/gi, '<strong class="text-indigo-600 font-semibold">$&</strong>') : '<i class="text-gray-400">No details</i>'}</span>
                    <span class="text-xs text-gray-500 font-medium ml-auto whitespace-nowrap">(${duration})</span>
                </div>
            `;
            scheduleContainer.appendChild(card);
        });
    }

    // --- Helper Functions ---
     function getTypeColor(type) {
        // Added some slight saturation/brightness tweaks for visibility
        switch (type) {
            case 'University': return 'border-blue-500 bg-blue-100'; // Keep as requested
            case 'Study_Intensive': return 'border-purple-600 bg-purple-100';
            case 'Study_Review': return 'border-indigo-600 bg-indigo-100';
            case 'Study_Prep': return 'border-teal-600 bg-teal-100';
            case 'Work': return 'border-green-600 bg-green-100';
            case 'Travel': return 'border-yellow-500 bg-yellow-100';
            case 'Routine': return 'border-gray-500 bg-gray-200'; // Darker border/bg
            case 'Meal': return 'border-orange-500 bg-orange-100';
            case 'Break': return 'border-pink-500 bg-pink-100';
            case 'Sleep': return 'border-slate-600 bg-slate-200'; // Darker border/bg
            case 'Flexible': return 'border-cyan-600 bg-cyan-100';
            case 'Language': return 'border-lime-600 bg-lime-100';
            case 'Free_Time': return 'border-rose-500 bg-rose-100';
            case 'Buffer': return 'border-stone-500 bg-stone-100';
            case 'Housework': return 'border-amber-600 bg-amber-100';
            default: return 'border-gray-400 bg-white'; // Default fallback
        }
    }


    function timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    function calculateDuration(startTime, endTime) {
        let startMinutes = timeToMinutes(startTime);
        let endMinutes = timeToMinutes(endTime);

        // Handle overnight activities (like sleep)
        if (endMinutes < startMinutes) {
            endMinutes += 24 * 60; // Add a day's worth of minutes
        }

        const durationMinutes = endMinutes - startMinutes;

        if (durationMinutes < 0) return 'Invalid time'; // Should not happen with correction

        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;

        let durationStr = '';
        if (hours > 0) {
            durationStr += `${hours}h `;
        }
        if (minutes > 0 || hours === 0) { // Show minutes if > 0 or if duration is 0h
            durationStr += `${minutes}m`;
        }
         // Handle edge case where duration might be exactly 0 if start/end are same
         if (durationStr.trim() === '') {
             return '0m';
         }
        return durationStr.trim();
    }

    // --- Live Timer ---
    function updateLiveTimer() {
        const now = new Date();
        // Using German locale for time format
        const timeString = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
         const dateString = now.toLocaleDateString('de-DE', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
        liveTimerElement.textContent = `${dateString}, ${timeString}`;
    }

    // --- ICS Generation & Download ---
    function generateICS() {
        if (Object.keys(scheduleData).length === 0) {
            alert("Schedule data not loaded yet. Cannot generate ICS file.");
            return;
        }

        const cal = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//YourGithubUsername//YourScheduleApp//EN', // Customize PRODID if desired
            'CALSCALE:GREGORIAN'
        ];

        const now = new Date();
        const todayDayIndex = (now.getDay() + 6) % 7; // 0=Mon, 1=Tue, ..., 6=Sun

        daysOfWeek.forEach((day, dayIndex) => { // dayIndex: 0=Mon, 1=Tue...
            if (scheduleData[day]) {
                scheduleData[day].forEach((item, itemIndex) => {
                    const eventDate = new Date(now);
                    // Calculate the date of the next occurrence of this weekday
                    const dayDifference = (dayIndex - todayDayIndex + 7) % 7;
                    eventDate.setDate(now.getDate() + dayDifference);

                    const [startH, startM] = item.start_time.split(':').map(Number);
                    const [endH, endM] = item.end_time.split(':').map(Number);

                    const startDate = new Date(eventDate);
                    startDate.setHours(startH, startM, 0, 0);

                    const endDate = new Date(eventDate);
                    endDate.setHours(endH, endM, 0, 0);

                    // Handle overnight events specifically for date setting
                    if (endDate <= startDate) { // Use <= to handle events ending exactly at midnight start
                         endDate.setDate(endDate.getDate() + 1); // End time is on the next day
                    }

                    // Format date-time to ICS standard (YYYYMMDDTHHMMSS) - Using local floating time
                     // DTSTART;TZID=Europe/Berlin:YYYYMMDDTHHMMSS format could also be used if timezone is critical
                    const formatLocalDate = (d) => {
                       return d.getFullYear() +
                              ('0' + (d.getMonth() + 1)).slice(-2) +
                              ('0' + d.getDate()).slice(-2) + 'T' +
                              ('0' + d.getHours()).slice(-2) +
                              ('0' + d.getMinutes()).slice(-2) + '00';
                    };

                     // Format timestamp for DTSTAMP (UTC)
                     const formatUtcDate = (d) => {
                         return d.getUTCFullYear() +
                                ('0' + (d.getUTCMonth() + 1)).slice(-2) +
                                ('0' + d.getUTCDate()).slice(-2) + 'T' +
                                ('0' + d.getUTCHours()).slice(-2) +
                                ('0' + d.getUTCMinutes()).slice(-2) +
                                ('0' + d.getUTCSeconds()).slice(-2) + 'Z';
                     };


                    const dtstamp = formatUtcDate(new Date()); // Creation timestamp in UTC

                    cal.push('BEGIN:VEVENT');
                    // Create a more robust UID
                    const uid = `${formatLocalDate(startDate)}-${day}-${item.type}-${itemIndex}@yourdomain.com`;
                    cal.push(`UID:${uid}`);
                    cal.push(`DTSTAMP:${dtstamp}`);
                    // Defining start/end times with local timezone hint (adjust TZID if needed)
                    cal.push(`DTSTART;TZID=Europe/Berlin:${formatLocalDate(startDate)}`);
                    cal.push(`DTEND;TZID=Europe/Berlin:${formatLocalDate(endDate)}`);
                    // Alternatively, use floating time if timezone isn't essential for the calendar app:
                    // cal.push(`DTSTART:${formatLocalDate(startDate)}`);
                    // cal.push(`DTEND:${formatLocalDate(endDate)}`);

                    cal.push(`SUMMARY:${item.activity}`);
                    if (item.details) {
                        // Escape ICS special characters: backslash, semicolon, comma, newline
                        const escapedDetails = item.details.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
                        cal.push(`DESCRIPTION:${escapedDetails}`);
                    }
                     cal.push(`LOCATION:`); // Optional: Add location if relevant
                     cal.push(`CATEGORIES:${item.type}`); // Use type as category
                    cal.push('END:VEVENT');
                });
            }
        });

        cal.push('END:VCALENDAR');

        // Trigger download
        try {
            const blob = new Blob([cal.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'weekly_schedule.ics';
            document.body.appendChild(link); // Append link to body for Firefox compatibility
            link.click();
            document.body.removeChild(link); // Clean up link
            URL.revokeObjectURL(link.href); // Release object URL memory
        } catch (e) {
            console.error("Error creating or downloading ICS file:", e);
            alert("Sorry, there was an error creating the ICS file.");
        }
    }


    downloadButton.addEventListener('click', generateICS);

    // --- Initial Setup ---
    loadSchedule(); // Load data and render initial view
    setInterval(updateLiveTimer, 1000); // Start the live timer
    updateLiveTimer(); // Initial call to display timer immediately

});