import React, { useState, useEffect } from 'react';
import { useAISettings } from '../context/AISettingsContext.js';
import { useSchedule } from '../context/ScheduleContext.js';
import { useNotification } from '../context/NotificationContext.js';
import { useAISchedule } from '../context/AIScheduleContext.js';
import { generateOptimizedSchedule, AVAILABLE_MODELS } from '../services/OpenAIService.js';
import { defaultLearningConfig } from '../utils/LearningScheduleAlgorithm.js';
import { sendAICompleteNotification } from '../services/NotificationService.js';

const UnifiedAITools = () => {
  const { settings, updateSettings, testConnection, isLoading: isSettingsLoading } = useAISettings();
  const { scheduleData, setScheduleData, saveToLocalStorage, clearAllData } = useSchedule();
  const { showSuccess, showError, showConfirm, showAlert } = useNotification();
  const { savePendingSchedule } = useAISchedule();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [config, setConfig] = useState(defaultLearningConfig);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  // Form state
  const [formValues, setFormValues] = useState({
    apiKey: settings.apiKey || '',
    isEnabled: settings.isEnabled,
    model: settings.model,
    effort: settings.effort,
    calendarUrl: settings.calendarUrl || '',
    schedulePrompt: settings.schedulePrompt || '',
    useExistingSchedule: settings.useExistingSchedule || false
  });
  
  // UI state
  const [activeTab, setActiveTab] = useState('settings');
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [connectionTested, setConnectionTested] = useState(false);
  const [isConnectionValid, setIsConnectionValid] = useState(settings.isConnectionValid);

  // Update form values when settings change
  useEffect(() => {
    setFormValues({
      apiKey: settings.apiKey || '',
      isEnabled: settings.isEnabled,
      model: settings.model,
      effort: settings.effort,
      calendarUrl: settings.calendarUrl || '',
      schedulePrompt: settings.schedulePrompt || '',
      useExistingSchedule: settings.useExistingSchedule || false
    });
    
    setIsConnectionValid(settings.isConnectionValid);
  }, [settings]);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' 
      ? checked 
      : type === 'number' 
        ? parseFloat(value) 
        : value;
    
    setFormValues({
      ...formValues,
      [name]: newValue
    });
    
    // Reset connection test if API key changes
    if (name === 'apiKey') {
      setConnectionTested(false);
      setIsConnectionValid(false);
    }
  };

  // Handle config changes
  const handleConfigChange = (e) => {
    const { name, value, type } = e.target;
    setConfig({
      ...config,
      [name]: type === 'number' ? parseInt(value, 10) : value
    });
  };

  // Test connection
  const handleTestConnection = async () => {
    if (!formValues.apiKey) {
      showError('Please enter an API key to test the connection');
      return;
    }
    
    // Update the API key in context first
    updateSettings({ apiKey: formValues.apiKey });
    
    try {
      // Show testing message
      showAlert('Testing connection to AI service... Please wait.');
      
      const isValid = await testConnection();
      setConnectionTested(true);
      setIsConnectionValid(isValid);
      
      if (isValid) {
        showSuccess('Connection successful! Your API key works.');
      } else {
        showError(
          'Failed to connect. Please check your API key and ensure you have access to the selected model.'
        );
      }
    } catch (err) {
      console.error('Error during connection test:', err);
      setConnectionTested(true);
      setIsConnectionValid(false);
      showError('An error occurred testing the connection. Check browser console for details.');
    }
  };

  // Save settings
  const handleSaveSettings = (e) => {
    if (e) e.preventDefault();
    
    // Don't save if connection test failed
    if (formValues.isEnabled && formValues.apiKey && !isConnectionValid && !connectionTested) {
      showError('Please test your API key connection before enabling AI features');
      return;
    }
    
    updateSettings(formValues);
    showSuccess('AI settings updated successfully!');
  };

  // Handle clear confirmation
  const handleClearConfirmation = () => {
    setShowClearConfirm(true);
  };

  // Confirm clear all data
  const handleClearConfirm = () => {
    clearAllData();
    showSuccess('Schedule cleared successfully');
    setShowClearConfirm(false);
  };

  // Cancel clear
  const handleClearCancel = () => {
    setShowClearConfirm(false);
  };

  // Generate schedule from text
  const handleGenerateScheduleFromText = async () => {
    if (!settings.isConnectionValid && !formValues.apiKey) {
      showError('Please provide and test your API key in the Settings tab first');
      setActiveTab('settings');
      return;
    }

    if (!formValues.schedulePrompt.trim()) {
      showError('Please enter a schedule description');
      return;
    }

    try {
      setIsGenerating(true);
      
      // Save the prompt to settings first
      updateSettings({ schedulePrompt: formValues.schedulePrompt });
      
      // Use existing API key from settings or temporary one from form
      const keyToUse = settings.apiKey || formValues.apiKey;
      
      // Get model label for display
      const modelLabelForFeedback = AVAILABLE_MODELS.find(m => m.value === formValues.model)?.label || formValues.model;
      
      // Show feedback that we're connecting to AI service
      showSuccess(`Connecting to ${modelLabelForFeedback} and generating schedule... This may take 30-60 seconds.`, 10000);
      
      // Show AI processing overlay message if function exists
      if (window.showAIProcessingMessage) {
        window.showAIProcessingMessage();
      }
      
      // Capture the current schedule for context
      const currentScheduleData = {...scheduleData};
      
      // Clear existing data only after capturing the current state
      clearAllData();
      
      // Check if we should use the existing schedule as context
      const useExistingContext = formValues.useExistingSchedule;
      
      // Check if the current schedule has any data
      const hasExistingSchedule = useExistingContext && Object.values(currentScheduleData).some(dayActivities => 
        Array.isArray(dayActivities) && dayActivities.length > 0
      );
      
      // Custom prompt for the text-based generation
      const textBasedPrompt = `
      Please create a complete weekly schedule based on the following description:
      
      ${formValues.schedulePrompt}
      
      ${hasExistingSchedule ? `
      IMPORTANT: Use the following current schedule as a starting point and modify it according to the description above:
      
      ${Object.entries(currentScheduleData)
        .map(([day, activities]) => {
          if (!Array.isArray(activities) || activities.length === 0) return '';
          const dayActivities = activities.map(a => 
            `- ${a.start_time}-${a.end_time}: ${a.activity} (${a.type})`
          ).join('\n');
          return dayActivities ? `${day}:\n${dayActivities}` : '';
        })
        .filter(day => day.length > 0)
        .join('\n\n')}
      ` : ''}
      
      The schedule should include all activities mentioned and use appropriate time blocks.
      Organize activities by day of the week (Monday through Sunday).
      
      Each activity should have:
      - activity: string (name of the activity)
      - start_time: string (format "HH:MM")
      - end_time: string (format "HH:MM")
      - type: string (use appropriate categories like "Work", "Study", "Break", "Physical", "Meal", "Sleep", etc.)
      - details: string (provide a DETAILED description with additional helpful information about the activity)
      - isAutoGenerated: true
      
      Provide concise but useful details in a two-part format for each activity:
      1. First part: A brief summary (20-30 words max) that will fit in the UI
      2. Second part: (Optional) More detailed information after "||" symbol for expandable view
      
      Example format: "Brief summary about the activity. || Additional detailed information here."
      
      For example:
      - For meals: "Balanced breakfast with protein. || Include eggs, oatmeal, or yogurt with fruits. Focus on slow-release carbs for sustained energy."
      - For work: "Focus on Q1 report analysis. || Analyze sales data, prepare visualization, draft executive summary for team review."
      - For exercise: "Upper body strength training. || 3 sets each: push-ups, pull-ups, shoulder press. Maintain proper form and 60-sec rest."
      - For study: "Math: Linear Algebra Ch.3. || Focus on matrix operations and transformations. Try problems 3.5-3.12."
      - For commutes: "Morning commute (traffic expected). || Consider alternate route via Highway 9 if main route congested."
      
      IMPORTANT INSTRUCTION FOR SLEEP ACTIVITIES:
      - For activities that span across midnight (like sleep), create TWO separate entries:
        1. First entry: From start time to "00:00" on the starting day
        2. Second entry: From "00:00" to end time on the following day
      - Both entries should have type="Sleep" and the same activity name
      
      YOUR RESPONSE MUST BE A VALID JSON OBJECT ONLY with days of the week as keys.
      `;
      
      // Call the OpenAI service with the custom prompt - always use high effort for o3-mini
      const freshSchedule = await generateOptimizedSchedule(
        {}, // Empty schedule data to start from scratch
        config,
        {
          model: formValues.model,
          effort: formValues.model === 'o3-mini' ? 'high' : undefined
        },
        keyToUse,
        textBasedPrompt // Pass the custom prompt
      );
      
      // Count how many blocks were added
      let totalBlocksAdded = 0;
      Object.keys(freshSchedule).forEach(day => {
        totalBlocksAdded += freshSchedule[day].length;
      });
      
      if (totalBlocksAdded === 0) {
        showError('No schedule blocks could be generated. Try providing more details.');
        return;
      }
      
      // Get the model label for display
      const modelLabel = AVAILABLE_MODELS.find(m => m.value === formValues.model)?.label || formValues.model;
      
      // Send notification that AI processing is complete
      sendAICompleteNotification(
        `AI has finished creating your schedule with ${totalBlocksAdded} blocks`,
        totalBlocksAdded
      );
      
      // Save to pending schedule context
      savePendingSchedule(freshSchedule, 'text', totalBlocksAdded);
        
      // Ask user to confirm through UI banner
      showSuccess(`${modelLabel} has created a schedule with ${totalBlocksAdded} blocks. You can apply it from the banner at the bottom of the screen.`);
      setIsOpen(false);
    } catch (error) {
      console.error('Error generating schedule from text:', error);
      showError(`Failed to generate schedule: ${error.message}`);
    } finally {
      setIsGenerating(false);
      
      // Hide AI processing message if function exists
      if (window.hideAIProcessingMessage) {
        window.hideAIProcessingMessage();
      }
    }
  };

  // Generate schedule from calendar
  const handleGenerateScheduleFromCalendar = async () => {
    if (!settings.isConnectionValid && !formValues.apiKey) {
      showError('Please provide and test your API key in the Settings tab first');
      setActiveTab('settings');
      return;
    }

    if (!formValues.calendarUrl.trim()) {
      showError('Please enter a calendar URL');
      return;
    }

    try {
      setIsGenerating(true);
      
      // Save the calendar URL to settings first
      updateSettings({ calendarUrl: formValues.calendarUrl });
      
      // Use existing API key from settings or temporary one from form
      const keyToUse = settings.apiKey || formValues.apiKey;
      
      // Get model label for display
      const modelLabelForFeedback = AVAILABLE_MODELS.find(m => m.value === formValues.model)?.label || formValues.model;
      
      // Show feedback
      showSuccess(`Fetching calendar data and processing with ${modelLabelForFeedback}... This may take 30-60 seconds.`, 10000);
      
      // Show AI processing overlay message if function exists
      if (window.showAIProcessingMessage) {
        window.showAIProcessingMessage();
      }
      
      // Capture the current schedule for context
      const currentScheduleData = {...scheduleData};
      
      // Clear existing schedule only after capturing the current state
      clearAllData();
      
      // Check if we should use the existing schedule as context
      const useExistingContext = formValues.useExistingSchedule;
      
      // Check if the current schedule has any data
      const hasExistingSchedule = useExistingContext && Object.values(currentScheduleData).some(dayActivities => 
        Array.isArray(dayActivities) && dayActivities.length > 0
      );
      
      // Build a prompt for AI that includes the calendar URL
      const calendarPrompt = `
      Please create a complete weekly schedule based on the following public calendar URL:
      
      ${formValues.calendarUrl}
      
      This is a public Google Calendar URL in iCal format that anyone can access.
      Please fetch and parse this calendar data and extract all events for the current week.
      
      ${hasExistingSchedule ? `
      IMPORTANT: If you are unable to directly access the calendar URL, use the following current schedule as a starting point and modify it accordingly:
      
      ${Object.entries(currentScheduleData)
        .map(([day, activities]) => {
          if (!Array.isArray(activities) || activities.length === 0) return '';
          const dayActivities = activities.map(a => 
            `- ${a.start_time}-${a.end_time}: ${a.activity} (${a.type})`
          ).join('\n');
          return dayActivities ? `${day}:\n${dayActivities}` : '';
        })
        .filter(day => day.length > 0)
        .join('\n\n')}
      ` : ''}
      
      Create a schedule that includes these events and organizes them by day of the week (Monday through Sunday).
      If you're unable to directly fetch from the URL, please create a sample weekly calendar with 
      typical events like meetings, classes, work periods, etc. to demonstrate the functionality.
      
      Each activity should have:
      - activity: string (name of the activity/event)
      - start_time: string (format "HH:MM")
      - end_time: string (format "HH:MM")
      - type: string (use appropriate categories based on the event type)
      - details: string (provide a DETAILED description with additional helpful information about the activity, including location if available)
      - isAutoGenerated: true
      
      Provide concise but useful details in a two-part format for each activity:
      1. First part: A brief summary (20-30 words max) that will fit in the UI
      2. Second part: (Optional) More detailed information after "||" symbol for expandable view
      
      Example format: "Brief summary about the activity. || Additional detailed information here."
      
      For example:
      - For meetings: "Weekly team sync - prepare status update. || Agenda: project timelines, resource allocation, client feedback review."
      - For classes: "Biology Lecture: Cell Division. || Ch.4 in textbook. Remember to bring lab notebook and completed pre-lab worksheet."
      - For work: "Client proposal development. || Prepare cost estimates, timeline draft, and resource allocation plan."
      - For appointments: "Dr. Smith - annual checkup. || Address: 123 Health St. Bring insurance card and medication list."
      - For events: "Company networking dinner. || Business casual attire. Location: Grand Hotel, Downtown. 18:30-21:00."
      
      IMPORTANT INSTRUCTION FOR SLEEP ACTIVITIES:
      - For activities that span across midnight (like sleep), create TWO separate entries:
        1. First entry: From start time to "00:00" on the starting day
        2. Second entry: From "00:00" to end time on the following day
      - Both entries should have type="Sleep" and the same activity name
      
      YOUR RESPONSE MUST BE A VALID JSON OBJECT ONLY with days of the week as keys.
      `;
      
      // Call the OpenAI service with the calendar prompt - always use high effort for o3-mini
      const calendarSchedule = await generateOptimizedSchedule(
        {}, // Empty schedule data
        config,
        {
          model: formValues.model,
          effort: formValues.model === 'o3-mini' ? 'high' : undefined
        },
        keyToUse,
        calendarPrompt
      );
      
      // Count how many blocks were added
      let totalBlocksAdded = 0;
      Object.keys(calendarSchedule).forEach(day => {
        totalBlocksAdded += calendarSchedule[day].length;
      });
      
      if (totalBlocksAdded === 0) {
        showError('No events could be extracted from the calendar. Check the URL and try again.');
        return;
      }
      
      // Get the model label for display
      const modelLabel = AVAILABLE_MODELS.find(m => m.value === formValues.model)?.label || formValues.model;
      
      // Send notification that AI processing is complete
      sendAICompleteNotification(
        `AI has finished creating your schedule with ${totalBlocksAdded} blocks from your calendar`,
        totalBlocksAdded
      );
      
      // Save to pending schedule context
      savePendingSchedule(calendarSchedule, 'calendar', totalBlocksAdded);
      
      // Ask user to confirm through UI banner
      showSuccess(`${modelLabel} has created a schedule with ${totalBlocksAdded} blocks from your calendar. You can apply it from the banner at the bottom of the screen.`);
      setIsOpen(false);
    } catch (error) {
      console.error('Error generating schedule from calendar:', error);
      showError(`Failed to process calendar: ${error.message}`);
    } finally {
      setIsGenerating(false);
      
      // Hide AI processing message if function exists
      if (window.hideAIProcessingMessage) {
        window.hideAIProcessingMessage();
      }
    }
  };

  // Optimize existing schedule
  const handleOptimizeSchedule = async () => {
    if (!settings.isConnectionValid && !formValues.apiKey) {
      showError('Please provide and test your API key in the Settings tab first');
      setActiveTab('settings');
      return;
    }

    try {
      setIsGenerating(true);
      
      // Use existing API key from settings or temporary one from form
      const keyToUse = settings.apiKey || formValues.apiKey;
      
      // Get model label for display
      const modelLabelForFeedback = AVAILABLE_MODELS.find(m => m.value === formValues.model)?.label || formValues.model;
      
      // Show feedback that we're connecting to AI
      showSuccess(`Optimizing your schedule with ${modelLabelForFeedback}... This may take 30-60 seconds.`, 10000);
      
      // Show AI processing overlay message if function exists
      if (window.showAIProcessingMessage) {
        window.showAIProcessingMessage();
      }
      
      // Determine whether to include the current schedule as context
      const inputSchedule = formValues.useExistingSchedule ? scheduleData : {};
      
      // Call the AI service - always use high effort for o3-mini
      const optimizedSchedule = await generateOptimizedSchedule(
        inputSchedule,
        config,
        {
          model: formValues.model,
          effort: formValues.model === 'o3-mini' ? 'high' : undefined
        },
        keyToUse
      );
      
      // Count how many blocks were added
      let totalBlocksAdded = 0;
      Object.keys(optimizedSchedule).forEach(day => {
        totalBlocksAdded += optimizedSchedule[day].filter(a => a.isAutoGenerated).length;
      });
      
      if (totalBlocksAdded === 0) {
        showError('No study blocks could be generated. Try adjusting your settings.');
        return;
      }
      
      // Get the model label for display
      const modelLabel = AVAILABLE_MODELS.find(m => m.value === formValues.model)?.label || formValues.model;
      
      // Send notification that AI processing is complete
      sendAICompleteNotification(
        `AI has finished optimizing your schedule with ${totalBlocksAdded} study blocks`,
        totalBlocksAdded
      );
      
      // Save to pending schedule context
      savePendingSchedule(optimizedSchedule, 'optimize', totalBlocksAdded);
      
      // Ask user to confirm through UI banner
      showSuccess(`${modelLabel} has optimized your schedule with ${totalBlocksAdded} study blocks based on learning science. You can apply it from the banner at the bottom of the screen.`);
      setIsOpen(false);
    } catch (error) {
      console.error('Error generating AI schedule:', error);
      showError(`Failed to generate AI schedule: ${error.message}`);
    } finally {
      setIsGenerating(false);
      
      // Hide AI processing message if function exists
      if (window.hideAIProcessingMessage) {
        window.hideAIProcessingMessage();
      }
    }
  };

  // Render settings tab
  const renderSettingsTab = () => (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); handleSaveSettings(); }}>
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="isEnabled"
              name="isEnabled"
              checked={formValues.isEnabled}
              onChange={handleChange}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label htmlFor="isEnabled" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Enable AI-powered scheduling
            </label>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Requires an API key for OpenAI or Anthropic
          </p>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            AI API Key
          </label>
          <div className="flex">
            <input
              type={isApiKeyVisible ? "text" : "password"}
              name="apiKey"
              value={formValues.apiKey}
              onChange={handleChange}
              className="flex-1 p-2 border border-gray-300 rounded-l-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="sk-..."
            />
            <button
              type="button"
              onClick={() => setIsApiKeyVisible(!isApiKeyVisible)}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-r-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              {isApiKeyVisible ? "Hide" : "Show"}
            </button>
          </div>
          <div className="flex justify-between mt-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your API key is stored locally in your browser
            </p>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isSettingsLoading || !formValues.apiKey}
              className={`text-xs px-2 py-1 rounded ${
                isSettingsLoading 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400' 
                  : 'bg-purple-500 text-white hover:bg-purple-600'
              }`}
            >
              {isSettingsLoading ? 'Testing...' : 'Test Connection'}
            </button>
          </div>
          {connectionTested && (
            <div className={`mt-2 text-sm ${isConnectionValid ? 'text-green-600' : 'text-red-600'}`}>
              {isConnectionValid 
                ? 'Connection successful!' 
                : 'Connection failed. Please check your API key.'}
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            AI Model
          </label>
          <select
            name="model"
            value={formValues.model}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {AVAILABLE_MODELS.map(model => (
              <option key={model.value} value={model.value}>{model.label}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {AVAILABLE_MODELS.find(m => m.value === formValues.model)?.description || 'Select a model'}
          </p>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="useExistingSchedule"
              name="useExistingSchedule"
              checked={formValues.useExistingSchedule}
              onChange={handleChange}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label htmlFor="useExistingSchedule" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Use existing schedule as context
            </label>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 ml-6 mt-1">
            When checked, AI will consider your current schedule when creating a new one
          </p>
        </div>
        
        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            className="flex items-center px-5 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg shadow-sm hover:shadow transition-all"
          >
            <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );

  // Render text input tab
  const renderTextInputTab = () => (
    <div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Describe Your Schedule
        </label>
        <textarea
          name="schedulePrompt"
          value={formValues.schedulePrompt}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="I work Monday to Friday from 9 AM to 5 PM. I have a gym class on Tuesday and Thursday at 6 PM for 1 hour. I need to study Spanish for at least 3 hours spread across the week..."
          rows={6}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Describe your routine, commitments, and preferences in detail. The AI will create a complete weekly schedule.
          {formValues.useExistingSchedule && (
            <span className="inline-flex items-center ml-2 text-purple-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Using current schedule as context
            </span>
          )}
        </p>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          AI Model
        </label>
        <select
          name="model"
          value={formValues.model}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          {AVAILABLE_MODELS.map(model => (
            <option key={model.value} value={model.value}>{model.label}</option>
          ))}
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {AVAILABLE_MODELS.find(m => m.value === formValues.model)?.description || 'Select a model'}
        </p>
      </div>
      
      <div className="flex justify-end mt-6">
        <button
          onClick={handleGenerateScheduleFromText}
          disabled={isGenerating}
          className={`flex items-center px-5 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg shadow-sm hover:shadow transition-all ${
            isGenerating ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
              </svg>
              Create from Description
            </>
          )}
        </button>
      </div>
    </div>
  );

  // Render calendar input tab
  const renderCalendarTab = () => (
    <div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Public Calendar URL (iCal/ics)
        </label>
        <input
          type="url"
          name="calendarUrl"
          value={formValues.calendarUrl}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="https://calendar.google.com/calendar/ical/..."
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Enter a public calendar URL (must be publicly accessible). From Google Calendar, go to Settings > Settings for my calendars > [Select calendar] > Integrate calendar > Public URL to this calendar.
          {formValues.useExistingSchedule && (
            <span className="inline-flex items-center ml-2 text-purple-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Using current schedule as fallback
            </span>
          )}
        </p>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          AI Model
        </label>
        <select
          name="model"
          value={formValues.model}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          {AVAILABLE_MODELS.map(model => (
            <option key={model.value} value={model.value}>{model.label}</option>
          ))}
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {AVAILABLE_MODELS.find(m => m.value === formValues.model)?.description || 'Select a model'}
        </p>
      </div>
      
      <div className="flex justify-end mt-6">
        <button
          onClick={handleGenerateScheduleFromCalendar}
          disabled={isGenerating}
          className={`flex items-center px-5 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg shadow-sm hover:shadow transition-all ${
            isGenerating ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Import Calendar
            </>
          )}
        </button>
      </div>
    </div>
  );

  // Render optimize tab
  const renderOptimizeTab = () => (
    <div>
      <div className="mb-3">
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
          Optimize your current schedule with AI to create the perfect learning blocks and improve productivity.
          {formValues.useExistingSchedule ? (
            <span className="inline-flex items-center ml-2 text-purple-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Using current schedule
            </span>
          ) : (
            <span className="inline-flex items-center ml-2 text-orange-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Starting with empty schedule
            </span>
          )}
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            AI Model
          </label>
          <select
            name="model"
            value={formValues.model}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {AVAILABLE_MODELS.map(model => (
              <option key={model.value} value={model.value}>{model.label}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {AVAILABLE_MODELS.find(m => m.value === formValues.model)?.description || 'Select a model'}
          </p>
        </div>
        
        <div className="mt-4 p-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-3">
            Learning Block Settings
          </h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Daily Study Goal
            </label>
            <div className="flex items-center">
              <input
                type="range"
                name="dailyLearningMinutes"
                value={config.dailyLearningMinutes}
                onChange={handleConfigChange}
                min="30"
                max="360"
                step="30"
                className="w-full mr-3 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[4rem] text-right">
                {config.dailyLearningMinutes} min
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Set your target daily study time between 30 min and 6 hours
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Min Block Duration
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  name="minimumLearningBlockMinutes"
                  value={config.minimumLearningBlockMinutes}
                  onChange={handleConfigChange}
                  min="15"
                  max="60"
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">min</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Shortest focus session
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Block Duration
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  name="maximumLearningBlockMinutes"
                  value={config.maximumLearningBlockMinutes}
                  onChange={handleConfigChange}
                  min="30"
                  max="180"
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">min</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Longest focus session
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-100 dark:border-purple-800/40">
          <h4 className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-3">Learning Science Features</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-5 w-5 text-purple-500 dark:text-purple-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="ml-2 text-sm text-gray-700 dark:text-gray-300">Spaced repetition for better retention</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-5 w-5 text-purple-500 dark:text-purple-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="ml-2 text-sm text-gray-700 dark:text-gray-300">Interleaving subjects for improved learning</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-5 w-5 text-purple-500 dark:text-purple-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="ml-2 text-sm text-gray-700 dark:text-gray-300">Strategic breaks based on cognitive science</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-5 w-5 text-purple-500 dark:text-purple-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="ml-2 text-sm text-gray-700 dark:text-gray-300">Time-blocking optimized for your schedule</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between mt-6">
        <button
          onClick={handleClearConfirmation}
          className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-sm hover:shadow"
        >
          <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Clear Schedule
        </button>
        
        <button
          onClick={handleOptimizeSchedule}
          disabled={isGenerating}
          className={`flex items-center px-5 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg shadow-sm hover:shadow transition-all ${
            isGenerating ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Optimizing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              Optimize Schedule
            </>
          )}
        </button>
      </div>
    </div>
  );

  // Render clear confirmation
  const renderClearConfirmation = () => (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-red-200 dark:border-red-800/40">
      <div className="flex items-center mb-4 text-red-600 dark:text-red-400">
        <svg className="w-8 h-8 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <h3 className="text-lg font-semibold">Confirm Clear Schedule</h3>
      </div>
      
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-6 pl-11">
        Are you sure you want to clear all schedule data? This action cannot be undone and all your custom schedule items will be permanently deleted.
      </p>
      
      <div className="flex justify-end space-x-3">
        <button
          onClick={handleClearCancel}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleClearConfirm}
          className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-sm hover:shadow"
        >
          <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Clear All Data
        </button>
      </div>
    </div>
  );

  const handleEscKey = (event) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, []);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-2 px-4 rounded-full shadow-md hover:shadow-lg flex items-center transition-all"
        aria-expanded={isOpen}
        title="AI Tools"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        AI Tools
      </button>
      
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto"
          onClick={handleBackdropClick}
          style={{padding: '1rem'}}
        >
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl dark:bg-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 relative">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">AI-Powered Schedule Tools</h2>
            
            <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
              <nav className="-mb-px flex space-x-4">
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'settings'
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  Settings
                </button>
                <button
                  onClick={() => setActiveTab('text')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'text'
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  Text Description
                </button>
                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'calendar'
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  Calendar Import
                </button>
                <button
                  onClick={() => setActiveTab('optimize')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'optimize'
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  Optimize
                </button>
              </nav>
            </div>
            
            <div className="mt-4">
              {showClearConfirm && renderClearConfirmation()}
              
              {!showClearConfirm && (
                <>
                  {activeTab === 'settings' && renderSettingsTab()}
                  {activeTab === 'text' && renderTextInputTab()}
                  {activeTab === 'calendar' && renderCalendarTab()}
                  {activeTab === 'optimize' && renderOptimizeTab()}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedAITools;