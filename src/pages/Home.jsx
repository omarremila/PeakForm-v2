// src/pages/Home.jsx
import { Link } from 'react-router-dom';
import './Home.css';

const FEATURES = [
  {
    title: 'Live pose tracking',
    body: 'MediaPipe tracks 33 points on your body through your webcam, right in the browser — no wearables, nothing uploaded.',
  },
  {
    title: 'Spoken feedback',
    body: "Miss depth, lean too far forward, let your knees cave in — you'll hear about it the moment it happens, not after the set.",
  },
  {
    title: 'Automatic rep counting',
    body: 'No tapping a screen between reps. PeakForm counts as you move and grades each one on the way back up.',
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Choose an exercise',
    body: 'Pick from the workout list to open its live-camera form check.',
  },
  {
    number: '02',
    title: 'Turn side-on to the camera',
    body: 'Stand a few feet back so your shoulder, hip, knee, and ankle are all visible in profile.',
  },
  {
    number: '03',
    title: 'Move, and listen',
    body: 'Squat as usual. PeakForm counts the rep and speaks a correction the instant it sees one.',
  },
];

export default function Home() {
  return (
    <div className="home">
      <section className="home-hero">
        <div className="home-hero-content">
          <span className="home-eyebrow">AI-powered form coach</span>
          <h1 className="home-title">
            Perfect your form.
            <br />
            Live, on camera.
          </h1>
          <p className="home-subtitle">
            PeakForm watches your reps through your webcam, counts them, and tells you out
            loud what to fix &mdash; depth, lean, tempo &mdash; the moment it happens.
          </p>
          <div className="home-cta-row">
            <Link to="/choose-workout" className="home-cta-primary">
              Start a workout
            </Link>
            <a href="#how-it-works" className="home-cta-secondary">
              See how it works
            </a>
          </div>
        </div>

        <div className="home-hero-graphic" aria-hidden="true">
          <div className="home-hero-glow" />
          <svg viewBox="0 0 360 420" className="home-hero-svg">
            <defs>
              <clipPath id="scan-clip">
                <rect x="90" y="70" width="170" height="340" rx="12" />
              </clipPath>
            </defs>

            <polyline
              className="home-skeleton-line"
              points="150,395 195,395"
            />
            <polyline
              className="home-skeleton-line"
              points="150,395 210,300 140,210 220,110"
            />
            <line className="home-skeleton-line" x1="220" y1="110" x2="234" y2="86" />
            <circle cx="234" cy="86" r="17" className="home-skeleton-line" fill="none" />

            <line
              className="home-scan-line"
              x1="90"
              y1="90"
              x2="260"
              y2="90"
              clipPath="url(#scan-clip)"
            />

            <path className="home-decorative-arc" d="M 158 232 A 30 30 0 0 1 178 258" />
            <path className="home-decorative-arc" d="M 176 168 A 30 30 0 0 1 176 198" />

            <circle className="home-joint" cx="150" cy="395" r="6" style={{ animationDelay: '0s' }} />
            <circle className="home-joint" cx="210" cy="300" r="6" style={{ animationDelay: '0.2s' }} />
            <circle className="home-joint" cx="140" cy="210" r="6" style={{ animationDelay: '0.4s' }} />
            <circle className="home-joint" cx="220" cy="110" r="6" style={{ animationDelay: '0.6s' }} />
          </svg>
        </div>
      </section>

      <section className="home-features">
        <h2 className="home-section-title">What it actually does</h2>
        <div className="home-feature-grid">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="home-feature-card">
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="home-how" id="how-it-works">
        <h2 className="home-section-title">How it works</h2>
        <ol className="home-steps">
          {STEPS.map((step) => (
            <li key={step.number} className="home-step">
              <span className="home-step-number">{step.number}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="home-final-cta">
        <h2>Ready to check your form?</h2>
        <Link to="/choose-workout" className="home-cta-primary">
          Choose a workout
        </Link>
      </section>
    </div>
  );
}