import type { TrainerMode } from "../hooks/useOpeningTrainer";
import "./StepBeat.css";
import "./ModeIntro.css";

interface ModeOption {
  mode: TrainerMode;
  name: string;
  description: string;
}

interface ModeIntroProps {
  title: string;
  options: ModeOption[];
  /** What the line opens in anyway: Adım Adım until learned, Practice after. */
  recommended: TrainerMode;
  recommendedLabel: string;
  onPick: (mode: TrainerMode) => void;
}

// Over the board before every opening: what each mode does, one short line
// each, and tapping one starts the line in it — choosing costs one tap. The
// options keep the header picker's order so each mode always sits in the
// same place; the recommended one is marked rather than moved to the top.
export function ModeIntro({ title, options, recommended, recommendedLabel, onPick }: ModeIntroProps) {
  return (
    <div className="mode-intro" role="dialog" aria-modal="true" aria-labelledby="mode-intro-title">
      <div className="step-beat-card mode-intro-card">
        <h3 id="mode-intro-title" className="step-beat-title">
          {title}
        </h3>
        <div className="mode-intro-options">
          {options.map((option) => {
            const isRecommended = option.mode === recommended;
            return (
              <button
                key={option.mode}
                type="button"
                className={
                  "mode-intro-option" + (isRecommended ? " mode-intro-option-recommended" : "")
                }
                onClick={() => onPick(option.mode)}
              >
                <span className="mode-intro-option-text">
                  <span className="mode-intro-option-head">
                    <span className="mode-intro-option-name">{option.name}</span>
                    {isRecommended && <span className="mode-intro-badge">{recommendedLabel}</span>}
                  </span>
                  <span className="mode-intro-option-desc">{option.description}</span>
                </span>
                <svg className="mode-intro-chevron" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
