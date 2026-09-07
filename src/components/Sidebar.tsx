import { useMemo, useState } from "react";
import type { OpeningLine } from "../data/openings";
import { groupByFamily } from "../data/families";
import { sideOf } from "../data/side";
import type { LineProgress } from "../utils/storage";
import type { PlayerColor } from "../hooks/useOpeningTrainer";
import type { Theme } from "../hooks/useTheme";
import type { Dictionary } from "../i18n/translations";
import { ThemeToggle } from "./ThemeToggle";

interface SidebarProps {
  lines: OpeningLine[];
  selectedId: string;
  playerColor: PlayerColor;
  onSelect: (line: OpeningLine) => void;
  onOpenFinder: () => void;
  progress: Record<string, LineProgress>;
  theme: Theme;
  onToggleTheme: () => void;
  t: Dictionary;
}

export function Sidebar({
  lines,
  selectedId,
  playerColor,
  onSelect,
  onOpenFinder,
  progress,
  theme,
  onToggleTheme,
  t,
}: SidebarProps) {
  const [query, setQuery] = useState("");
  // Opens on the side of whatever line is loaded, so the list doesn't
  // start out with the current opening filtered out of view.
  const [side, setSide] = useState(() => sideOf(selectedId));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    // A search looks across both repertoires — if you've typed a name you
    // know what you're after, and hiding it behind the wrong tab is just
    // an empty list with no explanation.
    const bySide = q ? lines : lines.filter((l) => sideOf(l) === side);
    if (!q) return bySide;
    return bySide.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.family.toLowerCase().includes(q) ||
        l.eco.toLowerCase().includes(q),
    );
  }, [lines, query, side]);

  const groups = useMemo(() => groupByFamily(filtered), [filtered]);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-header-row">
          <h1>{t.appTitle}</h1>
          <div className="sidebar-header-toggles">
            <ThemeToggle
              theme={theme}
              label={theme === "dark" ? t.switchToLight : t.switchToDark}
              onToggle={onToggleTheme}
            />
          </div>
        </div>
        <p className="sidebar-subtitle">{t.appSubtitle}</p>
      </div>
      <button type="button" className="finder-trigger" onClick={onOpenFinder}>
        {t.finder.trigger}
      </button>
      <div className="segmented sidebar-side-filter" role="group" aria-label={t.playAs}>
        <button
          type="button"
          className={side === "w" ? "segmented-active" : ""}
          onClick={() => setSide("w")}
        >
          {t.white}
        </button>
        <button
          type="button"
          className={side === "b" ? "segmented-active" : ""}
          onClick={() => setSide("b")}
        >
          {t.black}
        </button>
      </div>
      <input
        className="search-input"
        type="search"
        placeholder={t.searchPlaceholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label={t.searchAriaLabel}
      />
      <nav className="opening-list">
        {groups.map((group) => (
          <div key={group.family} className="opening-group">
            <h2 className="opening-group-title">{group.family}</h2>
            <ul>
              {group.lines.map((line) => {
                const key = `${line.id}:${playerColor}`;
                const mastered = (progress[key]?.completions ?? 0) > 0;
                return (
                  <li key={line.id}>
                    <button
                      type="button"
                      className={
                        "opening-item" + (line.id === selectedId ? " opening-item-active" : "")
                      }
                      onClick={() => onSelect(line)}
                    >
                      <span className="opening-eco">{line.eco}</span>
                      <span className="opening-name">{line.name}</span>
                      {mastered && (
                        <span className="opening-mastered" title={t.masteredTooltip}>
                          ✓
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {groups.length === 0 && <p className="empty-state">{t.noOpeningsMatch(query)}</p>}
      </nav>
    </aside>
  );
}
