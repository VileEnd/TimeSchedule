import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Initialize theme based on user preference or system preference
  useEffect(() => {
    // Check localStorage first for user's previous preference
    const storedTheme = localStorage.getItem('theme');
    
    if (storedTheme) {
      setIsDarkMode(storedTheme === 'dark');
    } else {
      // If no stored preference, check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }
  }, []);
  
  // Update document when theme changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save preference to localStorage
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);
  
  // Toggle between light and dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };
  
  // Set a specific theme
  const setTheme = (theme) => {
    setIsDarkMode(theme === 'dark');
  };
  
  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleDarkMode,
        setTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;