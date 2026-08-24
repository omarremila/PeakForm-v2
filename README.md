# PeakForm Coach

PeakForm Coach is a React fitness application designed to help users improve their exercise technique through real-time pose tracking and form feedback.

The project currently provides a workout-selection interface and individual exercise pages. Live camera-based form analysis is being developed, beginning with squats.

## Features

- Modern, responsive fitness interface
- Workout selection for multiple exercises
- Dynamic exercise pages using React Router
- Dedicated live-camera component for supported exercises
- Clear fallback pages for exercises still in development

## Supported Exercises

Form analysis is currently being developed for:

- Squats

Planned exercises include:

- Bicep curls
- Push-ups
- Lunges
- Shoulder press
- Deadlifts
- Bench press

## Tech Stack

- React
- Vite
- React Router
- JavaScript
- CSS
- MediaPipe Pose _(planned for pose detection and form analysis)_

## Getting Started

### Prerequisites

Install [Node.js](https://nodejs.org/) before running the project.

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/omarremila/PeakForm-v2.git
   ```

2. Open the project folder:

   ```bash
   cd PeakForm-v2
   ```

3. Install the dependencies:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open the local address shown in the terminal, usually `http://localhost:5173`.

## Project Structure

```text
src/
├── assets/
├── components/
│   ├── Header.jsx
│   └── LiveCamera.jsx
├── pages/
│   ├── Home.jsx
│   ├── ChooseWorkout.jsx
│   └── ExerciseDetail.jsx
├── App.jsx
└── main.jsx
```

## How It Works

1. The user selects an exercise.
2. React Router opens the corresponding exercise page.
3. Supported exercises load the live-camera component.
4. The planned pose-detection system will identify body landmarks, calculate joint angles, and provide form feedback.

## Roadmap

- Integrate MediaPipe Pose with the live camera
- Calculate joint angles from detected landmarks
- Add real-time squat feedback and repetition counting
- Add form analysis for more exercises
- Improve mobile responsiveness and accessibility
- Deploy the application publicly

## Privacy

The planned form-analysis feature is intended to process camera frames locally in the browser. Camera access will require the user’s permission.

## Author

**Omar Remila**

- [GitHub](https://github.com/omarremila)

## License

This project does not currently specify a license.
