// "Perceived Bulk Score" heuristic (0–100, lower = product likely perceived
// as more compact by marketplace vision systems). This is a HEURISTIC, not a
// guarantee — always labelled as such in the UI.

export type BulkScoreInput = {
  /** Product bounding-box area ÷ canvas area, 0..1 */
  areaRatio: number;
  /** Fraction of canvas edges the product bbox touches (0, 0.25, 0.5, 0.75, 1). */
  edgeTouchRatio: number;
  /** Non-white pixel ratio OUTSIDE the product bbox (residual clutter), 0..1 */
  clutterRatio: number;
};

export function computeBulkScore(input: BulkScoreInput): number {
  const area = clamp01(input.areaRatio);
  const edge = clamp01(input.edgeTouchRatio);
  const clutter = clamp01(input.clutterRatio);

  // Area dominates perceived bulk; edge-touching implies the product is
  // larger than the frame; clutter reads as extra package contents.
  const score = area * 70 + edge * 12 + Math.min(1, clutter * 4) * 18;
  return Math.round(Math.min(100, Math.max(0, score)));
}

export function bulkScoreTone(score: number): "green" | "amber" | "red" {
  if (score < 35) return "green";
  if (score <= 60) return "amber";
  return "red";
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
