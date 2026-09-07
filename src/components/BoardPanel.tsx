import { useEffect, useMemo, useState } from "react";
import { Chess, type Square } from "chess.js";
import { Chessboard, type PieceDropHandlerArgs, type SquareHandlerArgs } from "react-chessboard";
import type { PlayerColor } from "../hooks/useOpeningTrainer";
import type { Dictionary } from "../i18n/translations";
import { preloadMoveSound } from "../utils/sound";

interface BoardPanelProps {
  fen: string;
  playerColor: PlayerColor;
  isPlayerTurn: boolean;
  feedback: "idle" | "correct" | "wrong";
  lastWrongSquares: { from: Square; to: Square } | null;
  hintSan: string | null;
  openingName: string;
  whiteStrategy: string | null;
  blackStrategy: string | null;
  canStepBack: boolean;
  canStepForward: boolean;
  t: Dictionary;
  onDrop: (from: Square, to: Square) => boolean;
  onStepBack: () => void;
  onStepForward: () => void;
  onRestart: () => void;
}

function findMoveSquares(fen: string, san: string): { from: Square; to: Square } | null {
  const probe = new Chess(fen);
  const match = probe.moves({ verbose: true }).find((m) => m.san === san);
  return match ? { from: match.from as Square, to: match.to as Square } : null;
}

export function BoardPanel({
  fen,
  playerColor,
  isPlayerTurn,
  feedback,
  lastWrongSquares,
  hintSan,
  openingName,
  whiteStrategy,
  blackStrategy,
  canStepBack,
  canStepForward,
  t,
  onDrop,
  onStepBack,
  onStepForward,
  onRestart,
}: BoardPanelProps) {
  const orientation = playerColor === "w" ? "white" : "black";

  // Have the move sound decoded before the first move needs it.
  useEffect(() => {
    preloadMoveSound();
  }, []);

  // Tap-to-move selection: touching a piece picks it up, touching a second
  // square plays it there. Cleared on every new position (a fresh move, a
  // reset, or a line change all produce a new fen) — reset synchronously
  // during render rather than in an effect, matching the pattern used
  // elsewhere in this codebase, so a reset can't leave a stale selection
  // visible for even one frame.
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [prevFen, setPrevFen] = useState(fen);
  if (prevFen !== fen) {
    setPrevFen(fen);
    setSelectedSquare(null);
  }

  const hintSquares = useMemo(
    () => (hintSan ? findMoveSquares(fen, hintSan) : null),
    [fen, hintSan],
  );

  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};
    if (feedback === "wrong" && lastWrongSquares) {
      styles[lastWrongSquares.from] = { backgroundColor: "rgba(220, 68, 68, 0.55)" };
      styles[lastWrongSquares.to] = { backgroundColor: "rgba(220, 68, 68, 0.55)" };
    }
    if (hintSquares) {
      styles[hintSquares.from] = { ...styles[hintSquares.from], backgroundColor: "rgba(70, 170, 90, 0.45)" };
      styles[hintSquares.to] = { ...styles[hintSquares.to], backgroundColor: "rgba(70, 170, 90, 0.45)" };
    }
    if (selectedSquare) {
      styles[selectedSquare] = {
        ...styles[selectedSquare],
        backgroundColor: "rgba(255, 210, 90, 0.55)",
      };
    }
    return styles;
  }, [feedback, lastWrongSquares, hintSquares, selectedSquare]);

  function handlePieceDrop({ sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean {
    setSelectedSquare(null);
    if (!targetSquare || !isPlayerTurn) return false;
    return onDrop(sourceSquare as Square, targetSquare as Square);
  }

  function canDragPiece(): boolean {
    return isPlayerTurn;
  }

  // Tap-to-move: touch a piece to pick it up, touch a destination square to
  // play it there — an alternative to dragging that's far more reliable on
  // touch devices, where a drag can be swallowed by the OS/webview before
  // it ever reaches the board.
  function handleSquareClick({ piece, square }: SquareHandlerArgs): void {
    if (!isPlayerTurn) return;
    const targetSquare = square as Square;

    if (!selectedSquare) {
      if (piece) setSelectedSquare(targetSquare);
      return;
    }
    if (targetSquare === selectedSquare) {
      setSelectedSquare(null);
      return;
    }
    if (piece && piece.pieceType[0] === playerColor) {
      setSelectedSquare(targetSquare);
      return;
    }

    const from = selectedSquare;
    setSelectedSquare(null);
    onDrop(from, targetSquare);
  }

  return (
    <div className="board-stage">
      <div className="board-header">
        <h2 className="board-opening-name">{openingName}</h2>
        <div className="board-header-actions">
          <button
            type="button"
            className="board-action"
            onClick={onRestart}
            aria-label={t.restart}
            title={t.restart}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </g>
            </svg>
          </button>
          <button
            type="button"
            className="board-action"
            onClick={onStepBack}
            disabled={!canStepBack}
            aria-label={t.stepBack}
            title={t.stepBack}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path d="m15 18-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            className="board-action"
            onClick={onStepForward}
            disabled={!canStepForward}
            aria-label={t.stepForward}
            title={t.stepForward}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path d="m9 18 6-6-6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
      <div className={"board-wrap" + (feedback === "wrong" ? " board-shake" : "")}>
        <Chessboard
          options={{
            id: "opening-trainer-board",
            position: fen,
            boardOrientation: orientation,
            onPieceDrop: handlePieceDrop,
            onSquareClick: handleSquareClick,
            canDragPiece,
            squareStyles,
            animationDurationInMs: 200,
            allowDragging: isPlayerTurn,
            darkSquareStyle: { backgroundColor: "#7c8fa3" },
            lightSquareStyle: { backgroundColor: "#eef1f5" },
          }}
        />
      </div>
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
    </div>
  );
}
