// Unit tests for the pure low-shipping engine (estimator + bulk score).
// Run with: npm run test:low-shipping
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildDropSuggestion,
  chargeableWeightGrams,
  estimateShipping,
  findSlabIndex,
  ratesForSlab,
  slabLabelFor,
  volumetricWeightKg,
} from "./estimator";
import { computeBulkScore, bulkScoreTone } from "./bulk-score";
import { DEFAULT_RATE_CARD } from "./rate-card";

test("volumetric weight: 15×12×4 cm = 0.144 kg", () => {
  assert.equal(volumetricWeightKg(15, 12, 4), 0.144);
});

test("chargeable weight = max(dead, volumetric)", () => {
  // 120g dead vs 144g volumetric → 144g
  assert.equal(chargeableWeightGrams(120, 15, 12, 4), 144);
  // 300g dead vs 144g volumetric → 300g
  assert.equal(chargeableWeightGrams(300, 15, 12, 4), 300);
});

test("acceptance case: 120g, 15×12×4, jewellery → 0–500g slab, already lowest", () => {
  const result = estimateShipping({
    category: "jewellery",
    deadWeightGrams: 120,
    lengthCm: 15,
    breadthCm: 12,
    heightCm: 4,
  });
  assert.equal(result.volumetricKg, 0.144);
  assert.equal(result.chargeableGrams, 144);
  assert.equal(result.slabIndex, 0);
  assert.equal(result.slabLabel, "0–500g");
  assert.equal(result.volumetricDominates, true);
  assert.equal(result.dropSuggestion.alreadyLowest, true);
  assert.match(result.dropSuggestion.message, /lowest slab/i);
  // Seeded defaults: national 65–90 for slab 0.
  assert.deepEqual(result.zoneEstimates.national, { min: 65, max: 90 });
  assert.equal(result.gstPercent, 18);
});

test("slab selection: boundaries and beyond-last-slab extension", () => {
  assert.equal(findSlabIndex(500), 0);
  assert.equal(findSlabIndex(501), 1);
  assert.equal(findSlabIndex(1000), 1);
  assert.equal(findSlabIndex(2000), 3);
  assert.equal(findSlabIndex(2001), 4); // virtual 2–2.5kg slab
  assert.equal(findSlabIndex(3200), 6); // 3–3.5kg
  assert.equal(slabLabelFor(4), "2kg–2.5kg");
});

test("rates beyond last slab add extraPerHalfKg per extra slab", () => {
  const last = DEFAULT_RATE_CARD.slabs[3].rates.national;
  const extra = DEFAULT_RATE_CARD.extraPerHalfKg.national;
  const virtual = ratesForSlab(5); // two extra half-kg steps
  assert.equal(virtual.national.min, last.min + 2 * extra.min);
  assert.equal(virtual.national.max, last.max + 2 * extra.max);
});

test("slab-drop suggestion: weight-dominated product", () => {
  // 560g dead weight, small box → weight dominates, need to drop 60g.
  const suggestion = buildDropSuggestion({
    category: "kurti",
    deadWeightGrams: 560,
    lengthCm: 20,
    breadthCm: 15,
    heightCm: 3,
  });
  assert.equal(suggestion.alreadyLowest, false);
  assert.equal(suggestion.gramsToDrop, 60);
  assert.equal(suggestion.dimensionOptions.length, 0);
  assert.match(suggestion.message, /reduce weight by 60g/);
  assert.match(suggestion.message, /0–500g/);
});

test("slab-drop suggestion: volumetric-dominated product offers cm reductions", () => {
  // 200g dead, 25×20×6 = 3000cm³ → 600g volumetric → slab 1.
  const suggestion = buildDropSuggestion({
    category: "home",
    deadWeightGrams: 200,
    lengthCm: 25,
    breadthCm: 20,
    heightCm: 6,
  });
  assert.equal(suggestion.alreadyLowest, false);
  assert.ok(suggestion.dimensionOptions.length > 0);
  // Height is the cheapest reduction: need volume ≤ 2500cm³ → height ≤ 5cm → reduce by 1cm.
  const best = suggestion.dimensionOptions[0];
  assert.equal(best.dimension, "height");
  assert.equal(best.reduceByCm, 1);
  assert.ok(suggestion.estimatedSavingPerOrder!.min >= 0);
});

test("bulk score: decreases with smaller area, labelled tones", () => {
  const v4 = computeBulkScore({ areaRatio: 0.85 * 0.85, edgeTouchRatio: 0, clutterRatio: 0 });
  const v1 = computeBulkScore({ areaRatio: 0.7 * 0.7, edgeTouchRatio: 0, clutterRatio: 0 });
  const v2 = computeBulkScore({ areaRatio: 0.55 * 0.55, edgeTouchRatio: 0, clutterRatio: 0 });
  const v3 = computeBulkScore({ areaRatio: 0.4 * 0.4, edgeTouchRatio: 0, clutterRatio: 0 });
  // Acceptance: score visibly decreases V4 → V1 → V2 → V3.
  assert.ok(v4 > v1 && v1 > v2 && v2 > v3, `expected ${v4} > ${v1} > ${v2} > ${v3}`);
  assert.equal(bulkScoreTone(v3), "green");
  assert.equal(bulkScoreTone(v4), "amber");
});

test("bulk score: clutter and edge-touch add penalty, clamps to 0..100", () => {
  const clean = computeBulkScore({ areaRatio: 0.5, edgeTouchRatio: 0, clutterRatio: 0 });
  const cluttered = computeBulkScore({ areaRatio: 0.5, edgeTouchRatio: 1, clutterRatio: 0.5 });
  assert.ok(cluttered > clean);
  assert.equal(computeBulkScore({ areaRatio: 5, edgeTouchRatio: 5, clutterRatio: 5 }), 100);
  assert.equal(computeBulkScore({ areaRatio: -1, edgeTouchRatio: 0, clutterRatio: 0 }), 0);
});
