import React, { useState, useEffect, useRef } from 'react';
import { useNotification } from '../context/NotificationContext.js';

const PomodoroTimer = ({ activity, onClose }) => {
  const { showSuccess, showConfirm } = useNotification();
  const [timeRemaining, setTimeRemaining] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);
  const POMODORO_DEFAULT_MINUTES = 25;

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startTimer = () => {
    if (isRunning) return;
    
    setIsRunning(true);
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Timer finished
          clearInterval(timerRef.current);
          setIsRunning(false);
          // Using notification system instead of native alert
          showSuccess(`Pomodoro for "${activity}" finished! Time for a break!`);
          return POMODORO_DEFAULT_MINUTES * 60;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (!isRunning) return;
    
    clearInterval(timerRef.current);
    setIsRunning(false);
  };

  const resetTimer = () => {
    if (isRunning) {
      // Using notification system for confirmation instead of native confirm
      showConfirm(
        `Timer for "${activity}" is running. Are you sure you want to reset it?`,
        () => {
          clearInterval(timerRef.current);
          setIsRunning(false);
          setTimeRemaining(POMODORO_DEFAULT_MINUTES * 60);
        }
      );
      return;
    }
    
    setTimeRemaining(POMODORO_DEFAULT_MINUTES * 60);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  return (
    <div className="bg-orange-100 border border-orange-300 p-3 rounded-lg shadow mb-4">
      <h3 className="text-lg font-semibold text-orange-800 mb-2">Pomodoro Timer</h3>
      <p className="text-sm text-orange-700 mb-2">For: <strong>{activity}</strong></p>
      <div className="flex items-center justify-center space-x-4 flex-wrap">
        <div className="text-4xl font-mono font-bold text-orange-900 mb-2 sm:mb-0">
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
            } text-white font-bold py-2 px-4 rounded`}
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
            } text-white font-bold py-2 px-4 rounded`}
          >
            Stop
          </button>
          <button 
            onClick={resetTimer}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
          >
            Reset
          </button>
          <button 
            onClick={onClose}
            className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;