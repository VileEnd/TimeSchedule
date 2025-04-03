# TimeSchedule Project Guidelines

## Project Overview
Simple interactive weekly schedule viewer built with HTML, JavaScript, and TailwindCSS.

## Commands
- **Run locally**: Open index.html in a browser
- **Testing**: No formal testing framework implemented
- **Linting**: No formal linting setup

## Code Style Guidelines

### JavaScript
- Use camelCase for variables, functions, and methods
- Use meaningful function and variable names
- Structure code with clear sections using comments (e.g. "// === UI RENDERING & TAB HANDLING ===")
- Prefer arrow functions for callbacks
- Use async/await for asynchronous operations
- Use try/catch blocks for error handling

### HTML/CSS
- Use TailwindCSS utility classes for styling
- Follow BEM-like naming convention for custom CSS classes
- Structure HTML with semantic elements
- Use data attributes for JavaScript interactions (e.g. data-day, data-item-id)

### Data Management
- Use localStorage for persistent storage
- Validate data before processing
- Follow JSON structure with proper nesting
- Include error handling for data operations

### UI Components
- Maintain modal pattern for forms
- Use consistent color coding based on activity type
- Implement responsive design for mobile and desktop

### Features
- Schedule display with drag-and-drop reordering
- Pomodoro timer integration
- ICS calendar export
- JSON import/export