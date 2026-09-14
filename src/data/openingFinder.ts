import type { OpeningLine } from "./openings";
import { openingStyles } from "./openingStyles";

export type ColorAnswer = "white" | "black" | "any";
export type FirstMoveAnswer = "e4" | "d4" | "flank" | "any";
export type RiskAnswer = "low" | "medium" | "high" | "any";
export type ApproachAnswer = "classical" | "hypermodern" | "any";
export type TheoryAnswer = "low" | "medium" | "high" | "any";

export interface FinderAnswers {
  color: ColorAnswer;
  firstMove: FirstMoveAnswer;
  risk: RiskAnswer;
  approach: ApproachAnswer;
  theory: TheoryAnswer;
}

export const DEFAULT_FINDER_ANSWERS: FinderAnswers = {
  color: "any",
  firstMove: "any",
  risk: "any",
  approach: "any",
  theory: "any",
};

// Risk and theory are ladders, not labels: "low" is nearer to "medium" than
// it is to "high". Scoring a near-miss the same as a total mismatch left
// large blocks of lines on identical scores, so the ranking fell back to
// data-file order and kept handing out the same few openings.
const LADDER = ["low", "medium", "high"];

function ordinalScore(answer: string, value: string): number {
  if (answer === value) return 1;
  const a = LADDER.indexOf(answer);
  const v = LADDER.indexOf(value);
  if (a < 0 || v < 0) return 0;
  return Math.abs(a - v) === 1 ? 0.5 : 0;
}

// A second line from a family already picked must beat the alternative by
// more than this to take the slot. Three flavours of the same opening is a
// worse answer to "find me an opening" than three genuinely different ones.
const SAME_FAMILY_PENALTY = 0.75;

// Same convention used to auto-orient Play As on selection: a family or
// line name mentioning "Defence" is the Black side's repertoire.
export function isDefenceLine(line: Pick<OpeningLine, "family" | "name">): boolean {
  return line.family.includes("Defence") || line.name.includes("Defence");
}

/**
 * Ranks openings by how many style axes match the quiz answers. `canonicalLines`
 * (always English) drives classification and scoring so results don't depend on
 * the current UI language; `displayLines` (possibly localized) supplies the
 * objects actually returned, so their text renders in the user's language.
 */
export function recommendOpenings(
  answers: FinderAnswers,
  canonicalLines: OpeningLine[],
  displayLines: OpeningLine[],
  limit = 3,
): OpeningLine[] {
  const displayById = new Map(displayLines.map((line) => [line.id, line]));

  const candidates = canonicalLines.filter((line) => {
    if (answers.color === "any") return true;
    const isBlack = isDefenceLine(line);
    return answers.color === "black" ? isBlack : !isBlack;
  });

  const scored = candidates.map((line) => {
    const style = openingStyles[line.id];
    let score = 0;
    if (style) {
      if (answers.firstMove !== "any" && style.firstMove === answers.firstMove) score += 1;
      if (answers.risk !== "any") score += ordinalScore(answers.risk, style.risk);
      if (answers.approach !== "any" && style.approach === answers.approach) score += 1;
      if (answers.theory !== "any") score += ordinalScore(answers.theory, style.theory);
    }
    return { id: line.id, family: line.family, score };
  });

  // Picked greedily rather than by a plain sort: a plain sort broke every
  // tie by position in the data file, which permanently buried lines whose
  // style profile was shared with an earlier one (the Scandinavian never
  // surfaced for any of the 576 answer combinations) and happily returned
  // three lines from the same family.
  const pool = [...scored];
  const picked: typeof scored = [];
  const usedFamilies = new Set<string>();
  while (picked.length < limit && pool.length > 0) {
    let bestIndex = 0;
    let bestValue = -Infinity;
    pool.forEach((entry, index) => {
      const value = entry.score - (usedFamilies.has(entry.family) ? SAME_FAMILY_PENALTY : 0);
      if (value > bestValue) {
        bestValue = value;
        bestIndex = index;
      }
    });
    const [chosen] = pool.splice(bestIndex, 1);
    picked.push(chosen);
    usedFamilies.add(chosen.family);
  }

  return picked
    .map((entry) => displayById.get(entry.id))
    .filter((line): line is OpeningLine => Boolean(line));
}
