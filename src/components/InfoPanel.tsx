import { useEffect, useRef } from "react";
import type { MoveFeedback, PlayerColor, TrainerMode } from "../hooks/useOpeningTrainer";
import type { Dictionary } from "../i18n/translations";
import { MovePurpose } from "./MovePurpose";

interface InfoPanelProps {
  playerColor: PlayerColor;
  mode: TrainerMode;
  history: string[];
  moveIndex: number;
  totalMoves: number;
  isDone: boolean;
  feedback: MoveFeedback;
  wrongAttempts: number;
  revealedHint: string | null;
  currentComment: string | null;
  isPlayerTurn: boolean;
  canExtend: boolean;
  whiteStrategy: string | null;
  blackStrategy: string | null;
  t: Dictionary;
  onRestart: () => void;
  onNextLine: () => void;
  onExtend: () => void;
  /** Jump to the position after the first `plies` moves of the line. */
  onGoTo: (plies: number) => void;
}

// Hidden per request — kept in place (component and props untouched) in
// case it comes back later, just not rendered for now.
const SHOW_MOVE_HINT = false;

export function InfoPanel({
  playerColor,
  mode,
  history,
  moveIndex,
  totalMoves,
  isDone,
  feedback,
  wrongAttempts,
  revealedHint,
  currentComment,
  isPlayerTurn,
  canExtend,
  whiteStrategy,
  blackStrategy,
  t,
  onRestart,
  onNextLine,
  onExtend,
  onGoTo,
}: InfoPanelProps) {
  const progressPercent = totalMoves === 0 ? 0 : Math.round((moveIndex / totalMoves) * 100);
  const colorLabel = playerColor === "w" ? t.white : t.black;

  // Study mode already highlights the move on the board — spelling it out
  // here as well was just the same information twice.
  const hintText = mode === "quiz" ? revealedHint : null;

  let statusText: string;
  if (isDone) statusText = t.lineComplete(mode);
  else if (!isPlayerTurn) statusText = t.replayingLine;
  else statusText = feedback === "wrong" ? t.notQuite : t.yourMove(colorLabel);

  // Keep the newest move in view as the strip grows.
  const stripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const strip = stripRef.current;
    if (strip) strip.scrollLeft = strip.scrollWidth;
  }, [history.length]);

  return (
    <aside className="info-panel">
      {SHOW_MOVE_HINT && (
        <MovePurpose
          comment={currentComment}
          moveIndex={moveIndex}
          awaitingMove={isPlayerTurn}
          title={t.moveHintTitle}
        />
      )}

      {/* The teaching content comes first: what each side is doing, right
          under the board. Settings now live in the board header. */}
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

      <div className="info-card session-card">
        <div className="progress-track" aria-hidden="true">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="status-row">
          <span className="progress-label">
            {t.progressLabel(Math.min(moveIndex, totalMoves), totalMoves)}
          </span>
          <span className={"status-line" + (isDone ? " status-done" : "")}>{statusText}</span>
        </div>
        {hintText && (
          <p className="hint-line">
            {t.hintLabel} <strong>{hintText}</strong>
          </p>
        )}
        {!isDone && isPlayerTurn && wrongAttempts > 0 && !hintText && (
          <p className="hint-line hint-line-muted">{t.wrongAttempts(wrongAttempts)}</p>
        )}

        {isDone && (
          <div className="button-row">
            <button type="button" className="secondary-button" onClick={onRestart}>
              {t.playAgain}
            </button>
            <button type="button" className="secondary-button" onClick={onNextLine}>
              {t.nextOpening}
            </button>
          </div>
        )}
        {isDone && canExtend && (
          <div className="extend-offer">
            <p className="extend-offer-text">{t.extendPrompt}</p>
            <button type="button" className="secondary-button" onClick={onExtend}>
              {t.extendButton}
            </button>
          </div>
        )}

        {history.length > 0 && (
          <>
            <div className="session-divider" />
            {/* Played moves as tappable pills; the last one is the current
                position. Only what's been played — the rest of the line
                stays hidden so Practice mode stays a test. */}
            <div className="moves-strip" ref={stripRef} aria-label={t.movesHeading}>
              {history.map((san, i) => (
                <span key={i} className="move-item">
                  {i % 2 === 0 && <span className="move-number">{i / 2 + 1}.</span>}
                  <button
                    type="button"
                    className={"move-pill" + (i === history.length - 1 ? " move-pill-active" : "")}
                    onClick={() => onGoTo(i + 1)}
                  >
                    {san}
                  </button>
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
