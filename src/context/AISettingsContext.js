import React, { createContext, useState, useContext, useEffect } from 'react';
import { testOpenAIConnection } from '../services/OpenAIService.js';

// For encrypted storage
import { encrypt, decrypt } from '../utils/encryption.js';

const AISettingsContext = createContext();

export const useAISettings = () => useContext(AISettingsContext);

// Check if browser supports the Web Crypto API
const isWebCryptoSupported = () => {
  return typeof window !== 'undefined' && 
         window.crypto && 
         window.crypto.subtle && 
         typeof window.crypto.subtle.encrypt === 'function';
};

export const AISettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    apiKey: '',
    isEnabled: false,
    model: 'o3-mini',
    effort: 'high',
    hasTestedConnection: false,
    isConnectionValid: false,
    calendarUrl: '',
    schedulePrompt: '',
    useExistingSchedule: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEncryptionAvailable, setIsEncryptionAvailable] = useState(false);

  // Check for Web Crypto API support
  useEffect(() => {
    setIsEncryptionAvailable(isWebCryptoSupported());
  }, []);

  // Load settings from secure storage on initial render
  useEffect(() => {
    const loadSettings = async () => {
      // Load non-sensitive settings
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

      // Load API key from secure storage if encryption is available
      if (isEncryptionAvailable) {
        try {
          const encryptedKey = localStorage.getItem('encryptedApiKey');
          if (encryptedKey) {
            // Use device fingerprint as encryption key
            const deviceId = await getDeviceFingerprint();
            const decryptedKey = await decrypt(encryptedKey, deviceId);
            
            if (decryptedKey) {
              setSettings(prevSettings => ({
                ...prevSettings,
                apiKey: decryptedKey
              }));
            }
          }
        } catch (error) {
          console.error('Error loading encrypted API key:', error);
        }
      } else {
        // Fallback to regular localStorage for API key if encryption not available
        const apiKey = sessionStorage.getItem('tempApiKey') || '';
        if (apiKey) {
          setSettings(prevSettings => ({
            ...prevSettings,
            apiKey
          }));
        }
      }
    };

    loadSettings();
  }, [isEncryptionAvailable]);

  // Get a unique device fingerprint for encryption
  const getDeviceFingerprint = async () => {
    // Simple fingerprinting based on navigator properties
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      navigator.platform,
      window.screen.colorDepth,
      window.screen.width + 'x' + window.screen.height
    ].join('|');
    
    // Create a hash of the fingerprint
    const msgUint8 = new TextEncoder().encode(fingerprint);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Save non-sensitive settings to localStorage whenever they change
  useEffect(() => {
    const settingsToSave = {
      isEnabled: settings.isEnabled,
      model: settings.model,
      effort: settings.effort,
      calendarUrl: settings.calendarUrl,
      schedulePrompt: settings.schedulePrompt,
      useExistingSchedule: settings.useExistingSchedule
    };
    
    localStorage.setItem('aiSettings', JSON.stringify(settingsToSave));
  }, [
    settings.isEnabled, 
    settings.model, 
    settings.effort, 
    settings.calendarUrl, 
    settings.schedulePrompt,
    settings.useExistingSchedule
  ]);
  
  // Save API key separately and encrypted if possible
  useEffect(() => {
    const saveApiKey = async () => {
      if (!settings.apiKey) {
        localStorage.removeItem('encryptedApiKey');
        sessionStorage.removeItem('tempApiKey');
        return;
      }
      
      if (isEncryptionAvailable) {
        try {
          // Use device fingerprint as encryption key
          const deviceId = await getDeviceFingerprint();
          const encryptedKey = await encrypt(settings.apiKey, deviceId);
          localStorage.setItem('encryptedApiKey', encryptedKey);
        } catch (error) {
          console.error('Error encrypting API key:', error);
          // Fallback to session storage (less secure but better than localStorage)
          sessionStorage.setItem('tempApiKey', settings.apiKey);
        }
      } else {
        // Fallback to session storage (less secure but better than localStorage)
        sessionStorage.setItem('tempApiKey', settings.apiKey);
      }
    };
    
    saveApiKey();
  }, [settings.apiKey, isEncryptionAvailable]);

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