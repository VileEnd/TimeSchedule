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
    const modalItemIdInput = document.getElementById('modal-item-id'); // Stores index for editing
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
    let sortableInstance = null; // Variable to hold the Sortable instance


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
        const now = new Date();
        // Determine today's index (0=Mon, 6=Sun) based on Nuremberg time (CEST/CET)
        // Getting day index in local time is sufficient here
        const todayIndexLocal = now.getDay(); // Sunday = 0, Monday = 1, ...
        const adjustedTodayIndex = (todayIndexLocal === 0) ? 6 : todayIndexLocal - 1; // Mon=0, Sun=6
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
            // Simple feedback without alert
            saveStorageBtn.textContent = 'Saved!';
            setTimeout(() => { saveStorageBtn.innerHTML = '&#x1F4BE;'; }, 1500); // Reset icon after delay
        });
        loadStorageBtn.addEventListener('click', () => {
            if (confirm('Load schedule from browser storage? This will overwrite current view.')) {
                loadFromLocalStorage();
                if(Object.keys(scheduleData).length > 0) {
                    // Determine which day was last viewed or default to current day/Monday
                    const dayToLoad = currentDay && scheduleData[currentDay] ? currentDay : daysOfWeek[ (new Date().getDay() + 6) % 7 ];
                    setActiveDay(dayToLoad); // Refresh view
                    alert('Schedule loaded from browser storage.');
                } else {
                     alert('No schedule found in browser storage.');
                     // Optionally load default here if preferred
                     // loadDefaultSchedule().then(() => setActiveDay(daysOfWeek[ (new Date().getDay() + 6) % 7 ]));
                }
            }
        });
        downloadJsonBtn.addEventListener('click', downloadJson);
        downloadICSButton.addEventListener('click', generateICS);
        uploadJsonInput.addEventListener('change', handleJsonUpload);

         // Close modal if clicking outside of it
         modal.addEventListener('click', (event) => {
            if (event.target === modal) { // Check if the click is on the modal background itself
                 hideModal();
            }
        });
    }

    // === DATA HANDLING (Local Storage, JSON) ===

    function saveToLocalStorage() {
        try {
            localStorage.setItem('weeklyScheduleData', JSON.stringify(scheduleData));
            console.log("Schedule saved to Local Storage.");
        } catch (error) {
            console.error("Error saving to Local Storage:", error);
            alert("Error saving schedule to browser storage. Storage might be full or permission denied.");
        }
    }

    function loadFromLocalStorage() {
        try {
            const storedData = localStorage.getItem('weeklyScheduleData');
            if (storedData) {
                scheduleData = JSON.parse(storedData);
                if (typeof scheduleData !== 'object' || scheduleData === null) {
                    console.warn("Invalid data format in local storage, resetting.");
                    scheduleData = {};
                }
                daysOfWeek.forEach(day => {
                    if (!scheduleData[day] || !Array.isArray(scheduleData[day])) {
                        scheduleData[day] = []; // Ensure each day is an array
                    }
                });
            } else {
                scheduleData = {};
            }
        } catch (error) {
            console.error("Error loading from Local Storage:", error);
            alert("Error reading schedule from browser storage. Data might be corrupted.");
            scheduleData = {};
        }
    }

    async function loadDefaultSchedule() {
        try {
            const response = await fetch('schedule.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            scheduleData = await response.json();
            daysOfWeek.forEach(day => {
                 if (!scheduleData[day] || !Array.isArray(scheduleData[day])) {
                    scheduleData[day] = []; // Ensure each day is an array
                 }
            });
            console.log("Default schedule.json loaded.");
            // Don't automatically save default to LS, let user explicitly save if they want it
        } catch (error) {
            console.error("Failed to load default schedule.json:", error);
            handleLoadError(error);
        }
    }

     function handleLoadError(error) {
        scheduleContainer.innerHTML = `<p class="text-red-500 p-4">Error loading schedule data: ${error.message}. Please try refreshing or uploading a valid JSON file.</p>`;
        // Disable buttons that rely on data
        const buttonsToDisable = [downloadICSButton, downloadJsonBtn, addActivityBtn, saveStorageBtn];
        buttonsToDisable.forEach(btn => {
             if(btn) {
                 btn.disabled = true;
                 btn.classList.add('opacity-50', 'cursor-not-allowed');
             }
        });
    }


    function downloadJson() {
        if (Object.keys(scheduleData).length === 0) {
            alert("No schedule data to download.");
            return;
        }
        try {
            // Create a copy without the temporary 'id' field before saving
            const dataToSave = JSON.parse(JSON.stringify(scheduleData)); // Deep copy
            for (const day in dataToSave) {
                if (Array.isArray(dataToSave[day])) {
                    dataToSave[day].forEach(item => delete item.id); // Remove temp id
                }
            }

            const jsonData = JSON.stringify(dataToSave, null, 2); // Pretty print JSON
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
                if (typeof uploadedData !== 'object' || uploadedData === null) {
                    throw new Error("Uploaded file is not a valid JSON object.");
                }
                const hasDayKeys = daysOfWeek.some(day => uploadedData.hasOwnProperty(day) && Array.isArray(uploadedData[day]));
                if (!hasDayKeys) {
                    throw new Error("JSON structure doesn't match the expected weekly schedule format.");
                }

                if (confirm('Successfully read JSON file. Replace current schedule with uploaded data?')) {
                    scheduleData = uploadedData;
                    daysOfWeek.forEach(day => {
                        if (!scheduleData[day] || !Array.isArray(scheduleData[day])) {
                             scheduleData[day] = []; // Ensure all days are arrays
                        }
                    });
                    saveToLocalStorage();
                     const dayToLoad = currentDay && scheduleData[currentDay] ? currentDay : daysOfWeek[ (new Date().getDay() + 6) % 7 ];
                    setActiveDay(dayToLoad);
                    alert('Schedule updated from uploaded file.');
                }
            } catch (error) {
                console.error("Error processing uploaded JSON:", error);
                alert(`Failed to load schedule from file: ${error.message}`);
            } finally {
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
        tabsContainer.innerHTML = '';
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
             currentDay = null;
             return;
        }

        currentDay = day;
        addActivityDayLabel.textContent = day;

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

        // Destroy previous Sortable instance before rendering new day
        if (sortableInstance) {
            sortableInstance.destroy();
            sortableInstance = null;
        }

        renderScheduleForDay(day); // Render items

        // Initialize SortableJS *after* rendering items for the new day
         if (scheduleData[day] && scheduleData[day].length > 0) {
            initSortable(day);
        }
    }

    function renderScheduleForDay(day) {
        scheduleContainer.innerHTML = ''; // Clear previous content

        if (!scheduleData[day] || !Array.isArray(scheduleData[day])) {
            scheduleData[day] = [];
        }

        const daySchedule = scheduleData[day];

        if (daySchedule.length === 0) {
            scheduleContainer.innerHTML = '<p class="text-gray-500 text-center py-6">No activities scheduled. Drag items here or click "Add Activity" below!</p>';
            return;
        }

        // Sort data array before rendering (important for consistency)
        daySchedule.sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

        daySchedule.forEach((item, index) => {
            // Use index as part of the ID *after* sorting
            const itemId = `${day}-${index}`;
            item.id = itemId; // Store temporary ID for event listeners

            const duration = calculateDuration(item.start_time, item.end_time);
            const card = document.createElement('div');
            // Added cursor-grab for visual cue
            card.className = `schedule-item relative p-3 mb-3 rounded border-l-4 ${getTypeColor(item.type)} shadow-sm transition-shadow duration-200 hover:shadow-md cursor-grab`;
            card.dataset.itemId = itemId; // Reference for event listeners

            const isPomodoro = item.details && item.details.toLowerCase().includes('pomodoro');

            // Removed Move Up/Down buttons
            card.innerHTML = `
                <div class="flex justify-between items-start mb-1 flex-wrap">
                    <div>
                        <span class="font-semibold text-gray-800 mr-2">${item.activity}</span>
                        ${isPomodoro ? '<span class="action-btn btn-pomodoro pomodoro-trigger-btn" title="Show Pomodoro Timer">P</span>' : ''}
                    </div>
                    <span class="text-xs font-mono bg-gray-200 px-2 py-0.5 rounded text-gray-700 whitespace-nowrap">${item.start_time} - ${item.end_time}</span>
                </div>
                <div class="text-sm text-gray-600 flex justify-between items-center flex-wrap pr-12"> <span class="mr-2 details-text">${item.details ? item.details.replace(/Pomodoro[s]?/gi, '<strong class="text-indigo-600 font-semibold">$&</strong>') : '<i class="text-gray-400">No details</i>'}</span>
                    <span class="text-xs text-gray-500 font-medium ml-auto whitespace-nowrap">(${duration})</span>
                </div>
                <div class="absolute top-1 right-1 flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-1">
                    <button class="action-btn btn-edit" title="Edit">&#x270E;</button> <button class="action-btn btn-delete" title="Delete">&#x1F5D1;</button> </div>
            `;
            scheduleContainer.appendChild(card);
        });

        // Add listeners AFTER all cards for the day are in the DOM
        addCardEventListeners(day);
    }

     function addCardEventListeners(day) {
         // Use event delegation on the container for better performance, especially after drag/drop?
         // No, let's stick to individual listeners for now, but re-attach after potential re-renders if needed.

        document.querySelectorAll(`#schedule-container .schedule-item[data-item-id^="${day}-"]`).forEach(card => {
             const itemId = card.dataset.itemId;
             // Find the index based on the temporary ID stored in the item data *during the last render*
             const index = findItemIndexById(day, itemId); // Use helper function

             if (index === -1) {
                 console.warn("Could not find item index for event listener setup:", itemId);
                 return; // Skip if index somehow not found
             }

            // Pomodoro Click
             const pomodoroBtn = card.querySelector('.pomodoro-trigger-btn');
             if (pomodoroBtn) {
                 pomodoroBtn.addEventListener('click', (e) => {
                     e.stopPropagation(); // Prevent drag start
                     handlePomodoroClick(day, index);
                 });
             }

            // Edit Button
             const editBtn = card.querySelector('.btn-edit');
             if(editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    handleEditActivity(day, index);
                });
            }

            // Delete Button
             const deleteBtn = card.querySelector('.btn-delete');
             if(deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    handleDeleteActivity(day, index);
                });
            }
         });
    }

    // Helper to find the current index of an item based on its temp ID
    // Essential because index can change due to sorting or deletion
    function findItemIndexById(day, itemId) {
        if (!scheduleData[day]) return -1;
        // Find the item whose 'id' property matches the itemId from the dataset
        return scheduleData[day].findIndex(item => item.id === itemId);
    }


    // === SortableJS Initialization & Handling ===
    function initSortable(day) {
        if (!scheduleContainer || typeof Sortable === 'undefined') {
             console.error("SortableJS not loaded or container not found.");
             return; // Guard against errors
        }

        sortableInstance = new Sortable(scheduleContainer, {
            animation: 150,
            handle: '.schedule-item', // Drag the whole item
            filter: '.action-btn, button, input, textarea, select', // Don't drag when clicking buttons/form elements inside item
            preventOnFilter: true,
            ghostClass: 'sortable-ghost',  // Class for the drop placeholder (style in HTML)
            chosenClass: 'sortable-chosen', // Class for the item being dragged
            // dragClass: 'sortable-drag', // Optional: Class for the clone

            onEnd: function (evt) {
                // Ensure we're operating on the correct day's data
                if (currentDay !== day) {
                     console.warn("Sortable event triggered for an inactive day. Ignoring.");
                     return;
                }

                console.log(`Item moved in DOM from index ${evt.oldIndex} to ${evt.newIndex}`);

                if (scheduleData[day] && scheduleData[day].length > 1 && evt.oldIndex !== evt.newIndex) {
                    // Update the actual data array
                    const movedItem = scheduleData[day].splice(evt.oldIndex, 1)[0];
                    if (movedItem) {
                        scheduleData[day].splice(evt.newIndex, 0, movedItem);
                        console.log("Updated scheduleData array order.");

                        // Save the new order
                        saveToLocalStorage();

                        // Re-assign temporary IDs based on new order IF NEEDED by listeners.
                        // Crucially, we need to update the dataset.itemId on the moved elements in the DOM
                        // or ensure findItemIndexById can still work.
                        // Easiest might be to quickly re-render JUST the IDs or re-run listener attachments.

                         // Option 1: Re-render (simplest, might flash)
                         // renderScheduleForDay(day);
                         // initSortable(day); // Re-init sortable if re-rendering

                         // Option 2: Update IDs in data and DOM datasets (more complex, less flash)
                         scheduleData[day].forEach((item, index) => { item.id = `${day}-${index}`; });
                         scheduleContainer.querySelectorAll('.schedule-item').forEach((card, index) => {
                            card.dataset.itemId = `${day}-${index}`;
                         });
                         // Re-attach listeners after DOM manipulation / ID updates
                         addCardEventListeners(day);

                    } else {
                        console.error("Failed to find moved item in data array.");
                    }
                }
            },
        });
    }


    // === CRUD OPERATIONS ===

    function handleAddActivity() {
        if (!currentDay) {
            alert("Please select a day first.");
            return;
        }
        modalTitle.textContent = `Add Activity to ${currentDay}`;
        modalForm.reset();
        modalItemIdInput.value = ''; // No index means 'add' mode
        modalDayInput.value = currentDay;
        showModal();
    }

     function handleEditActivity(day, index) {
        if (index < 0 || index >= scheduleData[day].length) {
            console.error("Invalid index for editing:", day, index);
             alert("Could not find the item to edit. Please refresh.");
            return;
        }
        const item = scheduleData[day][index];

        modalTitle.textContent = `Edit Activity on ${day}`;
        modalItemIdInput.value = index; // Store the index for saving
        modalDayInput.value = day;

        // Populate form
        document.getElementById('start_time').value = item.start_time;
        document.getElementById('end_time').value = item.end_time;
        document.getElementById('activity').value = item.activity;
        document.getElementById('type').value = item.type || 'Other';
        document.getElementById('details').value = item.details || '';

        showModal();
    }

    function handleDeleteActivity(day, index) {
        if (index < 0 || index >= scheduleData[day].length) {
            console.error("Invalid index for deletion:", day, index);
             alert("Could not find the item to delete. Please refresh.");
            return;
        }
        const item = scheduleData[day][index];
        if (confirm(`Are you sure you want to delete "${item.activity}" from ${day}?`)) {
            scheduleData[day].splice(index, 1);
            saveToLocalStorage();
            setActiveDay(day); // Re-render and re-init sortable
            alert('Activity deleted.');
        }
    }

    // Move function removed - handled by SortableJS

     function handleSaveModal() {
        const day = modalDayInput.value;
        const itemIdValue = modalItemIdInput.value; // Stored index for editing
        const isEditing = itemIdValue !== '';
        const indexToEdit = parseInt(itemIdValue, 10);

        if (!day || !scheduleData[day]) {
            alert("Error: Day context lost or invalid. Cannot save.");
            return;
        }

        const formData = new FormData(modalForm);
        const newItemData = {
            start_time: formData.get('start_time'),
            end_time: formData.get('end_time'),
            activity: formData.get('activity').trim(),
            type: formData.get('type'),
            details: formData.get('details').trim() || null
        };

        // --- Validation ---
        if (!newItemData.start_time || !newItemData.end_time || !newItemData.activity || !newItemData.type) {
            alert("Please fill in Start Time, End Time, Activity, and Type.");
            return;
        }
        if (timeToMinutes(newItemData.end_time) === timeToMinutes(newItemData.start_time)) {
             alert("End time cannot be the same as start time.");
             return;
        }
        // Implicitly allow overnight times (e.g., 22:30 -> 06:30)
        // --- End Validation ---

        if (isEditing) {
             if (!isNaN(indexToEdit) && indexToEdit >= 0 && indexToEdit < scheduleData[day].length) {
                // Merge new data, keeping the temporary ID if it exists (though it gets reassigned on render)
                scheduleData[day][indexToEdit] = { ...scheduleData[day][indexToEdit], ...newItemData };
                 console.log(`Updated item at index ${indexToEdit} on ${day}`);
            } else {
                 alert(`Error: Could not find item to update at index ${indexToEdit}.`);
                 console.error("Invalid index provided for editing:", indexToEdit);
                 return;
            }
        } else {
            scheduleData[day].push(newItemData);
            console.log(`Added new item to ${day}`);
        }

        // Sort the day's schedule again after adding/editing
        scheduleData[day].sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

        saveToLocalStorage();
        hideModal();
        setActiveDay(day); // Re-render the current day and re-init sortable
        alert(`Activity ${isEditing ? 'updated' : 'added'} successfully.`);
    }


    // === MODAL HANDLING ===

    function showModal() {
        modal.classList.add('active');
    }

    function hideModal() {
        modal.classList.remove('active');
        modalForm.reset();
    }


    // === POMODORO TIMER ===

     function handlePomodoroClick(day, index) {
         if (index < 0 || index >= scheduleData[day].length) {
             console.error("Invalid index for Pomodoro click:", day, index);
             return;
         }
         const item = scheduleData[day][index];

         if (!item.details || !item.details.toLowerCase().includes('pomodoro')) {
              console.log("Clicked item is not marked as Pomodoro.");
              // Optionally hide timer if it was visible for another item?
              // pomodoroArea.classList.add('hidden');
              return;
         }

        if (pomodoroIntervalId) {
            if (!confirm(`A timer for "${pomodoroActivityName.textContent}" is running. Stop it and switch to "${item.activity}"?`)) {
                 return;
             }
            stopPomodoro(false);
         }

        resetPomodoro(false);
        pomodoroActivityName.textContent = item.activity;
        pomodoroArea.classList.remove('hidden');
        pomodoroArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

     function startPomodoro() {
        if (pomodoroIntervalId) return;

        pomodoroStartBtn.disabled = true;
        pomodoroStopBtn.disabled = false;
        pomodoroResetBtn.disabled = false; // Enable reset when running

        pomodoroIntervalId = setInterval(() => {
            pomodoroRemainingSeconds--;
            updatePomodoroDisplay();

            if (pomodoroRemainingSeconds <= 0) {
                stopPomodoro(true); // Stop and notify completion
            }
        }, 1000);
         console.log("Pomodoro started");
    }

     function stopPomodoro(isFinished = false) { // Use flag for finished state
        if (!pomodoroIntervalId) return;

        clearInterval(pomodoroIntervalId);
        pomodoroIntervalId = null;

        pomodoroStartBtn.disabled = false;
        pomodoroStopBtn.disabled = true;
        // Keep reset enabled after stop

        if (isFinished) {
            alert(`Pomodoro for "${pomodoroActivityName.textContent}" finished! Time for a break!`);
             // Play a sound? (Requires <audio> element)
             // Reset timer after completion?
             resetPomodoro(false); // Auto-reset after finished
        } else {
            // If stopped manually
             console.log("Pomodoro stopped manually");
        }
    }

    function resetPomodoro(confirmReset = true) {
        if (pomodoroIntervalId) {
            if (confirmReset && !confirm(`Timer for "${pomodoroActivityName.textContent}" is running. Are you sure you want to reset it?`)) {
                 return;
            }
            stopPomodoro(false); // Stop silently if running
        }

        pomodoroRemainingSeconds = POMODORO_DEFAULT_MINUTES * 60;
        updatePomodoroDisplay();
        pomodoroStartBtn.disabled = false;
        pomodoroStopBtn.disabled = true;
        pomodoroResetBtn.disabled = false; // Reset should always be available? Maybe disable if already at 25:00?
         console.log("Pomodoro reset");
    }

    function updatePomodoroDisplay() {
        const minutes = Math.floor(pomodoroRemainingSeconds / 60);
        const seconds = pomodoroRemainingSeconds % 60;
        pomodoroTimeDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }


    // === HELPER FUNCTIONS (Time, Color, ICS) ===

    function getTypeColor(type) {
        // (Same as previous version)
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
    }

    function timeToMinutes(timeStr) {
        if (!timeStr || !timeStr.includes(':')) return 0;
        const [hours, minutes] = timeStr.split(':').map(Number);
        // Basic sanity check for parsed numbers
        if (isNaN(hours) || isNaN(minutes)) return 0;
        return hours * 60 + minutes;
    }

    function calculateDuration(startTime, endTime) {
        if (!startTime || !endTime || !startTime.includes(':') || !endTime.includes(':')) return 'N/A';
        let startMinutes = timeToMinutes(startTime);
        let endMinutes = timeToMinutes(endTime);

        // Handle overnight or same minute end time
        if (endMinutes <= startMinutes) {
            endMinutes += 24 * 60;
        }

        const durationMinutes = endMinutes - startMinutes;

        if (durationMinutes < 0 || isNaN(durationMinutes)) return 'Invalid'; // Should not happen now

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
    }

    function startLiveTimer() {
        setInterval(updateLiveTimer, 1000);
        updateLiveTimer();
    }

    function updateLiveTimer() {
        const now = new Date();
        // Use specific options for Nuremberg time display
        const timeString = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Berlin' });
        const dateString = now.toLocaleDateString('de-DE', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Europe/Berlin' });
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
            'PRODID:-//YourName//InteractiveScheduleApp-V2//EN', // Updated PRODID slightly
            'CALSCALE:GREGORIAN'
            // Optional: Add timezone definition if using TZID consistently
            // 'BEGIN:VTIMEZONE',
            // 'TZID:Europe/Berlin',
            // ... (Full VTIMEZONE definition - complex, often omitted relying on client interpretation)
            // 'END:VTIMEZONE'
        ];

        const now = new Date();
        const todayDow = (now.getDay() + 6) % 7;
        const daysUntilNextMonday = (7 - todayDow) % 7;
        const nextMonday = new Date(now);
        nextMonday.setDate(now.getDate() + daysUntilNextMonday);
        nextMonday.setHours(0, 0, 0, 0);

        daysOfWeek.forEach((day, dayIndex) => {
            if (scheduleData[day] && scheduleData[day].length > 0) {
                const targetDate = new Date(nextMonday);
                targetDate.setDate(nextMonday.getDate() + dayIndex);

                scheduleData[day].forEach((item, itemIndex) => {
                    if (!item.start_time || !item.end_time || !item.start_time.includes(':') || !item.end_time.includes(':')) {
                         console.warn(`Skipping ICS entry due to invalid time: ${item.activity} on ${day}`);
                         return; // Skip items with invalid times
                    }

                    const [startH, startM] = item.start_time.split(':').map(Number);
                    const [endH, endM] = item.end_time.split(':').map(Number);

                    // Check for NaN results from parsing
                    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) {
                        console.warn(`Skipping ICS entry due to NaN time components: ${item.activity} on ${day}`);
                        return;
                    }

                    const startDate = new Date(targetDate);
                    startDate.setHours(startH, startM, 0, 0);

                    const endDate = new Date(targetDate);
                    endDate.setHours(endH, endM, 0, 0);

                    if (endDate <= startDate) {
                         endDate.setDate(endDate.getDate() + 1);
                    }

                    const formatLocalDate = (d) => {
                       // ... (same as before)
                        return d.getFullYear() +
                               ('0' + (d.getMonth() + 1)).slice(-2) +
                               ('0' + d.getDate()).slice(-2) + 'T' +
                               ('0' + d.getHours()).slice(-2) +
                               ('0' + d.getMinutes()).slice(-2) + '00';
                    };
                    const formatUtcDate = (d) => {
                         // ... (same as before)
                          return d.getUTCFullYear() +
                                ('0' + (d.getUTCMonth() + 1)).slice(-2) +
                                ('0' + d.getUTCDate()).slice(-2) + 'T' +
                                ('0' + d.getUTCHours()).slice(-2) +
                                ('0' + d.getUTCMinutes()).slice(-2) +
                                ('0' + d.getUTCSeconds()).slice(-2) + 'Z';
                    };

                    const dtstamp = formatUtcDate(new Date());
                    // Using TZID is generally more robust if the calendar client supports it
                    const dtstart = `DTSTART;TZID=Europe/Berlin:${formatLocalDate(startDate)}`;
                    const dtend = `DTEND;TZID=Europe/Berlin:${formatLocalDate(endDate)}`;
                    const summary = `SUMMARY:${(item.activity || 'Scheduled Event').replace(/([,;\\])/g, '\\$1')}`; // Escape ICS chars
                    const description = item.details
                        ? `DESCRIPTION:${item.details.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n")}`
                        : 'DESCRIPTION:';
                    // Simple UID based on start time and index
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
