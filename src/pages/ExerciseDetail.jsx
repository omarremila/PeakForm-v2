// src/pages/ExerciseDetail.jsx
import { useParams, Link } from 'react-router-dom';

export default function ExerciseDetail() {
  const { exerciseId } = useParams();

  return (
    <div style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
      <h2>{exerciseId}</h2>
      <p>Live camera form check for this exercise is coming soon.</p>
      <Link to="/choose-workout">&larr; Back to Choose Workout</Link>
    </div>
  );
}