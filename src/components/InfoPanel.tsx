import type { TrainerMode } from "../hooks/useOpeningTrainer";
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
  t: Dictionary;
  onRestart: () => void;
  onNextLine: () => void;
  onExtend: () => void;
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
  t,
  onRestart,
  onNextLine,
  onExtend,
}: InfoPanelProps) {
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

      {isDone && (
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
