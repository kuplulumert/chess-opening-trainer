import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Square } from "chess.js";
import { openings as openingsEn, type OpeningLine } from "./data/openings";
import { getLocalizedOpenings } from "./data/localize";
import { sideOf } from "./data/side";
import { Sidebar } from "./components/Sidebar";
import { HowToUseBanner } from "./components/HowToUseBanner";
import { BoardPanel } from "./components/BoardPanel";
import { InfoPanel } from "./components/InfoPanel";
import { OpeningFinder } from "./components/OpeningFinder";
import { SkillMap } from "./components/SkillMap";
import { HomeScreen } from "./components/HomeScreen";
import { TabBar } from "./components/TabBar";
import { getAllProgress, recordReview } from "./utils/storage";
import { useOpeningTrainer, type PlayerColor, type TrainerMode } from "./hooks/useOpeningTrainer";
import { hideSplash } from "./utils/native";
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

  // Record a completion once per run-through of a line, not once per
  // render — and only in quiz mode, same as before: Study mode is guided,
  // so it isn't a real recall test and shouldn't feed the SM-2 scheduler
  // any more than it fed the old medal count.
  const recordedRef = useRef<string | null>(null);
  const { isDone, mistakeCount, hintUsedInRun } = trainer;
  useEffect(() => {
    if (!isDone) {
      recordedRef.current = null;
      return;
    }
    if (mode !== "quiz") return;
    const runKey = `${line.id}:${playerColor}`;
    if (recordedRef.current === runKey) return;
    recordedRef.current = runKey;
    recordReview(line.id, playerColor, mistakeCount, hintUsedInRun);
    setProgress(getAllProgress());
  }, [isDone, mode, line.id, playerColor, mistakeCount, hintUsedInRun]);

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

  // Native only: the launch screen is held until this first commit has
  // put the home screen on screen, then cross-faded away (no-op on web).
  useEffect(() => {
    hideSplash();
  }, []);

  // A line is trained as whichever side's repertoire it belongs to — the
  // same classification the openings list is split by, so picking from
  // one of its two tabs always lands you on that colour.
  const selectOpening = useCallback((id: string) => {
    setSelectedId(id);
    setPlayerColor(sideOf(id));
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

  // A due-review pick names its own color explicitly (the side that was
  // actually quizzed) rather than deferring to selectOpening's family
  // default, and forces Quiz mode — landing in Study wouldn't test recall
  // at all, so the review wouldn't feed the scheduler anything.
  const handleReviewDue = useCallback((next: OpeningLine, color: PlayerColor) => {
    setSelectedId(next.id);
    setPlayerColor(color);
    setMode("quiz");
    setView("trainer");
  }, []);

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
          onOpenFinder={() => setFinderOpen(true)}
          onStartTrainer={() => setView("trainer")}
          onBrowseOpenings={() => setView("openings")}
          onOpenSkillMap={() => setView("map")}
        />
      ) : view === "map" ? (
        <SkillMap
          openings={openings}
          progress={progress}
          t={t}
          onTrainLine={handleMapSelect}
          onReviewDue={handleReviewDue}
        />
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
              mode={mode}
              onColorChange={setPlayerColor}
              onModeChange={setMode}
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
            mode={mode}
            moveIndex={trainer.moveIndex}
            isDone={trainer.isDone}
            currentComment={trainer.currentComment}
            isPlayerTurn={trainer.isPlayerTurn}
            canExtend={Boolean(line.extension) && !extended}
            whiteStrategy={trainer.whiteStrategy}
            blackStrategy={trainer.blackStrategy}
            t={t}
            onRestart={handleRestart}
            onNextLine={handleNextLine}
            onExtend={handleExtend}
          />
        </div>
      )}

      {/* Not on Home: its own cards already are the navigation, so a tab
          bar underneath them just says the same thing twice. */}
      {view !== "home" && <TabBar view={view} t={t} onChange={setView} />}

      {/* Outside the view branches: the finder is reachable from Home and
          from the openings list alike. */}
      {finderOpen && (
        <OpeningFinder
          openings={openings}
          canonicalOpenings={openingsEn}
          t={t}
          onSelect={handleFinderSelect}
          onClose={() => setFinderOpen(false)}
        />
      )}
    </>
  );
}

export default App;
