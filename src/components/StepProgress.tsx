import type { Dictionary } from "../i18n/translations";
import "./StepProgress.css";

interface StepProgressProps {
  /** 0-based. */
  stage: number;
  stageCount: number;
  /** Whether the run in progress shows moves on the board (so doesn't count). */
  showsMoves: boolean;
  cleanRuns: number;
  runsToPass: number;
  /** The run in progress — "Intro run", "Rep 2 of 3" … — empty once finished. */
  runLabel: string;
  finished: boolean;
  status: string;
  t: Dictionary;
}

// Lives under the board, never above it: its text changes from run to run,
// and anything above the board that changes height moves the squares out
// from under the trainee's finger mid-run — the iOS "taps land a square too
// low" bug this app has already had to fight once.
export function StepProgress({
  stage,
  stageCount,
  showsMoves,
  cleanRuns,
  runsToPass,
  runLabel,
  finished,
  status,
  t,
}: StepProgressProps) {
  return (
    <section className="step-progress" aria-label={t.steps.title}>
      <div className="step-progress-head">
        <span className="step-progress-stage">
          {finished ? t.steps.finishedLabel : t.steps.stageLabel(stage + 1, stageCount)}
        </span>
        {runLabel && <span className="step-progress-run">{runLabel}</span>}
      </div>
      <div
        className="step-progress-pips"
        style={{ gridTemplateColumns: `repeat(${stageCount}, 1fr)` }}
        aria-hidden="true"
      >
        {Array.from({ length: stageCount }, (_, i) => (
          <span
            key={i}
            className={
              "step-pip" +
              (finished || i < stage ? " step-pip-done" : i === stage ? " step-pip-current" : "")
            }
          />
        ))}
      </div>
      <div className="step-progress-runs">
        <span
          className={"step-shown" + (showsMoves ? " step-shown-active" : "")}
          title={t.steps.shownRunLabel}
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" width="13" height="13">
            <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
            </g>
          </svg>
        </span>
        {Array.from({ length: runsToPass }, (_, i) => (
          <span key={i} className={"step-dot" + (i < cleanRuns ? " step-dot-on" : "")} aria-hidden="true" />
        ))}
        <p className="step-progress-status" aria-live="polite">
          {status}
        </p>
      </div>
    </section>
  );
}
