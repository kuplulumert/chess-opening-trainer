import { useEffect, useRef } from "react";
import { isStepMode, type TrainerMode } from "../hooks/useOpeningTrainer";
import type { Dictionary } from "../i18n/translations";
import { MovePurpose } from "./MovePurpose";

interface InfoPanelProps {
  mode: TrainerMode;
  moveIndex: number;
  isDone: boolean;
  currentComment: string | null;
  isPlayerTurn: boolean;
  canExtend: boolean;
  whiteStrategy: string | null;
  blackStrategy: string | null;
  /** Adım Adım: every stage passed. Each of its runs ends "done" on its own,
   *  so `isDone` alone would flash the finish card after every run. */
  stepsFinished: boolean;
  /** Which finish this is: the line just learned, a learned line
   *  refreshed, or the chunked mode through every stage — not learned yet,
   *  since its runs never covered the line from the start. */
  stepsOutcome: "learned" | "refreshed" | "done";
  t: Dictionary;
  onRestart: () => void;
  onNextLine: () => void;
  onExtend: () => void;
  onGoToPractice: () => void;
}

// Hidden per request — kept in place (component and props untouched) in
// case it comes back later, just not rendered for now.
const SHOW_MOVE_HINT = false;

// Everything under the board has to share one screen with it, so this is
// only what the trainee is actually reading: what each side is doing, and
// — once the line is finished — where to go next. The move counter, the
// "your move" line and the played-moves list are all things the board
// itself already shows.
export function InfoPanel({
  mode,
  moveIndex,
  isDone,
  currentComment,
  isPlayerTurn,
  canExtend,
  whiteStrategy,
  blackStrategy,
  stepsFinished,
  stepsOutcome,
  t,
  onRestart,
  onNextLine,
  onExtend,
  onGoToPractice,
}: InfoPanelProps) {
  const showFinishCard = isStepMode(mode) ? stepsFinished : isDone;

  // Finishing a line adds a third card to a panel sized for two, so the
  // "what next" buttons start out below the fold. Bring them into view
  // rather than making the trainee find them.
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!showFinishCard) return;
    const panel = panelRef.current;
    if (panel) panel.scrollTo({ top: panel.scrollHeight, behavior: "smooth" });
  }, [showFinishCard]);

  return (
    <aside className="info-panel" ref={panelRef}>
      {SHOW_MOVE_HINT && (
        <MovePurpose
          comment={currentComment}
          moveIndex={moveIndex}
          awaitingMove={isPlayerTurn}
          title={t.moveHintTitle}
        />
      )}

      {whiteStrategy && (
        <div className="info-card strategy-card-white">
          <h3 className="moves-title">{t.white}</h3>
          <p className="strategy-text">{whiteStrategy}</p>
        </div>
      )}
      {blackStrategy && (
        <div className="info-card strategy-card-black">
          <h3 className="moves-title">{t.black}</h3>
          <p className="strategy-text">{blackStrategy}</p>
        </div>
      )}

      {isStepMode(mode)
        ? stepsFinished && (
            <div className="info-card">
              <p className="status-line status-done">
                {stepsOutcome === "learned"
                  ? t.steps.learned
                  : stepsOutcome === "done"
                    ? t.steps.stepsDone
                    : t.steps.refreshed}
              </p>
              <div className="button-row">
                <button type="button" className="secondary-button" onClick={onGoToPractice}>
                  {t.steps.toPractice}
                </button>
                <button type="button" className="secondary-button" onClick={onNextLine}>
                  {t.nextOpening}
                </button>
              </div>
            </div>
          )
        : isDone && (
            <div className="info-card">
              <p className="status-line status-done">{t.lineComplete(mode)}</p>
              <div className="button-row">
                <button type="button" className="secondary-button" onClick={onRestart}>
                  {t.playAgain}
                </button>
                <button type="button" className="secondary-button" onClick={onNextLine}>
                  {t.nextOpening}
                </button>
              </div>
              {canExtend && (
                <div className="extend-offer">
                  <p className="extend-offer-text">{t.extendPrompt}</p>
                  <button type="button" className="secondary-button" onClick={onExtend}>
                    {t.extendButton}
                  </button>
                </div>
              )}
            </div>
          )}
    </aside>
  );
}
