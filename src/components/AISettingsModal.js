import React, { useState, useEffect } from 'react';
import { useAISettings } from '../context/AISettingsContext.js';
import { useNotification } from '../context/NotificationContext.js';

const AISettingsModal = ({ onClose }) => {
  const { settings, updateSettings, testConnection, isLoading, error } = useAISettings();
  const { showSuccess, showError, showAlert } = useNotification();
  
  const [formValues, setFormValues] = useState({
    apiKey: settings.apiKey || '',
    isEnabled: settings.isEnabled,
    model: settings.model,
    effort: settings.effort
  });
  
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [connectionTested, setConnectionTested] = useState(false);
  const [isConnectionValid, setIsConnectionValid] = useState(settings.isConnectionValid);

  useEffect(() => {
    // Update form values when settings change
    setFormValues({
      apiKey: settings.apiKey || '',
      isEnabled: settings.isEnabled,
      model: settings.model,
      effort: settings.effort
    });
    
    setIsConnectionValid(settings.isConnectionValid);
  }, [settings]);

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

  const handleTestConnection = async () => {
    if (!formValues.apiKey) {
      showError('Please enter an API key to test the connection');
      return;
    }
    
    // Update the API key in context first
    updateSettings({ apiKey: formValues.apiKey });
    
    try {
      // Show testing message
      showAlert('Testing connection to OpenAI... Please wait.');
      
      const isValid = await testConnection();
      setConnectionTested(true);
      setIsConnectionValid(isValid);
      
      if (isValid) {
        showSuccess('Connection to OpenAI successful! Your API key works.');
      } else {
        showError(
          'Failed to connect to OpenAI. Please check your API key and ensure you have access to the o3-mini model. ' +
          'See browser console for detailed error information.'
        );
      }
    } catch (err) {
      console.error('Error during connection test:', err);
      setConnectionTested(true);
      setIsConnectionValid(false);
      showError(error || 'An error occurred testing the connection. Check browser console for details.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Don't save if connection test failed
    if (formValues.isEnabled && formValues.apiKey && !isConnectionValid) {
      showError('Please test your API key connection before enabling AI features');
      return;
    }
    
    updateSettings(formValues);
    showSuccess('AI settings updated successfully!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">AI Settings</h2>
        
        <form onSubmit={handleSubmit}>
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
              <label htmlFor="isEnabled" className="ml-2 block text-sm text-gray-700">
                Enable AI-powered scheduling
              </label>
            </div>
            <p className="text-xs text-gray-500">
              Requires an OpenAI API key with access to the o3-mini model
            </p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              OpenAI API Key
            </label>
            <div className="flex">
              <input
                type={isApiKeyVisible ? "text" : "password"}
                name="apiKey"
                value={formValues.apiKey}
                onChange={handleChange}
                className="flex-1 p-2 border border-gray-300 rounded-l-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                placeholder="sk-..."
              />
              <button
                type="button"
                onClick={() => setIsApiKeyVisible(!isApiKeyVisible)}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-r-md hover:bg-gray-300"
              >
                {isApiKeyVisible ? "Hide" : "Show"}
              </button>
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-xs text-gray-500">
                Your API key is stored locally in your browser
              </p>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isLoading || !formValues.apiKey}
                className={`text-xs px-2 py-1 rounded ${
                  isLoading 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isLoading ? 'Testing...' : 'Test Connection'}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model
            </label>
            <select
              name="model"
              value={formValues.model}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="o3-mini">o3-mini</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Currently only o3-mini is supported</p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reasoning Effort
            </label>
            <select
              name="effort"
              value={formValues.effort}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              High effort produces better quality schedules
            </p>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AISettingsModal;