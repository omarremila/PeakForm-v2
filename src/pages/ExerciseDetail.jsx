// src/pages/ExerciseDetail.jsx
import { useParams, Link } from 'react-router-dom';
import LiveCamera from '../components/LiveCamera';

const EXERCISES = {
  squat: {
    label: 'Squat',
    instructions:
      "Turn so either side faces the camera, standing a few feet back so your shoulder, " +
      'hip, knee, and ankle are all visible in profile. Press Start Camera and begin squatting.',
  },
  'bicep-curl': {
    label: 'Bicep Curl',
    instructions:
      'Turn so either side faces the camera, standing a few feet back so your shoulder, ' +
      'elbow, and wrist are all visible in profile. Press Start Camera and begin curling.',
  },
  pushups: {
    label: 'Push-Ups',
    instructions:
      'Get into plank position side-on to the camera, far enough back that your shoulder, ' +
      'elbow, wrist, hip, and ankle are all visible. Press Start Camera and begin.',
  },
  lunges: {
    label: 'Lunges',
    instructions:
      'Turn so either side faces the camera, standing a few feet back so your hip, knee, ' +
      'and ankle are all visible in profile. Press Start Camera and begin lunging.',
  },
  'shoulder-press': {
    label: 'Shoulder Press',
    instructions:
      'Turn so either side faces the camera, standing a few feet back so your shoulder, ' +
      'elbow, wrist, hip, and knee are all visible. Press Start Camera and begin pressing.',
  },
};

export default function ExerciseDetail() {
  const { exerciseId } = useParams();
  const exercise = EXERCISES[exerciseId];

  if (!exercise) {
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
      <h2 style={{ textAlign: 'center' }}>{exercise.label}</h2>
      <p
        style={{
          maxWidth: 480,
          margin: '0 auto 1.5rem',
          textAlign: 'center',
          color: '#c9b8e0',
        }}
      >
        {exercise.instructions}
      </p>
      <LiveCamera exerciseId={exerciseId} />
    </div>
  );
}