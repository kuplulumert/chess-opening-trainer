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
import { getAllProgress, recordReview, saveStepStage } from "./utils/storage";
import { useOpeningTrainer, type PlayerColor, type TrainerMode } from "./hooks/useOpeningTrainer";
import { hideSplash } from "./utils/native";
import { useTheme } from "./hooks/useTheme";
import { useLanguage } from "./hooks/useLanguage";
import { useReminders } from "./hooks/useReminders";
import { syncReviewReminder } from "./utils/notifications";
import { CLEAN_RUNS_TO_PASS, useStepSession, type StepSessionState } from "./hooks/useStepSession";
import { StepProgress } from "./components/StepProgress";
import "./App.css";

// How long a finished Adım Adım run stays on its final position, with its
// result showing, before the next run starts over from move one.
const STEP_RUN_PAUSE_MS = 900;

interface PendingStep {
  next: StepSessionState;
  resetBoard: boolean;
  /** Storage was already written for this run; the in-memory copy lags. */
  progressChanged: boolean;
}

function App() {
  const [selectedId, setSelectedId] = useState(openingsEn[0].id);
  const [playerColor, setPlayerColor] = useState<PlayerColor>("w");
  // Opens the way selectOpening would: Adım Adım until the line is learned
  // on that side, Practice after.
  const [mode, setMode] = useState<TrainerMode>(() =>
    getAllProgress()[`${openingsEn[0].id}:w`]?.srs ? "quiz" : "steps",
  );
  const [progress, setProgress] = useState(() => getAllProgress());
  const [extended, setExtended] = useState(false);
  const [finderOpen, setFinderOpen] = useState(false);
  const [view, setView] = useState<"home" | "trainer" | "openings" | "map">("home");
  const { theme, toggleTheme } = useTheme();
  const { language, t, setLanguage } = useLanguage();
  const { remindersEnabled, toggleReminders } = useReminders();

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

  // A line+side counts as learned once it has an SRS record — whether that
  // came from finishing Adım Adım or from Practice runs before the mode
  // existed, so nobody's earlier progress gets sent back to stage one.
  const lineProgress = progress[`${line.id}:${playerColor}`];
  const lineLearned = Boolean(lineProgress?.srs);
  // An unlearned line resumes at the stage it reached; a learned one opened
  // in Adım Adım is a refresher and always starts from the top.
  const steps = useStepSession(
    line,
    playerColor,
    mode === "steps",
    lineLearned ? 0 : (lineProgress?.stepStage ?? 0),
  );

  // A run's own line stays untouched until the trainee opts in to the extra
  // 5 plies via the "extend" offer shown once the base line is complete —
  // extending swaps in a longer moves/comments list under the same id, so
  // useOpeningTrainer picks up right where it left off instead of resetting.
  // In Adım Adım a run is only the current stage's share of the line.
  const activeLine = useMemo(() => {
    if (mode === "steps") return steps.line;
    if (!extended || !line.extension) return line;
    return {
      ...line,
      moves: [...line.moves, ...line.extension.moves],
      comments: [...line.comments, ...line.extension.comments],
      strategy: [...line.strategy, ...line.extension.strategy],
    };
  }, [mode, steps.line, line, extended]);

  const trainer = useOpeningTrainer(
    activeLine,
    playerColor,
    mode,
    mode === "steps" ? steps.shownPlies : undefined,
  );

  // Record a completion once per run-through of a line, not once per
  // render — and only in quiz mode, same as before: Study mode is guided,
  // so it isn't a real recall test and shouldn't feed the SM-2 scheduler
  // any more than it fed the old medal count.
  const recordedRef = useRef<string | null>(null);
  const { isDone, mistakeCount, hintUsedInRun, missedPlies } = trainer;
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

  // Adım Adım: a finished run is judged the moment it ends, left on its
  // final position for a beat with the result showing, then the next run
  // starts over from move one. Storage is written at once, so a finished
  // run is never lost; every React update waits for the beat to end. The
  // pending step lives in a ref rather than this effect's cleanup, so
  // renders during the beat can't cancel it.
  const stepTimerRef = useRef<number | undefined>(undefined);
  const pendingStepRef = useRef<PendingStep | null>(null);
  const stepJudgedRef = useRef(false);
  const { judgeRun, apply: applyStep, finished: stepsFinished } = steps;
  const resetBoard = trainer.reset;

  const flushPendingStep = useCallback(() => {
    window.clearTimeout(stepTimerRef.current);
    const pending = pendingStepRef.current;
    pendingStepRef.current = null;
    if (!pending) return;
    if (pending.progressChanged) setProgress(getAllProgress());
    applyStep(pending.next);
    if (pending.resetBoard) resetBoard();
  }, [applyStep, resetBoard]);

  useEffect(() => {
    if (mode !== "steps") return;
    if (!isDone) {
      stepJudgedRef.current = false;
      return;
    }
    if (stepJudgedRef.current || stepsFinished) return;
    stepJudgedRef.current = true;

    const { outcome, next } = judgeRun(missedPlies);
    // Only an unlearned line is written: finishing it is its first
    // completion (Bronze) and first review. Rerunning a learned line here is
    // a refresher with shown runs in it, not a recall test, so it leaves the
    // record alone.
    let progressChanged = false;
    if (!lineLearned && outcome === "finished") {
      recordReview(line.id, playerColor, 0, false);
      progressChanged = true;
    } else if (!lineLearned && outcome === "stagePassed") {
      saveStepStage(line.id, playerColor, next.stage);
      progressChanged = true;
    }
    pendingStepRef.current = {
      next: outcome === "finished" ? { ...next, learnedNow: !lineLearned } : next,
      // A finish has no next run: the board stays on the final position
      // under the finish card.
      resetBoard: outcome !== "finished",
      progressChanged,
    };
    stepTimerRef.current = window.setTimeout(flushPendingStep, STEP_RUN_PAUSE_MS);
  }, [
    mode,
    isDone,
    stepsFinished,
    judgeRun,
    missedPlies,
    lineLearned,
    line.id,
    playerColor,
    flushPendingStep,
  ]);

  // A pending next run belongs to the run it came from — drop it if the
  // line, side, or mode changes during the beat, or on unmount. Its result
  // is already in storage, so only the in-memory copy needs catching up.
  useEffect(
    () => () => {
      window.clearTimeout(stepTimerRef.current);
      const pending = pendingStepRef.current;
      pendingStepRef.current = null;
      if (pending?.progressChanged) setProgress(getAllProgress());
    },
    [runKey],
  );

  // Re-derives the one pending "review due" notification from the latest
  // progress every time it changes (a review just got recorded) and on
  // first load (app launch) — see syncReviewReminder for why there's only
  // ever at most one pending. Does nothing while the trainee has reminders
  // turned off, beyond clearing whatever was already scheduled.
  useEffect(() => {
    syncReviewReminder(remindersEnabled, progress, {
      title: t.notifications.title,
      body: t.notifications.body,
    });
  }, [remindersEnabled, progress, t]);

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
  // one of its two tabs always lands you on that colour — and opens in
  // Adım Adım until it's learned on that side, Practice after.
  const selectOpening = useCallback(
    (id: string) => {
      const side = sideOf(id);
      setSelectedId(id);
      setPlayerColor(side);
      setMode(progress[`${id}:${side}`]?.srs ? "quiz" : "steps");
    },
    [progress],
  );

  // Switching sides is opening the line from the other side, so the same
  // learned-or-not choice applies — except in Study, which is an explicit
  // "just show me" and stays put.
  const handleColorChange = useCallback(
    (color: PlayerColor) => {
      setPlayerColor(color);
      setMode((current) =>
        current === "study" ? current : progress[`${selectedId}:${color}`]?.srs ? "quiz" : "steps",
      );
    },
    [progress, selectedId],
  );

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
    if (mode === "steps") {
      const pending = pendingStepRef.current;
      if (pending) {
        // Mid-beat: that run already finished and was judged — keep it. If
        // it was the last one, restart means going through the stages again.
        flushPendingStep();
        if (pending.next.finished) steps.restart();
      } else if (stepsFinished) {
        steps.restart();
      } else if (missedPlies.length > 0) {
        // Restarting doesn't wipe a mistake: the new run shows the missed move.
        applyStep(judgeRun(missedPlies).next);
      }
    }
    trainer.reset();
  }, [mode, flushPendingStep, stepsFinished, steps, missedPlies, applyStep, judgeRun, trainer]);

  const handleExtend = useCallback(() => {
    setExtended(true);
  }, []);

  const handleGoToPractice = useCallback(() => setMode("quiz"), []);

  // Same as picking from the list or the map: the point of choosing a line
  // is to go train it. Closing the finder without switching views dropped
  // the trainee back on whatever screen they opened it from — on Home that
  // looked like the pick simply hadn't registered.
  const handleFinderSelect = useCallback(
    (next: OpeningLine) => {
      selectOpening(next.id);
      setFinderOpen(false);
      setView("trainer");
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

  // During the beat between runs, the result on screen is the finished run
  // judged again here — pure, nothing stored — so it can't drift from the
  // step the timer is about to apply.
  const beat = mode === "steps" && isDone && !steps.finished ? judgeRun(missedPlies) : null;
  const beatFlash = beat && {
    text:
      beat.outcome === "failed"
        ? t.steps.failedFlash
        : beat.outcome === "uncounted"
          ? t.steps.uncountedFlash
          : beat.outcome === "stagePassed"
            ? t.steps.stagePassedFlash
            : t.steps.cleanFlash(beat.next.streak, CLEAN_RUNS_TO_PASS),
    // A passed stage lights all its dots for the beat before they reset.
    streak: beat.outcome === "stagePassed" ? CLEAN_RUNS_TO_PASS : beat.next.streak,
  };
  // A mistake in a counting run drops the streak on screen right away, not
  // only once the run ends — that's when the trainee needs to know.
  const liveMistake = steps.phase === "recall" && missedPlies.length > 0;
  const shownStreak = steps.finished
    ? CLEAN_RUNS_TO_PASS
    : beatFlash
      ? beatFlash.streak
      : liveMistake
        ? 0
        : steps.streak;
  const stepStatus = steps.finished
    ? ""
    : (beatFlash?.text ??
      (steps.phase === "intro"
        ? t.steps.introStatus
        : steps.phase === "hint"
          ? t.steps.hintStatus
          : liveMistake
            ? t.steps.mistakeStatus
            : t.steps.recallStatus(steps.streak, CLEAN_RUNS_TO_PASS)));

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
          remindersEnabled={remindersEnabled}
          onToggleReminders={toggleReminders}
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
              onColorChange={handleColorChange}
              onModeChange={setMode}
              canStepBack={trainer.canStepBack}
              canStepForward={trainer.canStepForward}
              t={t}
              onDrop={handleDrop}
              onStepBack={trainer.stepBack}
              onStepForward={trainer.stepForward}
              onRestart={handleRestart}
              hintVisible={mode !== "study"}
              canHint={!trainer.isDone}
              onHint={trainer.requestHint}
            >
              {mode === "steps" && (
                <StepProgress
                  stage={steps.stage}
                  stageCount={steps.stageCount}
                  showsMoves={!steps.finished && steps.phase !== "recall"}
                  cleanRuns={shownStreak}
                  runsToPass={CLEAN_RUNS_TO_PASS}
                  finished={steps.finished}
                  status={stepStatus}
                  t={t}
                />
              )}
            </BoardPanel>
          </main>
          <InfoPanel
            mode={mode}
            moveIndex={trainer.moveIndex}
            isDone={trainer.isDone}
            currentComment={trainer.currentComment}
            isPlayerTurn={trainer.isPlayerTurn}
            canExtend={mode !== "steps" && Boolean(line.extension) && !extended}
            whiteStrategy={trainer.whiteStrategy}
            blackStrategy={trainer.blackStrategy}
            t={t}
            onRestart={handleRestart}
            onNextLine={handleNextLine}
            onExtend={handleExtend}
            stepsFinished={steps.finished}
            stepsLearnedNow={steps.learnedNow}
            onGoToPractice={handleGoToPractice}
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
