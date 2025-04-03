# Migration Guide - TimeSchedule Application

This document guides you through the migration process from the original HTML/JS application to the new React-based version.

## What's Changed

The TimeSchedule application has been migrated from a vanilla JavaScript/HTML application to a modern React application. The key changes include:

- Conversion to a component-based architecture using React
- State management using React Context API
- Improved project structure with clearer separation of concerns
- Same functionality as the original application
- Maintained the same visual design and user experience

## How to Run the New Application

### Prerequisites

- Node.js (v14.0.0 or later) and npm installed on your system
- Basic familiarity with React

### Installation Steps

1. Navigate to the project directory:
   ```
   cd TimeSchedule
   ```

2. Install the required dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. The application should open in your default browser at http://localhost:3000

### Building for Production

If you want to create a production build:

1. Run the build command:
   ```
   npm run build
   ```

2. The built files will be located in the `/build` directory
   
3. You can serve these files using any static file server

## Project Structure Overview

- `/src` - Contains all source code
  - `/components` - React components for UI elements
  - `/context` - Context providers for state management
  - `/data` - JSON data files
  - `/styles` - CSS files
  - `App.js` - Main application component
  - `index.js` - Application entry point
  - `utils.js` - Utility functions

## Data Migration

The application continues to use the same JSON format for schedule data. Your existing data can be imported into the new application using the "Upload JSON" button in the header.

## Differences from Original Version

- The new version uses React's component-based architecture for better maintainability
- State management is handled through React Context API
- Added separation of concerns with utilities, components, and context
- No changes to core functionality or the user interface

## Troubleshooting

If you encounter any issues:

1. Make sure all dependencies are correctly installed with `npm install`
2. Check the browser console for any error messages
3. Ensure Node.js version is v14.0.0 or later
4. Clear browser cache if you see unexpected behavior