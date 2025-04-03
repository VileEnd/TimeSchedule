# TimeSchedule - Interactive Weekly Schedule

An interactive weekly schedule application built with React and TailwindCSS.

## Features

- View and manage your weekly schedule with an intuitive interface
- Drag-and-drop reordering of activities
- Pomodoro timer integration for focused work sessions
- Save schedules to local browser storage
- Import/export schedule data as JSON
- Export schedule to ICS calendar format
- Color coding of different activity types
- Mobile-friendly responsive design
- AI-powered schedule generation:
  - Text description to schedule
  - Calendar URL import
  - Learning science optimization

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm start
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

### Local Deployment

1. Create a production build:
   ```
   npm run build
   ```

2. Serve the production build locally:
   ```
   npm run serve
   ```

3. Access the app at [http://localhost:3000](http://localhost:3000)

### GitHub Pages Deployment

#### Automatic Deployment (GitHub Actions)

The project is set up with GitHub Actions to automatically deploy to GitHub Pages when you push to the main branch.

1. Push your changes to the main branch:
   ```
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

2. GitHub Actions will automatically build and deploy your app to GitHub Pages.

3. Access your deployed app at: `https://[your-github-username].github.io/TimeSchedule`

#### Manual Deployment

You can also manually deploy to GitHub Pages:

1. Build and deploy with a single command:
   ```
   npm run deploy
   ```

2. Access your deployed app at: `https://[your-github-username].github.io/TimeSchedule`

## Usage

- Click on the day tabs to view different days
- Click "Add Activity" to add new activities to your schedule
- Use the edit and delete buttons to modify or remove activities
- Drag items to reorder them within the day
- Activities with "Pomodoro" in their details will have a Pomodoro timer button
- Save your schedule to browser storage with the save button
- Export your schedule as JSON for backup
- Generate an ICS file for importing into calendar applications

## AI Features

The application includes AI-powered scheduling that can:

1. Generate schedules from text descriptions - provide a natural language description of your schedule
2. Import and process calendar data from public iCal URLs
3. Optimize study schedules using learning science principles like spaced repetition

To use these features, you'll need an OpenAI API key.

## Notes for GitHub Pages Deployment

- The app is configured to run on the path `/TimeSchedule/`
- Base href is dynamically set during build using the PUBLIC_URL environment variable
- The GitHub workflow automatically handles deployment to gh-pages branch

## Technology Stack

- React - Front-end framework
- TailwindCSS - Utility-first CSS framework
- SortableJS (via react-sortablejs) - Drag-and-drop functionality
- Context API - State management
- ES Modules - JavaScript module system
- OpenAI API - AI-powered scheduling features

## Project Structure

- `/src/components` - React components
- `/src/context` - Context for state management
- `/src/data` - Default schedule data
- `/src/styles` - CSS and TailwindCSS styling
- `/src/utils.js` - Utility functions for time calculations, etc.
- `/src/services` - API integrations (OpenAI)

## License

This project is open source and available under the MIT License.