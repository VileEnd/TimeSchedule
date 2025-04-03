import React, { createContext, useState, useContext, useEffect } from 'react';
import { testOpenAIConnection } from '../services/OpenAIService.js';

const AISettingsContext = createContext();

export const useAISettings = () => useContext(AISettingsContext);

export const AISettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    apiKey: '',
    isEnabled: false,
    model: 'o3-mini',
    effort: 'high',
    hasTestedConnection: false,
    isConnectionValid: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load settings from localStorage on initial render
  useEffect(() => {
    const savedSettings = localStorage.getItem('aiSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prevSettings => ({
          ...prevSettings,
          ...parsedSettings,
          // Always reset connection status when loading
          hasTestedConnection: false,
          isConnectionValid: false
        }));
      } catch (error) {
        console.error('Error loading AI settings:', error);
      }
    }
  }, []);

  // Save non-sensitive settings to localStorage whenever they change
  useEffect(() => {
    const settingsToSave = {
      isEnabled: settings.isEnabled,
      model: settings.model,
      effort: settings.effort
    };
    
    localStorage.setItem('aiSettings', JSON.stringify(settingsToSave));
  }, [settings.isEnabled, settings.model, settings.effort]);

  // Test the OpenAI connection
  const testConnection = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const isValid = await testOpenAIConnection(settings.apiKey);
      
      setSettings(prevSettings => ({
        ...prevSettings,
        hasTestedConnection: true,
        isConnectionValid: isValid
      }));
      
      return isValid;
    } catch (err) {
      setError('Failed to connect to OpenAI. Please check your API key and try again.');
      
      setSettings(prevSettings => ({
        ...prevSettings,
        hasTestedConnection: true,
        isConnectionValid: false
      }));
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Update settings
  const updateSettings = (newSettings) => {
    // If API key is changed, reset connection status
    const resetConnection = newSettings.apiKey !== undefined && 
                           newSettings.apiKey !== settings.apiKey;
    
    setSettings(prevSettings => {
      const updatedSettings = { 
        ...prevSettings, 
        ...newSettings,
        ...(resetConnection ? {
          hasTestedConnection: false,
          isConnectionValid: false
        } : {})
      };
      
      return updatedSettings;
    });
    
    return settings;
  };

  // Clear API key (e.g., for security/logout)
  const clearApiKey = () => {
    setSettings(prevSettings => ({
      ...prevSettings,
      apiKey: '',
      hasTestedConnection: false,
      isConnectionValid: false
    }));
  };

  return (
    <AISettingsContext.Provider
      value={{
        settings,
        isLoading,
        error,
        updateSettings,
        testConnection,
        clearApiKey
      }}
    >
      {children}
    </AISettingsContext.Provider>
  );
};

export default AISettingsContext;