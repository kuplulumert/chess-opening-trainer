import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Square } from "chess.js";
import { openings as openingsEn, type OpeningLine } from "./data/openings";
import { getLocalizedOpenings } from "./data/localize";
import { Sidebar } from "./components/Sidebar";
import { HowToUseBanner } from "./components/HowToUseBanner";
import { BoardPanel } from "./components/BoardPanel";
import { InfoPanel } from "./components/InfoPanel";
import { OpeningFinder } from "./components/OpeningFinder";
import { SkillMap } from "./components/SkillMap";
import { HomeScreen } from "./components/HomeScreen";
import { TabBar } from "./components/TabBar";
import { getAllProgress, recordCompletion } from "./utils/storage";
import { useOpeningTrainer, type PlayerColor, type TrainerMode } from "./hooks/useOpeningTrainer";
import { useTheme } from "./hooks/useTheme";
import { useLanguage } from "./hooks/useLanguage";
import "./App.css";

function App() {
  const [selectedId, setSelectedId] = useState(openingsEn[0].id);
  const [playerColor, setPlayerColor] = useState<PlayerColor>("w");
  const [mode, setMode] = useState<TrainerMode>("study");
  const [progress, setProgress] = useState(() => getAllProgress());
  const [extended, setExtended] = useState(false);
  const [finderOpen, setFinderOpen] = useState(false);
  const [view, setView] = useState<"home" | "trainer" | "openings" | "map">("home");
  const { theme, toggleTheme } = useTheme();
  const { language, t, setLanguage } = useLanguage();

  const openings = useMemo(() => getLocalizedOpenings(language), [language]);
  const line = openings.find((o) => o.id === selectedId) ?? openings[0];

  // A fresh run (new opening, new color, or new mode) always starts at the
  // base depth; the trainee re-opts into the extension each time. Reset
  // synchronously during render (React's documented pattern for this) rather
  // than in an effect, which would need an extra render to take effect.
  const runKey = `${selectedId}:${playerColor}:${mode}`;
  const [activeRunKey, setActiveRunKey] = useState(runKey);
  if (activeRunKey !== runKey) {
    setActiveRunKey(runKey);
    setExtended(false);
  }

  // A run's own line stays untouched until the trainee opts in to the extra
  // 5 plies via the "extend" offer shown once the base line is complete —
  // extending swaps in a longer moves/comments list under the same id, so
  // useOpeningTrainer picks up right where it left off instead of resetting.
  const activeLine = useMemo(() => {
    if (!extended || !line.extension) return line;
    return {
      ...line,
      moves: [...line.moves, ...line.extension.moves],
      comments: [...line.comments, ...line.extension.comments],
      strategy: [...line.strategy, ...line.extension.strategy],
    };
  }, [line, extended]);

  const trainer = useOpeningTrainer(activeLine, playerColor, mode);

  // Record a completion once per run-through of a line, not once per render.
  const recordedRef = useRef<string | null>(null);
  const { isDone } = trainer;
  useEffect(() => {
    if (!isDone) {
      recordedRef.current = null;
      return;
    }
    if (mode !== "quiz") return;
    const runKey = `${line.id}:${playerColor}`;
    if (recordedRef.current === runKey) return;
    recordedRef.current = runKey;
    recordCompletion(line.id, playerColor);
    setProgress(getAllProgress());
  }, [isDone, mode, line.id, playerColor]);

  // Every new run, and every return to the board from another tab, starts
  // at the top of the page. Partly UX — the board should be in view — but
  // mostly because on iOS the "taps land a square too low" bug only ever
  // showed up after the content was swapped underneath a scrolled page
  // (picking a line from the scrolled openings list, "next opening" from
  // below the board), never on a fresh load at scroll 0. Resetting the
  // scroll takes that state off the table.
  useEffect(() => {
    if (view === "trainer") window.scrollTo(0, 0);
  }, [view, runKey]);

  // Defences (Sicilian, French, Caro-Kann, ... and individual defensive
  // lines like the Berlin Defence within Ruy Lopez) are trained as Black
  // by default, since that's the side whose repertoire they actually are;
  // everything else defaults to White. Looked up from the canonical
  // English data so this doesn't depend on the current UI language.
  const selectOpening = useCallback((id: string) => {
    setSelectedId(id);
    const canonical = openingsEn.find((o) => o.id === id);
    const isDefence = canonical?.family.includes("Defence") || canonical?.name.includes("Defence");
    setPlayerColor(isDefence ? "b" : "w");
  }, []);

  const handleSelect = useCallback(
    (next: OpeningLine) => {
      selectOpening(next.id);
      // On narrow/iOS layouts the opening list lives in its own tab, so
      // picking a line should jump straight to the board instead of
      // leaving the trainee stranded on the list.
      setView("trainer");
    },
    [selectOpening],
  );

  const handleDrop = useCallback(
    (from: Square, to: Square) => trainer.attemptMove(from, to),
    [trainer],
  );

  const handleNextLine = useCallback(() => {
    const index = openings.findIndex((o) => o.id === selectedId);
    selectOpening(openings[(index + 1) % openings.length].id);
  }, [openings, selectedId, selectOpening]);

  const handleRestart = useCallback(() => {
    setExtended(false);
    trainer.reset();
  }, [trainer]);

  const handleExtend = useCallback(() => {
    setExtended(true);
  }, []);

  const handleFinderSelect = useCallback(
    (next: OpeningLine) => {
      selectOpening(next.id);
      setFinderOpen(false);
    },
    [selectOpening],
  );

  const handleMapSelect = useCallback(
    (next: OpeningLine) => {
      selectOpening(next.id);
      setView("trainer");
    },
    [selectOpening],
  );

  return (
    <>
      {view !== "home" && (
        <div className="view-switcher">
          <div className="view-switcher-tabs">
            <button type="button" onClick={() => setView("home")}>
              <img
                src={`${import.meta.env.BASE_URL}home-icon.png`}
                alt=""
                className="view-switcher-tab-icon"
              />
              {t.home.navLabel}
            </button>
            <button
              type="button"
              className={view === "trainer" ? "view-switcher-active" : ""}
              onClick={() => setView("trainer")}
            >
              <img
                src={`${import.meta.env.BASE_URL}pawn-icon.png`}
                alt=""
                className="view-switcher-tab-icon"
              />
              {t.map.trainerNavLabel}
            </button>
            <button
              type="button"
              className={
                "view-switcher-openings" + (view === "openings" ? " view-switcher-active" : "")
              }
              onClick={() => setView("openings")}
            >
              <img
                src={`${import.meta.env.BASE_URL}openings-icon.png`}
                alt=""
                className="view-switcher-tab-icon"
              />
              {t.map.openingsNavLabel}
            </button>
            <button
              type="button"
              className={view === "map" ? "view-switcher-active" : ""}
              onClick={() => setView("map")}
            >
              <img
                src={`${import.meta.env.BASE_URL}skillmap-icon.png`}
                alt=""
                className="view-switcher-tab-icon"
              />
              {t.map.navLabel}
            </button>
          </div>
        </div>
      )}

      {view === "home" ? (
        <HomeScreen
          t={t}
          language={language}
          onSelectLanguage={setLanguage}
          theme={theme}
          onToggleTheme={toggleTheme}
          onStartTrainer={() => setView("trainer")}
          onBrowseOpenings={() => setView("openings")}
          onOpenSkillMap={() => setView("map")}
        />
      ) : view === "map" ? (
        <SkillMap openings={openings} progress={progress} t={t} onTrainLine={handleMapSelect} />
      ) : (
        <div className="app-shell" data-mobile-view={view}>
          {view === "trainer" && (
            <HowToUseBanner
              text={t.howToUse}
              dismissLabel={t.dismissGuide}
              storageKey="chess-opening-trainer-guide-dismissed"
            />
          )}
          <Sidebar
            lines={openings}
            selectedId={selectedId}
            playerColor={playerColor}
            onSelect={handleSelect}
            onOpenFinder={() => setFinderOpen(true)}
            progress={progress}
            theme={theme}
            onToggleTheme={toggleTheme}
            t={t}
          />
          <main className="board-column">
            <BoardPanel
              // Force a full remount on every new run (line, color, or mode
              // change) rather than letting react-chessboard/dnd-kit update
              // in place — its square-position measurements can go stale
              // when the board's spot on the page shifts (a new opening
              // name, White/Black cards appearing/disappearing), and a
              // resize-event nudge wasn't enough to make it re-measure. A
              // fresh mount always measures the current, already-settled
              // layout from scratch.
              key={runKey}
              fen={trainer.fen}
              playerColor={playerColor}
              isPlayerTurn={trainer.isPlayerTurn}
              feedback={trainer.feedback}
              lastWrongSquares={trainer.lastWrongSquares}
              hintSan={trainer.revealedHint}
              openingName={line.name}
              whiteStrategy={trainer.whiteStrategy}
              blackStrategy={trainer.blackStrategy}
              canStepBack={trainer.canStepBack}
              canStepForward={trainer.canStepForward}
              t={t}
              onDrop={handleDrop}
              onStepBack={trainer.stepBack}
              onStepForward={trainer.stepForward}
              onRestart={handleRestart}
              hintVisible={mode === "quiz"}
              canHint={!trainer.isDone}
              onHint={trainer.requestHint}
            />
          </main>
          <InfoPanel
            playerColor={playerColor}
            mode={mode}
            history={trainer.history}
            moveIndex={trainer.moveIndex}
            totalMoves={trainer.totalMoves}
            isDone={trainer.isDone}
            feedback={trainer.feedback}
            wrongAttempts={trainer.wrongAttempts}
            revealedHint={trainer.revealedHint}
            currentComment={trainer.currentComment}
            isPlayerTurn={trainer.isPlayerTurn}
            canExtend={Boolean(line.extension) && !extended}
            t={t}
            onColorChange={setPlayerColor}
            onModeChange={setMode}
            onRestart={handleRestart}
            onNextLine={handleNextLine}
            onExtend={handleExtend}
            onGoTo={trainer.goTo}
          />

          {finderOpen && (
            <OpeningFinder
              openings={openings}
              canonicalOpenings={openingsEn}
              t={t}
              onSelect={handleFinderSelect}
              onClose={() => setFinderOpen(false)}
            />
          )}
        </div>
      )}

      <TabBar view={view} t={t} onChange={setView} />
    </>
  );
}

export default App;
