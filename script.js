document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const scheduleContainer = document.getElementById('schedule-container');
    const tabsContainer = document.getElementById('tabs-container');
    const liveTimerElement = document.getElementById('live-timer');
    const downloadICSButton = document.getElementById('download-ics');
    const addActivityBtn = document.getElementById('add-activity-btn');
    const addActivityDayLabel = document.getElementById('add-activity-day-label');

    // Modal Elements
    const modal = document.getElementById('activity-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalForm = document.getElementById('activity-form');
    const modalItemIdInput = document.getElementById('modal-item-id');
    const modalDayInput = document.getElementById('modal-day');
    const modalSaveBtn = document.getElementById('modal-save-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');

    // Pomodoro Timer Elements
    const pomodoroArea = document.getElementById('pomodoro-timer-area');
    const pomodoroActivityName = document.getElementById('pomodoro-activity-name');
    const pomodoroTimeDisplay = document.getElementById('pomodoro-time-display');
    const pomodoroStartBtn = document.getElementById('pomodoro-start-btn');
    const pomodoroStopBtn = document.getElementById('pomodoro-stop-btn');
    const pomodoroResetBtn = document.getElementById('pomodoro-reset-btn');

    // Data Management Buttons
    const saveStorageBtn = document.getElementById('save-storage-btn');
    const loadStorageBtn = document.getElementById('load-storage-btn');
    const downloadJsonBtn = document.getElementById('download-json-btn');
    const uploadJsonInput = document.getElementById('upload-json-input');

    // --- State Variables ---
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    let scheduleData = {}; // Holds the entire schedule
    let currentDay = null; // Track the currently displayed day
    let activeTabElement = null; // Track the active tab button element
    let pomodoroIntervalId = null;
    let pomodoroRemainingSeconds = 25 * 60; // Default 25 minutes
    const POMODORO_DEFAULT_MINUTES = 25;


    // === INITIALIZATION ===

    async function initializeApp() {
        loadFromLocalStorage(); // Try loading from storage first
        if (Object.keys(scheduleData).length === 0) {
            console.log("No local storage data found, fetching default schedule.json");
            await loadDefaultSchedule(); // Fetch default if storage is empty
        } else {
            console.log("Loaded schedule from local storage.");
        }
        createTabs();
        setupEventListeners();
        startLiveTimer();

        // Set initial active day (today or Monday)
        const todayIndex = new Date().getDay(); // Sunday = 0, Monday = 1, etc.
        const adjustedTodayIndex = (todayIndex === 0) ? 6 : todayIndex - 1; // Mon=0, Sun=6
        setActiveDay(daysOfWeek[adjustedTodayIndex]);

        // If scheduleData is still empty after attempts, show error
        if (Object.keys(scheduleData).length === 0) {
             handleLoadError(new Error("Failed to load any schedule data."));
        }
    }

    function setupEventListeners() {
        modalSaveBtn.addEventListener('click', handleSaveModal);
        modalCancelBtn.addEventListener('click', hideModal);
        addActivityBtn.addEventListener('click', handleAddActivity);

        // Pomodoro Timer Listeners
        pomodoroStartBtn.addEventListener('click', startPomodoro);
        pomodoroStopBtn.addEventListener('click', stopPomodoro);
        pomodoroResetBtn.addEventListener('click', resetPomodoro);

        // Data Management Listeners
        saveStorageBtn.addEventListener('click', () => {
            saveToLocalStorage();
            alert('Schedule saved to browser storage.');
        });
        loadStorageBtn.addEventListener('click', () => {
            if (confirm('Load schedule from browser storage? This will overwrite current view.')) {
                loadFromLocalStorage();
                if(Object.keys(scheduleData).length > 0) {
                    setActiveDay(currentDay || daysOfWeek[0]); // Refresh view
                    alert('Schedule loaded from browser storage.');
                } else {
                     alert('No schedule found in browser storage.');
                     // Optionally load default here if preferred
                }
            }
        });
        downloadJsonBtn.addEventListener('click', downloadJson);
        downloadICSButton.addEventListener('click', generateICS);
        uploadJsonInput.addEventListener('change', handleJsonUpload);
    }

    // === DATA HANDLING (Local Storage, JSON) ===

    function saveToLocalStorage() {
        try {
            localStorage.setItem('weeklyScheduleData', JSON.stringify(scheduleData));
            console.log("Schedule saved to Local Storage.");
        } catch (error) {
            console.error("Error saving to Local Storage:", error);
            alert("Error saving schedule to browser storage. Storage might be full.");
        }
    }

    function loadFromLocalStorage() {
        try {
            const storedData = localStorage.getItem('weeklyScheduleData');
            if (storedData) {
                scheduleData = JSON.parse(storedData);
                // Basic validation: ensure it's an object
                if (typeof scheduleData !== 'object' || scheduleData === null) {
                    console.warn("Invalid data format in local storage, resetting.");
                    scheduleData = {};
                }
                 // Ensure all days exist as keys, even if empty arrays (optional)
                 daysOfWeek.forEach(day => {
                    if (!scheduleData[day]) scheduleData[day] = [];
                 });
            } else {
                scheduleData = {}; // Initialize if nothing stored
            }
        } catch (error) {
            console.error("Error loading from Local Storage:", error);
            alert("Error reading schedule from browser storage. Data might be corrupted.");
            scheduleData = {}; // Reset on error
        }
    }

    async function loadDefaultSchedule() {
        try {
            const response = await fetch('schedule.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            scheduleData = await response.json();
             // Ensure all days exist as keys (optional, good practice)
            daysOfWeek.forEach(day => {
                if (!scheduleData[day]) scheduleData[day] = [];
            });
            console.log("Default schedule.json loaded.");
            // Optionally save the loaded default to local storage immediately
            // saveToLocalStorage();
        } catch (error) {
            console.error("Failed to load default schedule.json:", error);
            handleLoadError(error); // Use the error handler
        }
    }

     function handleLoadError(error) {
        scheduleContainer.innerHTML = `<p class="text-red-500 p-4">Error loading schedule data: ${error.message}. Please try refreshing or uploading a valid JSON file.</p>`;
        // Disable buttons that rely on data
        downloadICSButton.disabled = true;
        downloadJsonBtn.disabled = true;
        addActivityBtn.disabled = true;
        saveStorageBtn.disabled = true;
        downloadICSButton.classList.add('opacity-50', 'cursor-not-allowed');
         downloadJsonBtn.classList.add('opacity-50', 'cursor-not-allowed');
         addActivityBtn.classList.add('opacity-50', 'cursor-not-allowed');
         saveStorageBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }


    function downloadJson() {
        if (Object.keys(scheduleData).length === 0) {
            alert("No schedule data to download.");
            return;
        }
        try {
            const jsonData = JSON.stringify(scheduleData, null, 2); // Pretty print JSON
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'my_schedule.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error creating JSON download:", error);
            alert("Failed to create JSON file for download.");
        }
    }

    function handleJsonUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const uploadedData = JSON.parse(e.target.result);
                // Basic validation (check if it's an object, maybe check for day keys)
                if (typeof uploadedData !== 'object' || uploadedData === null) {
                    throw new Error("Uploaded file is not a valid JSON object.");
                }
                // More specific validation - check if it looks like our schedule structure
                 const hasDayKeys = daysOfWeek.some(day => uploadedData.hasOwnProperty(day) && Array.isArray(uploadedData[day]));
                 if (!hasDayKeys) {
                     throw new Error("JSON structure doesn't match the expected weekly schedule format.");
                 }

                if (confirm('Successfully read JSON file. Replace current schedule with uploaded data?')) {
                    scheduleData = uploadedData;
                     // Ensure all days have at least empty arrays
                     daysOfWeek.forEach(day => {
                        if (!scheduleData[day]) scheduleData[day] = [];
                     });
                    saveToLocalStorage(); // Save the uploaded data
                    setActiveDay(currentDay || daysOfWeek[0]); // Refresh view
                    alert('Schedule updated from uploaded file.');
                }
            } catch (error) {
                console.error("Error processing uploaded JSON:", error);
                alert(`Failed to load schedule from file: ${error.message}`);
            } finally {
                 // Reset file input to allow uploading the same file again if needed
                 uploadJsonInput.value = '';
            }
        };
        reader.onerror = () => {
            alert('Error reading file.');
             uploadJsonInput.value = '';
        };
        reader.readAsText(file);
    }


    // === UI RENDERING & TAB HANDLING ===

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
        if (!scheduleData || typeof scheduleData !== 'object') {
             console.error("Schedule data is not loaded or invalid.");
             handleLoadError(new Error("Schedule data structure is missing or invalid."));
             currentDay = null; // Ensure currentDay is reset
             return;
        }

        // Update current day tracker
        currentDay = day;
        addActivityDayLabel.textContent = day; // Update add button label

        // Update tab appearance
        if (activeTabElement) {
            activeTabElement.classList.remove('tab-active');
        }
        const newActiveTab = tabsContainer.querySelector(`[data-day="${day}"]`);
        if (newActiveTab) {
            newActiveTab.classList.add('tab-active');
            activeTabElement = newActiveTab;
        } else {
             activeTabElement = null;
        }

        renderScheduleForDay(day);
    }

    function renderScheduleForDay(day) {
        scheduleContainer.innerHTML = ''; // Clear previous content

         // Ensure the day array exists
         if (!scheduleData[day] || !Array.isArray(scheduleData[day])) {
             console.warn(`No schedule array found for ${day}, initializing.`);
             scheduleData[day] = []; // Initialize if missing
             // No need to save here unless an explicit action is taken
         }


        const daySchedule = scheduleData[day];

        if (daySchedule.length === 0) {
            scheduleContainer.innerHTML = '<p class="text-gray-500 text-center py-6">No activities scheduled for this day. Click "Add Activity" below!</p>';
            return;
        }

        // Sort activities by start time before rendering
        daySchedule.sort((a, b) => {
            const startA = timeToMinutes(a.start_time);
            const startB = timeToMinutes(b.start_time);
            return startA - startB;
        });


        daySchedule.forEach((item, index) => {
            // Assign a unique ID (using index for simplicity, could use a real UUID later)
            const itemId = `${day}-${index}`;
            item.id = itemId; // Store ID within the item data temporarily for reference

            const duration = calculateDuration(item.start_time, item.end_time);
            const card = document.createElement('div');
            card.className = `schedule-item relative p-3 mb-3 rounded border-l-4 ${getTypeColor(item.type)} shadow-sm transition-shadow duration-200 hover:shadow-md`;
            card.dataset.itemId = itemId; // Set data attribute for easy selection

            // Check for Pomodoro keyword
            const isPomodoro = item.details && item.details.toLowerCase().includes('pomodoro');

            card.innerHTML = `
                <div class="flex justify-between items-start mb-1 flex-wrap">
                    <div>
                        <span class="font-semibold text-gray-800 mr-2">${item.activity}</span>
                        ${isPomodoro ? '<span class="action-btn btn-pomodoro pomodoro-trigger-btn" title="Show Pomodoro Timer">P</span>' : ''}
                    </div>
                    <span class="text-xs font-mono bg-gray-200 px-2 py-0.5 rounded text-gray-700 whitespace-nowrap">${item.start_time} - ${item.end_time}</span>
                </div>
                <div class="text-sm text-gray-600 flex justify-between items-center flex-wrap pr-20"> <span class="mr-2 details-text">${item.details ? item.details.replace(/Pomodoro[s]?/gi, '<strong class="text-indigo-600 font-semibold">$&</strong>') : '<i class="text-gray-400">No details</i>'}</span>
                    <span class="text-xs text-gray-500 font-medium ml-auto whitespace-nowrap">(${duration})</span>
                </div>
                <div class="absolute top-1 right-1 flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-1">
                    <button class="action-btn btn-move move-up-btn" title="Move Up">&#x25B2;</button> <button class="action-btn btn-move move-down-btn" title="Move Down">&#x25BC;</button> <button class="action-btn btn-edit" title="Edit">&#x270E;</button> <button class="action-btn btn-delete" title="Delete">&#x1F5D1;</button> </div>
            `;
            scheduleContainer.appendChild(card);
        });

        // Add event listeners after rendering all cards for the day
        addCardEventListeners(day);
    }

    function addCardEventListeners(day) {
        document.querySelectorAll('.schedule-item').forEach(card => {
            const itemId = card.dataset.itemId;
            const index = findItemIndexById(day, itemId); // Get the actual index

            if (index === -1) {
                console.error("Could not find item index for event listener setup:", itemId);
                return; // Skip if index not found
            }


            // Pomodoro Click
             const pomodoroBtn = card.querySelector('.pomodoro-trigger-btn');
             if (pomodoroBtn) {
                 pomodoroBtn.addEventListener('click', (e) => {
                     e.stopPropagation(); // Prevent card click if button exists
                     handlePomodoroClick(day, index);
                 });
             } else {
                 // Optional: Allow clicking anywhere on the card if no button?
                 // card.addEventListener('click', () => handlePomodoroClick(day, index));
             }


            // Edit Button
            card.querySelector('.btn-edit').addEventListener('click', (e) => {
                 e.stopPropagation();
                 handleEditActivity(day, index);
            });

            // Delete Button
            card.querySelector('.btn-delete').addEventListener('click', (e) => {
                 e.stopPropagation();
                handleDeleteActivity(day, index);
            });

            // Move Up Button
            card.querySelector('.move-up-btn').addEventListener('click', (e) => {
                 e.stopPropagation();
                handleMoveActivity(day, index, -1);
            });

            // Move Down Button
            card.querySelector('.move-down-btn').addEventListener('click', (e) => {
                 e.stopPropagation();
                handleMoveActivity(day, index, 1);
            });
        });
    }

     // Helper to find the current index of an item based on its temp ID
     function findItemIndexById(day, itemId) {
        if (!scheduleData[day]) return -1;
        return scheduleData[day].findIndex(item => item.id === itemId);
    }


    // === CRUD OPERATIONS ===

    function handleAddActivity() {
        if (!currentDay) {
            alert("Please select a day first.");
            return;
        }
        modalTitle.textContent = `Add Activity to ${currentDay}`;
        modalForm.reset(); // Clear form
        modalItemIdInput.value = ''; // Ensure no ID for add mode
        modalDayInput.value = currentDay;
        showModal();
    }

     function handleEditActivity(day, index) {
        if (!scheduleData[day] || !scheduleData[day][index]) {
            console.error("Item not found for editing:", day, index);
            return;
        }
        const item = scheduleData[day][index];

        modalTitle.textContent = `Edit Activity on ${day}`;
        modalItemIdInput.value = index; // Store the index
        modalDayInput.value = day;

        // Populate form
        document.getElementById('start_time').value = item.start_time;
        document.getElementById('end_time').value = item.end_time;
        document.getElementById('activity').value = item.activity;
        document.getElementById('type').value = item.type || 'Other'; // Default if type is missing
        document.getElementById('details').value = item.details || '';

        showModal();
    }


     function handleDeleteActivity(day, index) {
        if (!scheduleData[day] || !scheduleData[day][index]) {
            console.error("Item not found for deletion:", day, index);
            return;
        }
        const item = scheduleData[day][index];
        if (confirm(`Are you sure you want to delete "${item.activity}" from ${day}?`)) {
            scheduleData[day].splice(index, 1);
            saveToLocalStorage(); // Save changes
            renderScheduleForDay(day); // Re-render the current day
             alert('Activity deleted.');
        }
    }


    function handleMoveActivity(day, index, direction) { // direction: -1 for up, 1 for down
        if (!scheduleData[day]) return;
        const schedule = scheduleData[day];
        const newIndex = index + direction;

        // Check bounds
        if (newIndex < 0 || newIndex >= schedule.length) {
            return; // Cannot move further
        }

        // Swap items
        [schedule[index], schedule[newIndex]] = [schedule[newIndex], schedule[index]];

        saveToLocalStorage(); // Save changes
        renderScheduleForDay(day); // Re-render the current day
    }


     function handleSaveModal() {
        const day = modalDayInput.value;
        const itemId = modalItemIdInput.value; // This is the index for editing, or empty for adding
        const isEditing = itemId !== '';
        const indexToEdit = parseInt(itemId, 10);

        if (!day || !scheduleData[day]) {
            alert("Error: Day context lost. Cannot save.");
            return;
        }

        // Collect data from form
         const formData = new FormData(modalForm);
         const newItemData = {
             start_time: formData.get('start_time'),
             end_time: formData.get('end_time'),
             activity: formData.get('activity').trim(),
             type: formData.get('type'),
             details: formData.get('details').trim() || null // Store empty details as null
             // id is not needed here, will be assigned during render if necessary
         };


        // --- Basic Validation ---
        if (!newItemData.start_time || !newItemData.end_time || !newItemData.activity || !newItemData.type) {
             alert("Please fill in Start Time, End Time, Activity, and Type.");
             return;
         }
         // Optional: Validate time format (HTML5 'time' input helps)
         // Optional: Validate end time is after start time
         if (timeToMinutes(newItemData.end_time) <= timeToMinutes(newItemData.start_time)) {
            // Allow overnight (e.g., 22:00 to 06:00) - check if it's *significantly* smaller?
            // Simple check: if end time is not strictly greater than start time AND it's not an overnight case
            const startMins = timeToMinutes(newItemData.start_time);
            const endMins = timeToMinutes(newItemData.end_time);
             // Allow if end time is numerically smaller (potential overnight) OR strictly greater
            if (endMins > startMins || endMins < startMins) {
                 // This logic might be too simple. Let's just check if they are exactly equal for now.
                  if (endMins === startMins) {
                    alert("End Time must be after Start Time.");
                    return;
                  }
            } else {
                // This case should technically not happen if end != start
                // Let's refine: disallow end time being exactly equal or clearly before start time on the same day.
                 if (endMins === startMins) {
                     alert("End time cannot be the same as start time.");
                     return;
                 }
                 // We implicitly allow overnight times here (e.g., 22:30 -> 06:30)
            }
         }
         // --- End Validation ---

        if (isEditing) {
            // Update existing item
             if (indexToEdit >= 0 && indexToEdit < scheduleData[day].length) {
                // Preserve the temporary 'id' if it exists, or just update data
                 const currentId = scheduleData[day][indexToEdit].id;
                scheduleData[day][indexToEdit] = { ...newItemData, id: currentId }; // Update data
                 console.log(`Updated item at index ${indexToEdit} on ${day}`);
             } else {
                 alert(`Error: Could not find item to update at index ${indexToEdit}.`);
                 return; // Prevent adding accidentally
             }

        } else {
            // Add new item
            scheduleData[day].push(newItemData);
            console.log(`Added new item to ${day}`);
        }

        // Sort the day's schedule again after adding/editing
         scheduleData[day].sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

        saveToLocalStorage(); // Save changes immediately
        hideModal();
        renderScheduleForDay(day); // Re-render the current day with updated/new item
         alert(`Activity ${isEditing ? 'updated' : 'added'} successfully.`);
    }



    // === MODAL HANDLING ===

    function showModal() {
        modal.classList.add('active');
    }

    function hideModal() {
        modal.classList.remove('active');
        modalForm.reset(); // Clear form on close
    }


    // === POMODORO TIMER ===

     function handlePomodoroClick(day, index) {
        if (!scheduleData[day] || !scheduleData[day][index]) {
            console.error("Pomodoro item not found:", day, index);
            return;
        }
         // Check again if it's really a pomodoro item (details might have been edited)
         const item = scheduleData[day][index];
         if (!item.details || !item.details.toLowerCase().includes('pomodoro')) {
             // If the 'P' button was clicked but details changed, hide timer or do nothing
              if (!pomodoroArea.classList.contains('hidden')) {
                // Maybe ask user if they want to stop current timer? For now, just log.
                 console.log("Clicked non-pomodoro item while timer area was visible.");
              }
             return;
         }

         // Stop any currently running timer before starting a new context
         if (pomodoroIntervalId) {
            // Optionally ask the user if they want to stop the current timer
             if (!confirm(`A timer for "${pomodoroActivityName.textContent}" is running. Stop it and switch to "${item.activity}"?`)) {
                 return; // User cancelled
             }
            stopPomodoro(false); // Stop without confirmation message inside stop function
         }

        // Reset and show the timer area
        resetPomodoro(false); // Reset without confirmation message
        pomodoroActivityName.textContent = item.activity;
        pomodoroArea.classList.remove('hidden');
         // Scroll into view if needed
         pomodoroArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }


     function startPomodoro() {
        if (pomodoroIntervalId) return; // Already running

        pomodoroStartBtn.disabled = true;
        pomodoroStopBtn.disabled = false;

        pomodoroIntervalId = setInterval(() => {
            pomodoroRemainingSeconds--;
            updatePomodoroDisplay();

            if (pomodoroRemainingSeconds <= 0) {
                stopPomodoro(true); // Stop and notify
                // Optional: Play sound
                // Optional: Automatically start break timer? (future feature)
            }
        }, 1000);
         console.log("Pomodoro started");
    }

     function stopPomodoro(notify = true) { // Added notify flag
        if (!pomodoroIntervalId) return; // Not running

        clearInterval(pomodoroIntervalId);
        pomodoroIntervalId = null;

        pomodoroStartBtn.disabled = false;
        pomodoroStopBtn.disabled = true;

        if (notify && pomodoroRemainingSeconds <= 0) {
            alert(`Pomodoro for "${pomodoroActivityName.textContent}" finished! Time for a break!`);
             // Optionally reset timer here automatically after finished alert
             resetPomodoro(false);
        } else if (notify) {
             // If stopped manually before finishing
              alert(`Pomodoro timer for "${pomodoroActivityName.textContent}" stopped.`);
        }
         console.log("Pomodoro stopped");
    }


     function resetPomodoro(confirmReset = true) { // Added confirm flag
        if (pomodoroIntervalId) {
             if (confirmReset && !confirm(`Timer for "${pomodoroActivityName.textContent}" is running. Are you sure you want to reset it?`)) {
                 return; // User cancelled reset
             }
             stopPomodoro(false); // Stop silently if running
        }

        pomodoroRemainingSeconds = POMODORO_DEFAULT_MINUTES * 60;
        updatePomodoroDisplay();
        pomodoroStartBtn.disabled = false;
        pomodoroStopBtn.disabled = true;
         console.log("Pomodoro reset");
         // Don't hide the area on reset, only when explicitly clicking away or closing.
         // If needed, add a close button to the pomodoro area:
         // pomodoroArea.classList.add('hidden');
    }


    function updatePomodoroDisplay() {
        const minutes = Math.floor(pomodoroRemainingSeconds / 60);
        const seconds = pomodoroRemainingSeconds % 60;
        pomodoroTimeDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }


    // === HELPER FUNCTIONS (Time, Color, ICS) ===

    function getTypeColor(type) {
        // (Same as previous version - using slightly more saturated colors)
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
            case 'Other': return 'border-gray-400 bg-gray-100'; // Style for 'Other'
            default: return 'border-gray-400 bg-white';
        }
    }

    function timeToMinutes(timeStr) {
         if (!timeStr || !timeStr.includes(':')) return 0; // Basic check
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    function calculateDuration(startTime, endTime) {
         if (!startTime || !endTime) return 'N/A'; // Handle missing times
        let startMinutes = timeToMinutes(startTime);
        let endMinutes = timeToMinutes(endTime);

        if (endMinutes <= startMinutes) { // Handle overnight or same minute end time
            endMinutes += 24 * 60;
        }

        const durationMinutes = endMinutes - startMinutes;

        if (durationMinutes < 0) return 'Invalid'; // Should not happen now

        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;

        let durationStr = '';
        if (hours > 0) {
            durationStr += `${hours}h `;
        }
         // Always show minutes part unless exactly 0 total duration
         if (minutes > 0 || durationMinutes === 0) {
             durationStr += `${minutes}m`;
         } else if (hours > 0 && minutes === 0) {
              // If it's exactly X hours, remove trailing space if needed
               durationStr = durationStr.trim();
         }


         // Handle edge case where duration might be exactly 0 if start/end are same (though validation prevents this now)
         if (durationStr.trim() === '' && durationMinutes === 0) {
             return '0m';
         }
        return durationStr.trim() || '0m'; // Ensure minimum '0m' if empty
    }

    function startLiveTimer() {
        setInterval(updateLiveTimer, 1000);
        updateLiveTimer(); // Initial call
    }

    function updateLiveTimer() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dateString = now.toLocaleDateString('de-DE', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
        liveTimerElement.textContent = `${dateString}, ${timeString}`;
    }

     // --- ICS Generation (using current scheduleData) ---
     function generateICS() {
        if (Object.keys(scheduleData).length === 0) {
            alert("Schedule data not loaded yet. Cannot generate ICS file.");
            return;
        }

        const cal = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//YourName//InteractiveScheduleApp//EN', // Customize
            'CALSCALE:GREGORIAN'
        ];

        const now = new Date();
         // Decide on the start date for the ICS export. Use the *next* upcoming Monday.
         const todayDow = (now.getDay() + 6) % 7; // 0=Mon, ..., 6=Sun
         const daysUntilNextMonday = (7 - todayDow) % 7;
         const nextMonday = new Date(now);
         nextMonday.setDate(now.getDate() + daysUntilNextMonday);
         nextMonday.setHours(0, 0, 0, 0); // Start of day


        daysOfWeek.forEach((day, dayIndex) => { // dayIndex: 0=Mon, 1=Tue...
            if (scheduleData[day] && scheduleData[day].length > 0) {
                 // Calculate the date for this day in the target week
                 const targetDate = new Date(nextMonday);
                 targetDate.setDate(nextMonday.getDate() + dayIndex);

                scheduleData[day].forEach((item, itemIndex) => {
                    // Basic check for valid times - skip if invalid
                     if (!item.start_time || !item.end_time || !item.start_time.includes(':') || !item.end_time.includes(':')) {
                         console.warn(`Skipping item due to invalid time format: ${item.activity} on ${day}`);
                         return;
                     }

                     const [startH, startM] = item.start_time.split(':').map(Number);
                     const [endH, endM] = item.end_time.split(':').map(Number);


                    const startDate = new Date(targetDate);
                    startDate.setHours(startH, startM, 0, 0);

                    const endDate = new Date(targetDate);
                    endDate.setHours(endH, endM, 0, 0);

                    // Handle overnight events specifically for date setting
                    if (endDate <= startDate) {
                         endDate.setDate(endDate.getDate() + 1);
                    }

                    // Format date-time to ICS standard (YYYYMMDDTHHMMSS) - Using local floating time
                    const formatLocalDate = (d) => {
                       return d.getFullYear() +
                              ('0' + (d.getMonth() + 1)).slice(-2) +
                              ('0' + d.getDate()).slice(-2) + 'T' +
                              ('0' + d.getHours()).slice(-2) +
                              ('0' + d.getMinutes()).slice(-2) + '00';
                    };
                     const formatUtcDate = (d) => { // For DTSTAMP
                         return d.getUTCFullYear() +
                                ('0' + (d.getUTCMonth() + 1)).slice(-2) +
                                ('0' + d.getUTCDate()).slice(-2) + 'T' +
                                ('0' + d.getUTCHours()).slice(-2) +
                                ('0' + d.getUTCMinutes()).slice(-2) +
                                ('0' + d.getUTCSeconds()).slice(-2) + 'Z';
                     };

                    const dtstamp = formatUtcDate(new Date());
                    // Use TZID for clarity (adjust 'Europe/Berlin' if needed)
                    const dtstart = `DTSTART;TZID=Europe/Berlin:${formatLocalDate(startDate)}`;
                    const dtend = `DTEND;TZID=Europe/Berlin:${formatLocalDate(endDate)}`;
                    const summary = `SUMMARY:${item.activity || 'Untitled Event'}`; // Fallback for summary
                     // Escape details for ICS
                     const description = item.details
                        ? `DESCRIPTION:${item.details.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n")}`
                        : 'DESCRIPTION:'; // Empty description if null/empty

                     // Create a more unique UID using date/time/activity hash (simple approach)
                    let hash = 0;
                    const strToHash = `${formatLocalDate(startDate)}-${item.activity || ''}-${itemIndex}`;
                    for (let i = 0; i < strToHash.length; i++) {
                        const char = strToHash.charCodeAt(i);
                        hash = ((hash << 5) - hash) + char;
                        hash |= 0; // Convert to 32bit integer
                    }
                     const uid = `UID:${dayIndex}${itemIndex}-${Math.abs(hash)}@yourscheduleapp.com`; // Example UID

                    cal.push('BEGIN:VEVENT');
                    cal.push(uid);
                    cal.push(`DTSTAMP:${dtstamp}`);
                    cal.push(dtstart);
                    cal.push(dtend);
                    cal.push(summary);
                    cal.push(description);
                    cal.push(`CATEGORIES:${item.type || 'GENERAL'}`); // Add default category
                    cal.push('END:VEVENT');
                });
            }
        });

        cal.push('END:VCALENDAR');

        // Trigger download
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
    }


    // === START THE APP ===
    initializeApp();

});
