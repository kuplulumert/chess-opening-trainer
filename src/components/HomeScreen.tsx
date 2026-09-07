import { useEffect, useState } from "react";
import type { Theme } from "../hooks/useTheme";
import type { Dictionary, Language } from "../i18n/translations";
import { LanguagePicker } from "./LanguagePicker";
import { ThemeToggle } from "./ThemeToggle";
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
  onStartTrainer: () => void;
  onBrowseOpenings: () => void;
  onOpenSkillMap: () => void;
}

export function HomeScreen({
  t,
  language,
  onSelectLanguage,
  theme,
  onToggleTheme,
  onStartTrainer,
  onBrowseOpenings,
  onOpenSkillMap,
}: HomeScreenProps) {
  const [intro] = useState(() => !introPlayed);
  useEffect(() => {
    introPlayed = true;
  }, []);

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
      <div className="home-theme-toggle">
        <ThemeToggle
          theme={theme}
          label={theme === "dark" ? t.switchToLight : t.switchToDark}
          onToggle={onToggleTheme}
        />
      </div>
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
        <button type="button" className="home-action-card" onClick={onBrowseOpenings}>
          <span className="home-action-title-row">
            <img
              src={`${import.meta.env.BASE_URL}openings-icon.png`}
              alt=""
              className="home-action-icon"
            />
            <span className="home-action-label">{t.home.browseOpenings}</span>
          </span>
          <span className="home-action-hint">{t.home.browseOpeningsHint}</span>
        </button>
        <button type="button" className="home-action-card" onClick={onOpenSkillMap}>
          <span className="home-action-title-row">
            <img
              src={`${import.meta.env.BASE_URL}skillmap-icon.png`}
              alt=""
              className="home-action-icon"
            />
            <span className="home-action-label">{t.home.skillMap}</span>
          </span>
          <span className="home-action-hint">{t.home.skillMapHint}</span>
        </button>
      </div>
    </div>
  );
}
