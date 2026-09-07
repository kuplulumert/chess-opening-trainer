import { useMemo, useState } from "react";
import { Chess, type Square } from "chess.js";
import { Chessboard, type PieceDropHandlerArgs, type SquareHandlerArgs } from "react-chessboard";
import type { PlayerColor } from "../hooks/useOpeningTrainer";

interface BoardPanelProps {
  fen: string;
  playerColor: PlayerColor;
  isPlayerTurn: boolean;
  feedback: "idle" | "correct" | "wrong";
  lastWrongSquares: { from: Square; to: Square } | null;
  hintSan: string | null;
  history: string[];
  whiteStrategy: string | null;
  blackStrategy: string | null;
  onDrop: (from: Square, to: Square) => boolean;
}

function findMoveSquares(fen: string, san: string): { from: Square; to: Square } | null {
  const probe = new Chess(fen);
  const match = probe.moves({ verbose: true }).find((m) => m.san === san);
  return match ? { from: match.from as Square, to: match.to as Square } : null;
}

// Colors strictly alternate by ply, so the last square a color moved to is
// found by replaying the played moves and keeping the most recent one whose
// ply index has that color's parity.
function lastMoveSquareForColor(history: string[], color: PlayerColor): Square | null {
  const chess = new Chess();
  let square: Square | null = null;
  history.forEach((san, ply) => {
    const move = chess.move(san);
    if (move && ply % 2 === (color === "w" ? 0 : 1)) square = move.to as Square;
  });
  return square;
}

// Board squares are laid out as an 8x8 grid of equal percentage cells; this
// turns a square name into that cell's (col, row) from the top-left corner
// of the board as currently drawn, accounting for board orientation.
function squareToCell(square: Square, orientation: "white" | "black") {
  const file = square.charCodeAt(0) - "a".charCodeAt(0);
  const rank = Number(square[1]) - 1;
  const col = orientation === "white" ? file : 7 - file;
  const row = orientation === "white" ? 7 - rank : rank;
  return { col, row };
}

interface AnnotationProps {
  cell: { col: number; row: number };
  text: string;
  placementSide: "left" | "right";
  color: "white" | "black";
}

const CELL_PERCENT = 100 / 8;

// Anchored beside the square on whichever side has more room (falling back,
// when both colors would otherwise land on the same side of nearby
// squares, to pushing one to the other side so they don't overlap) — and
// capped to that available width so the box can never run off the edge of
// the board, however close to the edge the square itself is.
function BoardAnnotation({ cell, text, placementSide, color }: AnnotationProps) {
  const { col, row } = cell;
  const availableCells = placementSide === "left" ? col : 7 - col;
  const style: React.CSSProperties = {
    top: `${row * CELL_PERCENT + CELL_PERCENT / 2}%`,
    maxWidth: `min(280px, ${availableCells * CELL_PERCENT - 2}%)`,
    [placementSide === "left" ? "right" : "left"]: `calc(${
      placementSide === "left" ? 100 - col * CELL_PERCENT : (col + 1) * CELL_PERCENT
    }% + 6px)`,
  };
  return (
    <div className={`board-annotation board-annotation-${color}`} style={style}>
      {text}
    </div>
  );
}

export function BoardPanel({
  fen,
  playerColor,
  isPlayerTurn,
  feedback,
  lastWrongSquares,
  hintSan,
  history,
  whiteStrategy,
  blackStrategy,
  onDrop,
}: BoardPanelProps) {
  const orientation = playerColor === "w" ? "white" : "black";

  // Annotations reappear for every newly played move, then disappear as soon
  // as the trainee touches a piece to make their own next move — they're a
  // glance-and-go explanation, not something to fight with while dragging.
  // Reset synchronously during render (rather than in an effect) so the
  // reveal isn't delayed by an extra render once a move lands. A pending
  // tap-to-move selection is cleared the same way, on the same trigger.
  const [dismissed, setDismissed] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [prevFen, setPrevFen] = useState(fen);
  if (prevFen !== fen) {
    setPrevFen(fen);
    setDismissed(false);
    setSelectedSquare(null);
  }

  const whiteSquare = useMemo(
    () => (whiteStrategy ? lastMoveSquareForColor(history, "w") : null),
    [history, whiteStrategy],
  );
  const blackSquare = useMemo(
    () => (blackStrategy ? lastMoveSquareForColor(history, "b") : null),
    [history, blackStrategy],
  );

  // Each annotation defaults to whichever side of its square has more room,
  // so a square near the edge never pushes its box off the board. When both
  // colors' squares are close enough (same rows) that they'd land on the
  // same side and overlap, white is pushed to the other side instead.
  const { whiteCell, blackCell, whitePlacement, blackPlacement } = useMemo(() => {
    const wCell = whiteSquare ? squareToCell(whiteSquare, orientation) : null;
    const bCell = blackSquare ? squareToCell(blackSquare, orientation) : null;
    const sideWithMoreRoom = (col: number): "left" | "right" => (col <= 3 ? "right" : "left");
    let wSide = wCell ? sideWithMoreRoom(wCell.col) : "left";
    const bSide = bCell ? sideWithMoreRoom(bCell.col) : "right";
    if (wCell && bCell && wSide === bSide && Math.abs(wCell.row - bCell.row) <= 2) {
      const flipped = wSide === "left" ? "right" : "left";
      const flippedRoom = flipped === "left" ? wCell.col : 7 - wCell.col;
      // Only flip white out of the way if the other side actually has room —
      // a square right at the edge (e.g. the a-file) has none on that side,
      // so overlapping is the lesser evil there.
      if (flippedRoom >= 2) wSide = flipped;
    }
    return { whiteCell: wCell, blackCell: bCell, whitePlacement: wSide, blackPlacement: bSide };
  }, [whiteSquare, blackSquare, orientation]);

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
      <div
        className={"board-wrap" + (feedback === "wrong" ? " board-shake" : "")}
        // Fires on the very first touch/click anywhere on the board — including
        // an empty square or a piece that never actually gets dragged — rather
        // than waiting for react-chessboard's own drag-start (which only fires
        // once a piece has moved past its activation threshold).
        onPointerDown={() => setDismissed(true)}
      >
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
      {!dismissed && whiteCell && whiteStrategy && (
        <BoardAnnotation cell={whiteCell} text={whiteStrategy} placementSide={whitePlacement} color="white" />
      )}
      {!dismissed && blackCell && blackStrategy && (
        <BoardAnnotation cell={blackCell} text={blackStrategy} placementSide={blackPlacement} color="black" />
      )}
    </div>
  );
}
