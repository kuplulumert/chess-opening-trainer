import { useEffect, useRef, useState } from "react";
import type { Theme } from "../hooks/useTheme";
import type { ReminderToggleResult } from "../hooks/useReminders";
import type { Dictionary, Language } from "../i18n/translations";
import { isTouchDebugEnabled, setTouchDebugEnabled } from "../utils/touchDebug";
import "./SettingsScreen.css";

// Both how-to banners remember their own dismissal; they're cleared
// together, because "show the tips again" reads as one switch, not two.
const GUIDE_KEYS = [
  "chess-opening-trainer-guide-dismissed",
  "chess-opening-trainer-map-guide-dismissed",
];

interface SettingsScreenProps {
  t: Dictionary;
  language: Language;
  onSelectLanguage: (language: Language) => void;
  theme: Theme;
  onToggleTheme: () => void;
  remindersEnabled: boolean;
  onToggleReminders: () => Promise<ReminderToggleResult>;
}

// One labelled row per setting, each saying what it actually changes —
// the corner icons on Home can only show a state, not explain it. Laid
// out so later settings are just more rows.
export function SettingsScreen({
  t,
  language,
  onSelectLanguage,
  theme,
  onToggleTheme,
  remindersEnabled,
  onToggleReminders,
}: SettingsScreenProps) {
  // The OS can refuse notifications, and a switch that silently snaps back
  // reads as broken — so the refusal says so on screen. Timestamped, so
  // tapping again while it's up restarts the dismissal timer.
  const [blockedAt, setBlockedAt] = useState(0);
  useEffect(() => {
    if (blockedAt === 0) return;
    const id = setTimeout(() => setBlockedAt(0), 5000);
    return () => clearTimeout(id);
  }, [blockedAt]);

  const [guideRestored, setGuideRestored] = useState(false);

  // Five quick taps on the title toggle the on-device touch diagnostics
  // (see TouchDebug). They used to live on the board's opening name, which
  // is now the way into the openings list — here they stay out of the way
  // but reachable on a phone with no dev tools.
  const titleTaps = useRef<number[]>([]);
  const [touchDebug, setTouchDebug] = useState(isTouchDebugEnabled);
  const [touchDebugShown, setTouchDebugShown] = useState(false);
  const handleTitleTap = () => {
    const now = Date.now();
    titleTaps.current = [...titleTaps.current.filter((at) => now - at < 3000), now];
    if (titleTaps.current.length < 5) return;
    titleTaps.current = [];
    const next = !touchDebug;
    setTouchDebugEnabled(next);
    setTouchDebug(next);
    setTouchDebugShown(true);
  };

  const handleReminders = async (next: boolean) => {
    if (next === remindersEnabled) return;
    const result = await onToggleReminders();
    setBlockedAt(result === "blocked" ? Date.now() : 0);
  };

  const handleRestoreGuides = () => {
    for (const key of GUIDE_KEYS) {
      try {
        localStorage.removeItem(key);
      } catch {
        // Nothing was persisted, so the tips are already on.
      }
    }
    setGuideRestored(true);
  };

  return (
    <div className="settings-screen">
      <header className="settings-head">
        <h1 className="settings-title" onClick={handleTitleTap}>
          {t.settings.title}
        </h1>
        <p className="settings-subtitle">{t.settings.subtitle}</p>
        {touchDebugShown && (
          <p className="settings-note" role="status">
            {touchDebug ? t.settings.touchDebugOn : t.settings.touchDebugOff}
          </p>
        )}
      </header>

      {/* "Language" stays untranslated here for the same reason as on Home:
          it's the one label a reader has to recognize before they've picked
          a language at all. */}
      <section className="info-card settings-row">
        <div className="settings-row-text">
          <h2 className="settings-row-title">{t.settings.languageTitle}</h2>
          <p className="settings-row-hint">{t.settings.languageHint}</p>
        </div>
        <div className="segmented">
          <button
            type="button"
            className={language === "tr" ? "segmented-active" : ""}
            onClick={() => onSelectLanguage("tr")}
          >
            TR
          </button>
          <button
            type="button"
            className={language === "en" ? "segmented-active" : ""}
            onClick={() => onSelectLanguage("en")}
          >
            EN
          </button>
        </div>
      </section>

      <section className="info-card settings-row">
        <div className="settings-row-text">
          <h2 className="settings-row-title">{t.settings.themeTitle}</h2>
          <p className="settings-row-hint">{t.settings.themeHint}</p>
        </div>
        <div className="segmented">
          <button
            type="button"
            className={theme === "dark" ? "segmented-active" : ""}
            onClick={() => theme !== "dark" && onToggleTheme()}
          >
            {t.settings.themeDark}
          </button>
          <button
            type="button"
            className={theme === "light" ? "segmented-active" : ""}
            onClick={() => theme !== "light" && onToggleTheme()}
          >
            {t.settings.themeLight}
          </button>
        </div>
      </section>

      <section className="info-card settings-row">
        <div className="settings-row-text">
          <h2 className="settings-row-title">{t.settings.remindersTitle}</h2>
          <p className="settings-row-hint">{t.settings.remindersHint}</p>
          {blockedAt !== 0 && (
            <p className="settings-note" role="status">
              {t.notifications.deniedLabel}
            </p>
          )}
        </div>
        <div className="segmented">
          <button
            type="button"
            className={remindersEnabled ? "segmented-active" : ""}
            onClick={() => handleReminders(true)}
          >
            {t.settings.on}
          </button>
          <button
            type="button"
            className={remindersEnabled ? "" : "segmented-active"}
            onClick={() => handleReminders(false)}
          >
            {t.settings.off}
          </button>
        </div>
      </section>

      <section className="info-card settings-row">
        <div className="settings-row-text">
          <h2 className="settings-row-title">{t.settings.guideTitle}</h2>
          <p className="settings-row-hint">{t.settings.guideHint}</p>
          {guideRestored && (
            <p className="settings-note" role="status">
              {t.settings.guideDone}
            </p>
          )}
        </div>
        <button type="button" className="secondary-button" onClick={handleRestoreGuides}>
          {t.settings.guideAction}
        </button>
      </section>
    </div>
  );
}
