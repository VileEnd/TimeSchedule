import React, { useState, useEffect, useRef } from 'react';
import { useNotification } from '../context/NotificationContext.js';
import { usePomodoroSettings } from '../context/PomodoroSettingsContext.js';
import PomodoroSettingsModal from './PomodoroSettingsModal.js';

const EnhancedPomodoroTimer = ({ activity, onClose }) => {
  const { showSuccess, showConfirm } = useNotification();
  const { settings } = usePomodoroSettings();
  const [timeRemaining, setTimeRemaining] = useState(settings.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('work'); // 'work', 'shortBreak', 'longBreak'
  const [cycle, setCycle] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    // Initialize timer based on current mode
    resetTimerForCurrentMode();
    
    // Setup audio
    audioRef.current = new Audio(`/sounds/${settings.alarmSound}.mp3`);
    audioRef.current.volume = settings.alarmVolume;
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, mode]);

  const resetTimerForCurrentMode = () => {
    let duration;
    switch (mode) {
      case 'work':
        duration = settings.workDuration;
        break;
      case 'shortBreak':
        duration = settings.shortBreakDuration;
        break;
      case 'longBreak':
        duration = settings.longBreakDuration;
        break;
      default:
        duration = settings.workDuration;
    }
    setTimeRemaining(duration * 60);
  };

  const startTimer = () => {
    if (isRunning) return;
    
    setIsRunning(true);
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Timer finished
          clearInterval(timerRef.current);
          setIsRunning(false);
          
          // Play sound
          if (audioRef.current) {
            try {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(err => console.error('Error playing sound:', err));
            } catch (e) {
              console.error('Error with audio playback:', e);
            }
          }
          
          // Handle cycle completion
          handleTimerCompletion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimerCompletion = () => {
    if (mode === 'work') {
      // Work session completed
      showSuccess(`Pomodoro for "${activity}" completed! Time for a break!`);
      
      // Determine next break type
      if (cycle >= settings.cyclesBeforeLongBreak) {
        setMode('longBreak');
        setCycle(1); // Reset cycle counter
        showSuccess('Long break time!');
      } else {
        setMode('shortBreak');
        setCycle(prev => prev + 1);
        showSuccess('Short break time!');
      }
      
      // Auto-start break if enabled
      if (settings.autoStartBreaks) {
        setTimeout(() => startTimer(), 1000);
      }
    } else {
      // Break completed
      setMode('work');
      showSuccess('Break completed! Ready for next work session.');
      
      // Auto-start next work session if enabled
      if (settings.autoStartPomodoros) {
        setTimeout(() => startTimer(), 1000);
      }
    }
    
    // Reset timer for the new mode
    resetTimerForCurrentMode();
  };

  const stopTimer = () => {
    if (!isRunning) return;
    
    clearInterval(timerRef.current);
    setIsRunning(false);
  };

  const resetTimer = () => {
    if (isRunning) {
      showConfirm(
        `Timer for "${activity}" is running. Are you sure you want to reset it?`,
        () => {
          clearInterval(timerRef.current);
          setIsRunning(false);
          resetTimerForCurrentMode();
        }
      );
      return;
    }
    
    resetTimerForCurrentMode();
  };

  const changeMode = (newMode) => {
    if (isRunning) {
      showConfirm(
        'Timer is currently running. Change mode and reset timer?',
        () => {
          setMode(newMode);
          stopTimer();
          resetTimerForCurrentMode();
        }
      );
      return;
    }
    
    setMode(newMode);
    resetTimerForCurrentMode();
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const getModeColor = () => {
    switch (mode) {
      case 'work': return 'bg-orange-100 border-orange-300';
      case 'shortBreak': return 'bg-green-100 border-green-300';
      case 'longBreak': return 'bg-blue-100 border-blue-300';
      default: return 'bg-orange-100 border-orange-300';
    }
  };

  const getModeTitle = () => {
    switch (mode) {
      case 'work': return 'Pomodoro - Work Session';
      case 'shortBreak': return 'Short Break';
      case 'longBreak': return 'Long Break';
      default: return 'Pomodoro Timer';
    }
  };

  return (
    <>
      <div className={`p-3 rounded-lg shadow mb-4 border ${getModeColor()} transition-colors duration-300`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{getModeTitle()}</h3>
          <div className="flex items-center">
            <div className="hidden sm:block mr-3 px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs font-medium text-gray-700 dark:text-gray-300">
              {mode === 'work' ? 'Focus time' : 'Break time'}
            </div>
            <button 
              onClick={() => setShowSettings(true)}
              className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
          <span className="inline-block mb-1 sm:mb-0 sm:mr-3"><span className="font-medium">Task:</span> <strong>{activity}</strong></span> 
          <span className="inline-block"><span className="font-medium">Cycle:</span> <span className="font-bold">{cycle}/{settings.cyclesBeforeLongBreak}</span></span>
        </p>
        
        <div className="flex justify-center mb-3">
          <div className="flex flex-wrap justify-center gap-2">
            <button 
              onClick={() => changeMode('work')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                mode === 'work' 
                  ? 'bg-orange-500 text-white dark:bg-orange-600' 
                  : 'bg-orange-200 text-orange-800 hover:bg-orange-300 dark:bg-orange-800 dark:text-orange-100 dark:hover:bg-orange-700'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Work
            </button>
            <button 
              onClick={() => changeMode('shortBreak')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                mode === 'shortBreak' 
                  ? 'bg-green-500 text-white dark:bg-green-600' 
                  : 'bg-green-200 text-green-800 hover:bg-green-300 dark:bg-green-800 dark:text-green-100 dark:hover:bg-green-700'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              Short Break
            </button>
            <button 
              onClick={() => changeMode('longBreak')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                mode === 'longBreak' 
                  ? 'bg-blue-500 text-white dark:bg-blue-600' 
                  : 'bg-blue-200 text-blue-800 hover:bg-blue-300 dark:bg-blue-800 dark:text-blue-100 dark:hover:bg-blue-700'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
              </svg>
              Long Break
            </button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="text-4xl font-mono font-bold text-gray-900 dark:text-gray-100 animate-pulse">
            {formatTime(timeRemaining)}
          </div>
          <div className="flex flex-wrap justify-center gap-2 w-full md:w-auto">
            <button 
              onClick={startTimer}
              disabled={isRunning}
              className={`${
                isRunning 
                  ? 'bg-green-300 dark:bg-green-700 cursor-not-allowed' 
                  : 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700'
              } text-white font-bold py-2 px-4 rounded transition-colors`}
              aria-label="Start timer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Start
            </button>
            <button 
              onClick={stopTimer}
              disabled={!isRunning}
              className={`${
                !isRunning 
                  ? 'bg-red-300 dark:bg-red-700 cursor-not-allowed' 
                  : 'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
              } text-white font-bold py-2 px-4 rounded transition-colors`}
              aria-label="Stop timer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Pause
            </button>
            <button 
              onClick={resetTimer}
              className="bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors"
              aria-label="Reset timer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Reset
            </button>
            <button 
              onClick={onClose}
              className="bg-gray-400 hover:bg-gray-500 dark:bg-gray-500 dark:hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors"
              aria-label="Close pomodoro timer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Close
            </button>
          </div>
        </div>
        
        <div className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
          {mode === 'work' ? 
            `Focus on your task for ${settings.workDuration} minutes` : 
            mode === 'shortBreak' ? 
              `Take a ${settings.shortBreakDuration} minute break` : 
              `Take a longer ${settings.longBreakDuration} minute break to recharge`
          }
        </div>
        
        {/* Progress visualization - only show for active timer */}
        {isRunning && (
          <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <div 
              className={`h-2.5 rounded-full transition-all duration-300 ${
                mode === 'work' 
                  ? 'bg-orange-500 dark:bg-orange-600' 
                  : mode === 'shortBreak'
                    ? 'bg-green-500 dark:bg-green-600'
                    : 'bg-blue-500 dark:bg-blue-600'
              }`} 
              style={{ 
                width: `${
                  mode === 'work'
                    ? (timeRemaining / (settings.workDuration * 60)) * 100
                    : mode === 'shortBreak'
                      ? (timeRemaining / (settings.shortBreakDuration * 60)) * 100
                      : (timeRemaining / (settings.longBreakDuration * 60)) * 100
                }%` 
              }}
            ></div>
          </div>
        )}
      </div>
      
      {showSettings && (
        <PomodoroSettingsModal onClose={() => setShowSettings(false)} />
      )}
    </>
  );
};

export default EnhancedPomodoroTimer;