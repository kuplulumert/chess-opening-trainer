import { useState } from "react";
import type { OpeningLine } from "../data/openings";
import { sideOf } from "../data/side";
import type { Dictionary } from "../i18n/translations";
import { MAX_FAVOURITES } from "../utils/favourites";
import { OpeningPickerModal } from "./OpeningPickerModal";
import "./MyOpenings.css";

interface MyOpeningsProps {
  openings: OpeningLine[];
  /** Line ids, in the order they were picked; at most MAX_FAVOURITES. */
  favouriteIds: string[];
  t: Dictionary;
  onTrain: (line: OpeningLine) => void;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
}

// Home's quick-access screen: the two openings the trainee is on, one tap
// from launch. Empty slots say so and open the picker.
export function MyOpenings({ openings, favouriteIds, t, onTrain, onAdd, onRemove }: MyOpeningsProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const chosen = favouriteIds
    .map((id) => openings.find((line) => line.id === id))
    .filter((line): line is OpeningLine => Boolean(line));
  const slots = Array.from({ length: MAX_FAVOURITES }, (_, i) => chosen[i]);

  return (
    <div className="my-openings">
      <header className="my-openings-head">
        <h1 className="my-openings-title">{t.myOpenings.title}</h1>
        <p className="my-openings-subtitle">{t.myOpenings.subtitle(MAX_FAVOURITES)}</p>
      </header>

      <div className="my-openings-slots">
        {slots.map((line, index) =>
          line ? (
            <div key={line.id} className="info-card my-openings-card">
              <button
                type="button"
                className="my-openings-card-main"
                onClick={() => onTrain(line)}
              >
                <span className="my-openings-card-eco">{line.eco}</span>
                {/* Family on top: the variation is "Main line" on ten of
                    the lines, which names nothing on its own. */}
                <span className="my-openings-card-name">{line.family}</span>
                <span className="my-openings-card-meta">
                  {line.name} · {sideOf(line.id) === "w" ? t.white : t.black}
                </span>
              </button>
              <button
                type="button"
                className="my-openings-remove"
                onClick={() => onRemove(line.id)}
                aria-label={t.myOpenings.remove}
                title={t.myOpenings.remove}
              >
                ×
              </button>
            </div>
          ) : (
            <button
              key={`empty-${index}`}
              type="button"
              className="my-openings-empty"
              onClick={() => setPickerOpen(true)}
            >
              <span className="my-openings-plus" aria-hidden="true">
                +
              </span>
              {t.myOpenings.addSlot}
            </button>
          ),
        )}
      </div>

      {pickerOpen && (
        <OpeningPickerModal
          // Already-picked lines are left out: the slots are the only way to
          // hold one, so offering it again could only replace it with itself.
          openings={openings.filter((line) => !favouriteIds.includes(line.id))}
          t={t}
          onPick={(line) => {
            onAdd(line.id);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
