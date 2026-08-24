// src/pages/Home.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

// Shared timing for the hero's squat-cycle SMIL animations: a real descent,
// a brief hold at depth, an ascent, and a brief hold standing before the
// next rep -- eased in/out rather than linear so it doesn't feel mechanical.
const SQUAT_TIMING = {
  dur: '3.5s',
  repeatCount: 'indefinite',
  calcMode: 'spline',
  keyTimes: '0;0.4;0.5;0.9;1',
  keySplines: '0.4 0 0.2 1;0.42 0 0.58 1;0.4 0 0.2 1;0.42 0 0.58 1',
};

function SquatKeyframe({ attributeName, values }) {
  return <animate attributeName={attributeName} values={values} {...SQUAT_TIMING} />;
}

// CSS's prefers-reduced-motion query has no effect on SMIL <animate>
// elements -- it's a separate animation system -- so the squat-cycle
// keyframes are only rendered at all when motion isn't reduced. The
// skeleton then just holds its standing pose.
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event) => setReduced(event.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  return reduced;
}

const FEATURES = [
  {
  title: 'Live pose tracking',
  body: 'MediaPipe tracks 33 points across your body using just your webcam, giving you real-time form tracking right in your browser—no wearables, no extra setup, and nothing gets uploaded.',
},
{
  title: 'Spoken feedback',
  body: "Miss your depth, lean too far forward, or let your knees cave in? PeakForm calls it out the moment it happens, so you can fix your form right away instead of finding out after the set.",
},
{
  title: 'Automatic rep counting',
  body: 'Forget tapping your screen or trying to keep count mid-set. PeakForm automatically counts every rep as you move and checks your form on the way back up.',
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
    title: 'Turn side-on',
    body: 'Stand a few feet back so your shoulder, hip, knee, and ankle are all visible in profile.',
  },
  {
    number: '03',
    title: 'Move, and listen',
    body: 'PeakForm counts the rep and speaks a correction the instant it sees one.',
  },
];

export default function Home() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className="home">
      <section className="home-hero">
        <div className="home-scanlines" aria-hidden="true" />
        <div className="home-hero-bgtext" aria-hidden="true">151.5&deg;</div>

        <div className="home-hero-content">
          <div className="home-hud-row" aria-hidden="true">
            <span className="home-hud-tag">
              <span className="home-hud-dot" />
              POSE_TRACKING &middot; ACTIVE
            </span>
            <span className="home-hud-tag">33 LANDMARKS</span>
          </div>

          <span className="home-eyebrow">AI-powered form coach</span>
          <h1 className="home-title">
            <span className="home-title-line">Perfect your form.</span>
            <span className="home-title-line home-title-accent">Live, on camera.</span>
          </h1>
          <p className="home-subtitle">
            PeakForm watches your reps through your webcam, counts them in real time, 
            and gives you instant voice feedback on your depth, posture, 
            and tempo. So you can fix your form right away and make every rep count.
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
          <svg viewBox="0 0 360 420" className="home-hero-svg">
            <defs>
              <clipPath id="scan-clip">
                <rect x="80" y="60" width="190" height="350" rx="12" />
              </clipPath>
            </defs>

            {/*
              A squat cycle: standing -> bottom (brief hold) -> standing (brief
              hold), looping. Feet stay planted; hip, knee, and shoulder each
              move independently via SMIL <animate>, so the limbs actually
              bend instead of the whole figure sliding or pulsing in place.
              SquatKeyframe carries the shared timing (see SQUAT_TIMING) and
              is only rendered when the visitor hasn't asked for reduced
              motion -- CSS's prefers-reduced-motion query can't reach SMIL,
              so this guard has to happen in JS instead.
            */}
            <polyline className="home-skeleton-line" points="150,395 195,395" />
            <polyline className="home-skeleton-line" points="150,395 152,300 148,200 155,100">
              {!reducedMotion && (
                <SquatKeyframe
                  attributeName="points"
                  values="150,395 152,300 148,200 155,100;
                          150,395 215,300 145,285 225,145;
                          150,395 215,300 145,285 225,145;
                          150,395 152,300 148,200 155,100;
                          150,395 152,300 148,200 155,100"
                />
              )}
            </polyline>
            <line className="home-skeleton-line" x1="155" y1="100" x2="169" y2="76">
              {!reducedMotion && (
                <>
                  <SquatKeyframe attributeName="x1" values="155;225;225;155;155" />
                  <SquatKeyframe attributeName="y1" values="100;145;145;100;100" />
                  <SquatKeyframe attributeName="x2" values="169;239;239;169;169" />
                  <SquatKeyframe attributeName="y2" values="76;121;121;76;76" />
                </>
              )}
            </line>
            <circle cx="169" cy="76" r="17" className="home-skeleton-line" fill="none">
              {!reducedMotion && (
                <>
                  <SquatKeyframe attributeName="cx" values="169;239;239;169;169" />
                  <SquatKeyframe attributeName="cy" values="76;121;121;76;76" />
                </>
              )}
            </circle>

            <line
              className="home-scan-line"
              x1="80"
              y1="90"
              x2="270"
              y2="90"
              clipPath="url(#scan-clip)"
            />

            <circle className="home-joint" cx="150" cy="395" r="6" style={{ animationDelay: '0s' }} />
            <circle className="home-joint" cx="152" cy="300" r="6" style={{ animationDelay: '0.2s' }}>
              {!reducedMotion && <SquatKeyframe attributeName="cx" values="152;215;215;152;152" />}
            </circle>
            <circle className="home-joint" cx="148" cy="200" r="6" style={{ animationDelay: '0.4s' }}>
              {!reducedMotion && (
                <>
                  <SquatKeyframe attributeName="cx" values="148;145;145;148;148" />
                  <SquatKeyframe attributeName="cy" values="200;285;285;200;200" />
                </>
              )}
            </circle>
            <circle className="home-joint" cx="155" cy="100" r="6" style={{ animationDelay: '0.6s' }}>
              {!reducedMotion && (
                <>
                  <SquatKeyframe attributeName="cx" values="155;225;225;155;155" />
                  <SquatKeyframe attributeName="cy" values="100;145;145;100;100" />
                </>
              )}
            </circle>
          </svg>
        </div>
      </section>

      <section className="home-features">
        <span className="home-kicker">Capabilities</span>
        <h2 className="home-section-title">What it actually does</h2>
        <div className="home-feature-list">
          {FEATURES.map((feature, index) => (
            <div key={feature.title} className="home-feature-row">
              <span className="home-feature-num" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="home-feature-copy">
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="home-how" id="how-it-works">
        <span className="home-kicker">Process</span>
        <h2 className="home-section-title">How it works</h2>
        <div className="home-timeline">
          <svg
            className="home-timeline-line"
            viewBox="0 0 100 4"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <line x1="16" y1="2" x2="84" y2="2" />
          </svg>
          {STEPS.map((step) => (
            <div key={step.number} className="home-timeline-step">
              <span className="home-timeline-node">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="home-final-cta">
        <div className="home-final-cta-inner">
          <span className="home-kicker">Get started</span>
          <h2>Ready to check your form?</h2>
          <Link to="/choose-workout" className="home-cta-primary home-cta-large">
            Choose a workout
          </Link>
        </div>
      </section>
    </div>
  );
}