import { openings as openingsEn, type OpeningLine } from "./openings";

export type OpeningSide = "w" | "b";

// Which side's repertoire a line belongs to. Defences (the Sicilian, the
// French, and also individual defensive lines inside a White opening, like
// the Berlin within the Ruy Lopez) are Black's; everything else is White's.
//
// Keyed by id off the canonical English data on purpose: the localized
// names don't contain the word "Defence", so classifying by the displayed
// name would put every line under White in Turkish.
const sideById = new Map<string, OpeningSide>(
  openingsEn.map((line) => [
    line.id,
    line.family.includes("Defence") || line.name.includes("Defence") ? "b" : "w",
  ]),
);

export function sideOf(line: OpeningLine | string): OpeningSide {
  return sideById.get(typeof line === "string" ? line : line.id) ?? "w";
}
