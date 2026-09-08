import {
  buildFamilyMap,
  completionsToNextMedal,
  computeRank,
  MEDAL_KEYS,
} from "../data/skillMap";
import { getDueLines } from "../data/dueLines";
import type { OpeningLine } from "../data/openings";
import type { LineProgress } from "../utils/storage";
import type { PlayerColor } from "../hooks/useOpeningTrainer";
import type { Dictionary } from "../i18n/translations";
import { HowToUseBanner } from "./HowToUseBanner";
import "./SkillMap.css";

interface SkillMapProps {
  openings: OpeningLine[];
  progress: Record<string, LineProgress>;
  t: Dictionary;
  onTrainLine: (line: OpeningLine) => void;
  /** A due-review pick carries its own color — the side that was actually
   *  quizzed, which onTrainLine's family-default assignment might not match. */
  onReviewDue: (line: OpeningLine, color: PlayerColor) => void;
}

function nodeTitle(t: Dictionary, completions: number, medalTier: number): string {
  if (completions === 0) return t.map.lineLockedHint;
  const medalName = t.map.medalNames[medalTier];
  const remaining = completionsToNextMedal(completions);
  const hint = remaining === null ? t.map.maxMedalHint : t.map.nextMedalHint(remaining, t.map.medalNames[medalTier + 1]);
  return `${medalName} · ${t.map.completionsLabel(completions)} · ${hint}`;
}

export function SkillMap({ openings, progress, t, onTrainLine, onReviewDue }: SkillMapProps) {
  const familyMap = buildFamilyMap(openings, progress);
  const { points, total, tier } = computeRank(familyMap);
  const rankTitle = t.map.rankTitles[tier];
  const dueLines = getDueLines(openings, progress);

  return (
    <div className="skill-map">
      <div className="skill-map-hero">
        <img
          src={`${import.meta.env.BASE_URL}skillmap-icon.png`}
          alt=""
          className="skill-map-hero-icon"
        />
      </div>

      <HowToUseBanner
        text={t.map.howToUse}
        dismissLabel={t.dismissGuide}
        storageKey="chess-opening-trainer-map-guide-dismissed"
      />

      {dueLines.length > 0 && (
        <div className="due-review">
          <h2 className="due-review-title">{t.map.dueTitle}</h2>
          <p className="due-review-subtitle">{t.map.dueSubtitle(dueLines.length)}</p>
          <div className="due-review-list">
            {dueLines.map(({ line, color, daysOverdue }) => (
              <button
                key={`${line.id}:${color}`}
                type="button"
                className="due-review-item"
                onClick={() => onReviewDue(line, color)}
              >
                <span className="due-review-eco">{line.eco}</span>
                <span className="due-review-name">{line.name}</span>
                <span className="due-review-side">{color === "w" ? t.white : t.black}</span>
                <span className="due-review-days">{t.map.dueDaysLabel(daysOverdue)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="skill-map-header">
        <div>
          <h1>{t.map.title}</h1>
          <p className="skill-map-subtitle">{t.map.subtitle}</p>
        </div>
        <div className="skill-map-rank">
          <p className="skill-map-rank-title">{rankTitle}</p>
          <p className="skill-map-rank-points">{t.map.pointsLabel(points, total)}</p>
        </div>
      </div>

      <div className="skill-map-grid">
        {familyMap.map(({ family, lines, capstoneTier }) => (
          <div key={family} className="constellation-card">
            <button
              type="button"
              className={`constellation-node constellation-capstone constellation-node-${MEDAL_KEYS[capstoneTier]}`}
              title={
                capstoneTier === 0
                  ? t.map.capstoneLockedHint
                  : t.map.capstoneLabel(family, t.map.medalNames[capstoneTier])
              }
              disabled
            >
              ★
            </button>
            <div className="constellation-connector" />
            <p className="constellation-family">{family}</p>
            <div className="constellation-lines">
              {lines.map(({ line, completions, medalTier }) => (
                <div key={line.id} className="constellation-node-wrap">
                  <button
                    type="button"
                    className={`constellation-node constellation-node-${MEDAL_KEYS[medalTier]}`}
                    onClick={() => onTrainLine(line)}
                    title={nodeTitle(t, completions, medalTier)}
                  >
                    {line.eco}
                    {completions > 0 && <span className="constellation-node-badge">×{completions}</span>}
                  </button>
                  <p className="constellation-node-label">{line.name}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
