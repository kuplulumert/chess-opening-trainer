import "./StepBeat.css";
import "./StepWelcome.css";

interface StepWelcomeProps {
  title: string;
  body: string;
  steps: [string, string, string];
  startLabel: string;
  onStart: () => void;
}

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// One icon per rule: shown first, then replayed from the start, and what a
// mistake does.
const RULE_ICONS = [
  <g key="shown" {...stroke}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </g>,
  <g key="replay" {...stroke}>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </g>,
  <g key="mistake" {...stroke}>
    <path d="M12 6.5v7" />
    <path d="M12 17.5v.01" />
  </g>,
];

// Over the board the first time a line opens in Adım Adım, before anything
// is played. The mode sends the line back to move one again and again, and
// a trainee who hasn't been told that is right to think the board broke.
// Only the button dismisses it, so a stray tap can't skip the explanation.
export function StepWelcome({ title, body, steps, startLabel, onStart }: StepWelcomeProps) {
  return (
    <div className="step-welcome" role="dialog" aria-modal="true" aria-labelledby="step-welcome-title">
      <div className="step-beat-card step-welcome-card">
        <h3 id="step-welcome-title" className="step-beat-title">
          {title}
        </h3>
        <p className="step-welcome-body">{body}</p>
        <ol className="step-welcome-steps">
          {steps.map((text, i) => (
            <li key={i}>
              <span className="step-welcome-step-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="12" height="12">
                  {RULE_ICONS[i]}
                </svg>
              </span>
              {text}
            </li>
          ))}
        </ol>
        <button type="button" className="step-welcome-start" onClick={onStart}>
          {startLabel}
        </button>
      </div>
    </div>
  );
}
