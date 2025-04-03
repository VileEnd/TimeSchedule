import React, { createContext, useState, useContext, useEffect } from 'react';

const PomodoroSettingsContext = createContext();

export const usePomodoroSettings = () => useContext(PomodoroSettingsContext);

export const PomodoroSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    workDuration: 25, // in minutes
    shortBreakDuration: 5,
    longBreakDuration: 15,
    cyclesBeforeLongBreak: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    alarmSound: 'bell', // bell, chime, digital
    alarmVolume: 0.7, // 0 to 1
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('pomodoroSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error loading Pomodoro settings:', error);
      }
    }
  }, []);

  const updateSettings = (newSettings) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('pomodoroSettings', JSON.stringify(updatedSettings));
    return updatedSettings;
  };

  return (
    <PomodoroSettingsContext.Provider
      value={{
        settings,
        updateSettings
      }}
    >
      {children}
    </PomodoroSettingsContext.Provider>
  );
};

export default PomodoroSettingsContext;