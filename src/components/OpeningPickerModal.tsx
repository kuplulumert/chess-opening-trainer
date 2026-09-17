import { useState } from "react";
import type { OpeningLine } from "../data/openings";
import { sideOf } from "../data/side";
import type { Dictionary } from "../i18n/translations";
import "./OpeningPickerModal.css";

interface OpeningPickerModalProps {
  openings: OpeningLine[];
  t: Dictionary;
  onPick: (line: OpeningLine) => void;
  onClose: () => void;
}

// A plain list of lines with a search box, a close button and a backdrop
// that dismisses — the two ways out a mis-tap needs. Used to fill a My
// openings slot, and from the board's opening name, which used to swap the
// whole screen for the openings tab and leave no way back.
export function OpeningPickerModal({ openings, t, onPick, onClose }: OpeningPickerModalProps) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const matches = needle
    ? openings.filter((line) =>
        `${line.eco} ${line.name} ${line.family}`.toLowerCase().includes(needle),
      )
    : openings;

  return (
    <div className="finder-overlay" onClick={onClose}>
      <div className="finder-modal opening-picker" onClick={(event) => event.stopPropagation()}>
        <div className="finder-header">
          <h2>{t.pickOpening}</h2>
          <button
            type="button"
            className="finder-close"
            onClick={onClose}
            aria-label={t.finder.close}
          >
            ×
          </button>
        </div>
        <input
          className="search-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.searchPlaceholder}
          aria-label={t.searchAriaLabel}
        />
        <div className="opening-picker-list">
          {matches.map((line) => (
            <button
              key={line.id}
              type="button"
              className="opening-picker-item"
              onClick={() => onPick(line)}
            >
              <span className="opening-eco">{line.eco}</span>
              {/* Family first: ten of the lines are called "Main line", so
                  the variation name on its own names nothing. */}
              <span className="opening-picker-text">
                <span className="opening-picker-family">{line.family}</span>
                <span className="opening-picker-name">{line.name}</span>
              </span>
              <span className="opening-picker-side">
                {sideOf(line.id) === "w" ? t.white : t.black}
              </span>
            </button>
          ))}
          {matches.length === 0 && <p className="empty-state">{t.noOpeningsMatch(query)}</p>}
        </div>
      </div>
    </div>
  );
}
