// OpenAI integration service for smart scheduling
import OpenAI from "openai";
import { defaultLearningConfig } from '../utils/LearningScheduleAlgorithm.js';

// Default API configuration
const DEFAULT_API_CONFIG = {
  model: 'o3-mini',
  effort: 'high'
};

// Available models
export const AVAILABLE_MODELS = [
  { value: 'o3-mini', label: 'o3-mini (OpenAI)', description: 'Efficient model for basic scheduling' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (OpenAI)', description: 'Compact version with good performance' },
  { value: 'gpt-4o', label: 'GPT-4o (OpenAI)', description: 'Most powerful model for complex scheduling' }
];

/**
 * Create an OpenAI client with the user's API key
 * @param {string} apiKey - User's OpenAI API key
 * @returns {OpenAI} - OpenAI client
 */
const createOpenAIClient = (apiKey) => {
  return new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Required for client-side use
  });
};

/**
 * Generate an optimized schedule using OpenAI
 * 
 * This function can work in the background using a Web Worker if available
 * 
 * @param {Object} scheduleData - Current schedule data
 * @param {Object} learningConfig - Learning preferences
 * @param {Object} aiConfig - OpenAI configuration
 * @param {string} apiKey - User's OpenAI API key
 * @returns {Promise<Object>} - Optimized schedule data
 */
export const generateOptimizedSchedule = async (
  scheduleData, 
  learningConfig = defaultLearningConfig,
  aiConfig = DEFAULT_API_CONFIG,
  apiKey,
  customPrompt = null
) => {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }

  // Check if we can use a web worker for background processing
  const supportsBackgroundProcessing = 'serviceWorker' in navigator && 
                                       navigator.serviceWorker.controller &&
                                       typeof Worker !== 'undefined';
  
  // Store that we're currently processing
  localStorage.setItem('aiProcessingInProgress', 'true');
  localStorage.setItem('aiProcessingStartTime', Date.now().toString());
  
  try {
    // Create OpenAI client
    const openai = createOpenAIClient(apiKey);
    
    // Prepare the prompt for OpenAI
    const promptText = customPrompt || createSchedulePrompt(scheduleData, learningConfig);
    
    // Make API request using the OpenAI client
    const response = await openai.responses.create({
      model: aiConfig.model,
      input: [
        {
          role: "developer",
          content: [
            {
              type: "input_text",
              text: "MOST IMPORTANT DO NOT IGNORE: GENERATE ONLY JSON! NO TEXT EXPLANATION! YOUR OUTPUT MUST BE A VALID JSON OBJECT CONTAINING A SCHEDULE!"
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: promptText
            }
          ]
        }
      ],
      text: {
        format: {
          type: "text"
        }
      },
      reasoning: {
        effort: aiConfig.effort
      },
      tools: [],
      store: false
    });

    // Log the full response for debugging
    console.log('Full OpenAI response:', JSON.stringify(response, null, 2));
    
    // Extract the response text from the output messages
    let responseText = '';
    if (response && response.output) {
      // Find the message in the output
      const message = response.output.find(item => item.type === 'message');
      console.log('Message object:', message);
      
      if (message && message.content) {
        // Find the text content
        const textContent = message.content.find(content => content.type === 'output_text');
        console.log('Text content object:', textContent);
        
        if (textContent && textContent.text) {
          responseText = textContent.text;
          console.log('Response text found:', responseText.substring(0, 100) + '...');
        }
      }
    }
    
    if (!responseText) {
      console.error('No text response found in:', response);
      throw new Error('No text response received from OpenAI. Check console for details.');
    }
    
    // Try to parse the JSON response
    try {
      // First, try direct JSON parsing
      let jsonResult;
      try {
        jsonResult = JSON.parse(responseText);
      } catch (parseError) {
        // If direct parsing fails, attempt to extract JSON from the text
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                         responseText.match(/{[\s\S]*}/);
                         
        if (jsonMatch) {
          try {
            jsonResult = JSON.parse(jsonMatch[1] || jsonMatch[0]);
          } catch (nestedError) {
            throw new Error('Could not parse JSON from the response');
          }
        } else {
          throw new Error('No JSON found in the response');
        }
      }
      
      // Validate and process the JSON response
      return processAIResponse(jsonResult, scheduleData);
    } catch (jsonError) {
      console.error('Error parsing JSON from AI response:', jsonError);
      throw new Error('Failed to extract valid schedule data from the AI response');
    }
  } catch (error) {
    console.error('Error generating optimized schedule:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    
    // Create a more detailed error message
    let errorMessage = 'Failed to generate schedule: ';
    if (error.message) {
      errorMessage += error.message;
    } else if (error.response && error.response.data) {
      errorMessage += JSON.stringify(error.response.data);
    } else {
      errorMessage += 'Unknown error';
    }
    
    throw new Error(errorMessage);
  } finally {
    // Clear the processing flag
    localStorage.removeItem('aiProcessingInProgress');
    localStorage.removeItem('aiProcessingStartTime');
  }
};

/**
 * Create a detailed prompt for the OpenAI model
 * @param {Object} scheduleData - Current schedule data
 * @param {Object} learningConfig - Learning preferences
 * @returns {string} - Formatted prompt
 */
const createSchedulePrompt = (scheduleData, learningConfig) => {
  // Create a detailed description of the current schedule
  const scheduleDescription = Object.entries(scheduleData)
    .map(([day, activities]) => {
      const activitiesStr = activities.map(a => 
        `- ${a.start_time}-${a.end_time}: ${a.activity} (${a.type})`
      ).join('\n');
      
      return `${day}:\n${activitiesStr || '- No activities scheduled'}`;
    })
    .join('\n\n');

  // Create a prompt with learning science principles
  return `
  Create an optimized weekly schedule for a student based on learning science principles. 
  Here is their current schedule:
  
  ${scheduleDescription}
  
  Their learning preferences are:
  - Daily learning goal: ${learningConfig.dailyLearningMinutes} minutes
  - Preferred subjects: ${learningConfig.subjectPriorities.map(s => s.name).join(', ')}
  - Preferred learning block duration: ${learningConfig.minimumLearningBlockMinutes}-${learningConfig.maximumLearningBlockMinutes} minutes
  
  Apply these learning science principles:
  1. Incorporate spaced repetition (distribute learning across days rather than cramming)
  2. Add interleaving (mix different subjects rather than blocking single subjects)
  3. Include dedicated review periods after learning sessions
  4. Schedule sessions during peak cognitive hours when possible
  5. Add buffer time between sessions
  6. Ensure sufficient breaks
  7. Include physical activity breaks to boost learning
  
  Return a JSON object with the optimized schedule in the same format as the input schedule, 
  with each day containing an array of activities. Mark AI-generated activities with 
  "isAutoGenerated": true.
  
  Each activity should have:
  - activity: string (name of the activity)
  - start_time: string (format "HH:MM")
  - end_time: string (format "HH:MM")
  - type: string (use "Study_Focus", "Study_Review", "Break", "Physical", "Meal", "Sleep", etc.)
  - details: string (provide a DETAILED description with additional helpful information about the activity)
  - isAutoGenerated: boolean
  
  Provide concise but useful details in a two-part format for each activity:
  1. First part: A brief summary (20-30 words max) that will fit in the UI
  2. Second part: (Optional) More detailed information after "||" symbol for expandable view
  
  Example format: "Brief summary about the activity. || Additional detailed information here."
  
  For example:
  - For Study_Focus: "Physics Ch.5: Momentum & Collisions. || Focus on conservation laws and elastic vs. inelastic collisions. Try problems 5.7-5.15."
  - For Study_Review: "Review History notes from Week 3-4. || Use active recall and spaced repetition. Create timeline of key events."
  - For Breaks: "Active break - stretching recommended. || Focus on neck, shoulders and wrists to prevent strain from computer work."
  - For Physical: "Cardio workout - moderate intensity. || 5min warm-up, 20min interval training (30sec high/90sec low), 5min cooldown."
  - For Meals: "Protein-rich lunch for study energy. || Consider fish, lean meat, or legumes with vegetables and whole grains."
  
  IMPORTANT INSTRUCTION FOR SLEEP ACTIVITIES:
  - For activities that span across midnight (like sleep), create TWO separate entries:
    1. First entry: From start time to "00:00" on the starting day
    2. Second entry: From "00:00" to end time on the following day
  - Both entries should have type="Sleep" and the same activity name
  - Include brief sleep hygiene tips in the details field using the format: "Wind down period - prep for sleep. || Turn off electronics 30min before, consider reading or light stretching."
  
  YOUR RESPONSE MUST BE A VALID JSON OBJECT ONLY.
  `;
};

/**
 * Process and validate the AI response
 * @param {Object} aiResponse - Response from OpenAI
 * @param {Object} originalSchedule - Original schedule data
 * @returns {Object} - Processed schedule data
 */
const processAIResponse = (aiResponse, originalSchedule) => {
  // Start with the original schedule
  const processedSchedule = { ...originalSchedule };
  
  // Process each day in the AI response
  Object.entries(aiResponse).forEach(([day, activities]) => {
    if (!Array.isArray(activities)) return;
    
    // Filter out existing auto-generated activities
    if (processedSchedule[day]) {
      processedSchedule[day] = processedSchedule[day].filter(
        activity => !activity.isAutoGenerated
      );
    } else {
      processedSchedule[day] = [];
    }
    
    // Add new AI-generated activities
    const validActivities = activities.filter(activity => 
      activity.activity && 
      activity.start_time && 
      activity.end_time && 
      activity.type
    );
    
    // Add isAutoGenerated flag if missing
    validActivities.forEach(activity => {
      activity.isAutoGenerated = true;
    });
    
    processedSchedule[day] = [
      ...processedSchedule[day],
      ...validActivities
    ];
    
    // Sort activities by start time
    processedSchedule[day].sort((a, b) => {
      const timeA = a.start_time.split(':').map(Number);
      const timeB = b.start_time.split(':').map(Number);
      
      if (timeA[0] !== timeB[0]) return timeA[0] - timeB[0];
      return timeA[1] - timeB[1];
    });
  });
  
  return processedSchedule;
};

/**
 * Test the API connection without generating a full schedule
 * @param {string} apiKey - User's OpenAI API key
 * @returns {Promise<boolean>} - Whether the connection was successful
 */
export const testOpenAIConnection = async (apiKey) => {
  if (!apiKey) return false;
  
  try {
    // Create OpenAI client
    const openai = createOpenAIClient(apiKey);
    
    console.log('Testing OpenAI connection...');
    
    // Make a simple test request
    const response = await openai.responses.create({
      model: DEFAULT_API_CONFIG.model,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Simple connection test. Respond with 'connected'."
            }
          ]
        }
      ],
      text: {
        format: {
          type: "text"
        }
      },
      reasoning: {
        effort: "low"
      },
      tools: [],
      store: false
    });
    
    console.log('Test connection response:', JSON.stringify(response, null, 2));
    
    // If we got any response, consider it a success, since different OpenAI models may format their responses differently
    // The important thing is that the API key worked and we got a response
    if (response && response.id) {
      console.log('Connection test successful');
      return true;
    }
    
    console.log('Connection test failed: no valid response');
    return false;
  } catch (error) {
    console.error('Error testing OpenAI connection:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    return false;
  }
};