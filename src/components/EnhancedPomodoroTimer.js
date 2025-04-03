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
    
    // Setup audio (note: in a real app, you'd need actual sound files)
    // This is a placeholder - in production you would add these sound files
    audioRef.current = new Audio(); // Placeholder for audio
    audioRef.current.volume = settings.alarmVolume;
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
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
          
          // Play sound (commented since we don't have actual audio files)
          // if (audioRef.current) {
          //   audioRef.current.play();
          // }
          
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
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-800">{getModeTitle()}</h3>
          <button 
            onClick={() => setShowSettings(true)}
            className="text-gray-600 hover:text-gray-800"
            aria-label="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <p className="text-sm text-gray-700 mb-2">
          Task: <strong>{activity}</strong> • 
          Cycle: <span className="font-medium">{cycle}/{settings.cyclesBeforeLongBreak}</span>
        </p>
        
        <div className="flex justify-center mb-3">
          <div className="flex space-x-2">
            <button 
              onClick={() => changeMode('work')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                mode === 'work' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-orange-200 text-orange-800 hover:bg-orange-300'
              }`}
            >
              Work
            </button>
            <button 
              onClick={() => changeMode('shortBreak')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                mode === 'shortBreak' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-green-200 text-green-800 hover:bg-green-300'
              }`}
            >
              Short Break
            </button>
            <button 
              onClick={() => changeMode('longBreak')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                mode === 'longBreak' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-blue-200 text-blue-800 hover:bg-blue-300'
              }`}
            >
              Long Break
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-center space-x-4 flex-wrap">
          <div className="text-4xl font-mono font-bold text-gray-900 mb-2 sm:mb-0 animate-pulse">
            {formatTime(timeRemaining)}
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={startTimer}
              disabled={isRunning}
              className={`${
                isRunning 
                  ? 'bg-green-300 cursor-not-allowed' 
                  : 'bg-green-500 hover:bg-green-600'
              } text-white font-bold py-2 px-4 rounded transition-colors`}
              aria-label="Start timer"
            >
              Start
            </button>
            <button 
              onClick={stopTimer}
              disabled={!isRunning}
              className={`${
                !isRunning 
                  ? 'bg-red-300 cursor-not-allowed' 
                  : 'bg-red-500 hover:bg-red-600'
              } text-white font-bold py-2 px-4 rounded transition-colors`}
              aria-label="Stop timer"
            >
              Pause
            </button>
            <button 
              onClick={resetTimer}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors"
              aria-label="Reset timer"
            >
              Reset
            </button>
            <button 
              onClick={onClose}
              className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors"
              aria-label="Close pomodoro timer"
            >
              Close
            </button>
          </div>
        </div>
        
        <div className="mt-3 text-center text-xs text-gray-500">
          {mode === 'work' ? 
            `Focus on your task for ${settings.workDuration} minutes` : 
            mode === 'shortBreak' ? 
              `Take a ${settings.shortBreakDuration} minute break` : 
              `Take a longer ${settings.longBreakDuration} minute break to recharge`
          }
        </div>
      </div>
      
      {showSettings && (
        <PomodoroSettingsModal onClose={() => setShowSettings(false)} />
      )}
    </>
  );
};

export default EnhancedPomodoroTimer;