import { useEffect, useState } from "react";
import type { Theme } from "../hooks/useTheme";
import type { Dictionary, Language } from "../i18n/translations";
import type { ReminderToggleResult } from "../hooks/useReminders";
import { LanguagePicker } from "./LanguagePicker";
import { ThemeToggle } from "./ThemeToggle";
import { ReminderToggle } from "./ReminderToggle";
import { isNative } from "../utils/native";

// The full launch sequence (logo blooms in, then title, tagline and cards
// stagger in) plays once per app session — the first time Home mounts.
// Coming back to Home later gets the regular quick screen fade instead;
// replaying the whole intro on every tab switch would wear thin fast.
let introPlayed = false;

interface HomeScreenProps {
  t: Dictionary;
  language: Language;
  onSelectLanguage: (language: Language) => void;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenFinder: () => void;
  onStartTrainer: () => void;
  remindersEnabled: boolean;
  onToggleReminders: () => Promise<ReminderToggleResult>;
}

export function HomeScreen({
  t,
  language,
  onSelectLanguage,
  theme,
  onToggleTheme,
  onOpenFinder,
  onStartTrainer,
  remindersEnabled,
  onToggleReminders,
}: HomeScreenProps) {
  const [intro] = useState(() => !introPlayed);
  useEffect(() => {
    introPlayed = true;
  }, []);

  // An icon-only toggle can show on and off, but not "the OS refused" —
  // a blocked tap would otherwise just do nothing at all, which reads as a
  // broken button. Hover tooltips do not exist on a phone, so the refusal
  // has to say so on screen. Timestamped rather than boolean so tapping
  // again while the message is up restarts its dismissal timer.
  const [blockedAt, setBlockedAt] = useState(0);
  useEffect(() => {
    if (blockedAt === 0) return;
    const id = setTimeout(() => setBlockedAt(0), 5000);
    return () => clearTimeout(id);
  }, [blockedAt]);

  const handleToggleReminders = async () => {
    const result = await onToggleReminders();
    setBlockedAt(result === "blocked" ? Date.now() : 0);
  };

  return (
    <div
      className={
        "home-screen" +
        (intro ? " home-screen-intro" : "") +
        // On native the launch screen already shows the rook in exactly
        // this spot, so the logo doesn't re-animate — it just stays put
        // while the launch screen fades and the rest blooms in around it.
        (intro && isNative ? " home-screen-intro-native" : "")
      }
    >
      <div className="home-corner-controls">
        <ReminderToggle
          enabled={remindersEnabled}
          label={
            remindersEnabled
              ? t.notifications.disableLabel
              : blockedAt !== 0
                ? t.notifications.deniedLabel
                : t.notifications.enableLabel
          }
          onToggle={handleToggleReminders}
        />
        <ThemeToggle
          theme={theme}
          label={theme === "dark" ? t.switchToLight : t.switchToDark}
          onToggle={onToggleTheme}
        />
      </div>
      {blockedAt !== 0 && (
        <p className="home-reminder-blocked" role="status">
          {t.notifications.deniedLabel}
        </p>
      )}
      <div className="home-hero">
        <img
          src={`${import.meta.env.BASE_URL}rook-logo.png`}
          alt=""
          className="home-logo"
        />
        <h1 className="home-title">{t.appTitle}</h1>
        {/* A fixed brand tagline, deliberately kept in English in both
            languages rather than pulled from the Dictionary — same "stays
            put" reasoning as the Language label. */}
        <p className="home-subtitle">Master your openings. Own the game.</p>
      </div>
      <div className="home-actions">
        <div className="info-card home-language-card">
          <LanguagePicker language={language} onSelect={onSelectLanguage} />
        </div>
        <button type="button" className="home-action-card" onClick={onStartTrainer}>
          <span className="home-action-title-row">
            <img
              src={`${import.meta.env.BASE_URL}pawn-icon.png`}
              alt=""
              className="home-action-icon"
            />
            <span className="home-action-label">{t.home.startTrainer}</span>
          </span>
          <span className="home-action-hint">{t.home.startTrainerHint}</span>
        </button>
        <button type="button" className="home-finder-trigger" onClick={onOpenFinder}>
          {t.finder.trigger}
        </button>
      </div>
    </div>
  );
}
