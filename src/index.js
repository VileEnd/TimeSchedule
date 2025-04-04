import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import './styles/index.css';

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = `${window.location.origin}/service-worker.js`;
    navigator.serviceWorker.register(swUrl)
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
        
        // Listen for messages from the service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'PERSIST_AI_NOTIFICATION') {
            // Store notification data in localStorage for persistence
            localStorage.setItem('pendingAINotification', JSON.stringify({
              message: event.data.message,
              totalBlocksAdded: event.data.totalBlocksAdded,
              timestamp: event.data.timestamp
            }));
          }
        });
      })
      .catch(error => {
        console.error('ServiceWorker registration failed: ', error);
      });
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);