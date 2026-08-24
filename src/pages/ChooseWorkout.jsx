// src/pages/ChooseWorkout.jsx
import { Link } from 'react-router-dom';
import './ChooseWorkout.css';

const EXERCISES = [
  { id: 'squat', name: 'Squat', muscleGroup: 'Legs' },
  { id: 'bicep-curl', name: 'Bicep Curl', muscleGroup: 'Arms' },
  { id: 'pushups', name: 'Push-Ups', muscleGroup: 'Chest' },
  { id: 'lunges', name: 'Lunges', muscleGroup: 'Legs' },
  { id: 'shoulder-press', name: 'Shoulder Press', muscleGroup: 'Shoulders' },
  
];

export default function ChooseWorkout() {
  return (
    <div className="choose-workout">
      <h2 className="choose-workout-title">Choose Your Workout</h2>
      <p className="choose-workout-subtitle">
        Pick an exercise to start a live-camera form check.
      </p>

      <div className="exercise-grid">
        {EXERCISES.map((exercise) => (
          <Link
            key={exercise.id}
            to={`/exercise/${exercise.id}`}
            className="exercise-card"
          >
            <span className="exercise-name">{exercise.name}</span>
            <span className="exercise-muscle-group">{exercise.muscleGroup}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}