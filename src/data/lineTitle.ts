import { openings as openingsEn, type OpeningLine } from "./openings";

// Ten lines are simply their family's main line, and are named "Main Line"
// in the data ("Ana Varyant" in Turkish). That names nothing on its own, so
// wherever a line is shown without its family beside it — the board header,
// a recommendation card — the family is the name worth showing.
//
// Keyed by id off the canonical English data for the same reason sideOf is:
// the localized names are different words.
const genericIds = new Set(
  openingsEn.filter((line) => line.name === "Main Line").map((line) => line.id),
);

/** What to call a line where it stands alone, with no family beside it. */
export function lineTitle(line: OpeningLine): string {
  return genericIds.has(line.id) ? line.family : line.name;
}
