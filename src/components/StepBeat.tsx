import "./StepBeat.css";

export type StepBeatTone = "good" | "warn" | "done";

interface StepBeatProps {
  tone: StepBeatTone;
  title: string;
  detail?: string;
  /** What starts next ("Next: Rep 2 of 3 · from the start"); absent at the end. */
  next?: string;
  tapHint: string;
  durationMs: number;
  onSkip: () => void;
}

// The card over the board between Adım Adım runs. Without it the board just
// snapped back to move one halfway through the opening, which reads as a
// bug to anyone who doesn't already know the rules. It says what the run
// counted as and what comes next, with a bar running down to the restart;
// a tap anywhere skips the wait. It lies over the board rather than above or
// below it, so nothing on the page shifts under the trainee's finger.
export function StepBeat({ tone, title, detail, next, tapHint, durationMs, onSkip }: StepBeatProps) {
  return (
    <button type="button" className={`step-beat step-beat-${tone}`} onClick={onSkip}>
      <span className="step-beat-card" aria-live="polite">
        <span className="step-beat-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              {tone === "warn" ? (
                <>
                  <path d="M12 6.5v7" />
                  <path d="M12 17.5v.01" />
                </>
              ) : tone === "done" ? (
                <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
              ) : (
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              )}
            </g>
          </svg>
        </span>
        <span className="step-beat-title">{title}</span>
        {detail && <span className="step-beat-detail">{detail}</span>}
        {next && (
          <span className="step-beat-next">
            {/* The toolbar's restart icon: "from the start" means the same
                thing in both places. */}
            <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
              <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </g>
            </svg>
            {next}
          </span>
        )}
        <span className="step-beat-tap">{tapHint}</span>
        <span className="step-beat-timer" style={{ animationDuration: `${durationMs}ms` }} aria-hidden="true" />
      </span>
    </button>
  );
}
