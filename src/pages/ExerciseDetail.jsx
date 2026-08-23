// src/pages/ExerciseDetail.jsx
import { useParams, Link } from 'react-router-dom';
import LiveCamera from '../components/LiveCamera';

const SUPPORTED_EXERCISES = new Set(['squat']);

export default function ExerciseDetail() {
  const { exerciseId } = useParams();

  if (!SUPPORTED_EXERCISES.has(exerciseId)) {
    return (
      <div style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
        <h2>{exerciseId}</h2>
        <p>Live camera form check for this exercise is coming soon.</p>
        <Link to="/choose-workout">&larr; Back to Choose Workout</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem 1rem' }}>
      <h2 style={{ textAlign: 'center' }}>Squat</h2>
      <p
        style={{
          maxWidth: 480,
          margin: '0 auto 1.5rem',
          textAlign: 'center',
          color: '#c9b8e0',
        }}
      >
     Turn so your <strong>left side</strong> faces the camera, standing a few feet back so
  your shoulder, hip, knee, and ankle are all visible in profile. Press Start Camera and
  begin squatting.
</p>
      <LiveCamera exerciseId={exerciseId} />
    </div>
  );
}