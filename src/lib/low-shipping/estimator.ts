// Pure shipping-slab estimator. No IO, no browser APIs — unit tested via
// `npm run test:low-shipping`. All ₹ outputs are ranges from the editable
// rate card and must be displayed with the "estimate only" disclaimer.

import { DEFAULT_RATE_CARD, type RateCard, type RateRange, type Zone } from "./rate-card";

export const VOLUMETRIC_DIVISOR = 5000;

export type EstimatorInput = {
  category: string;
  deadWeightGrams: number;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
};

export type SlabDropSuggestion = {
  possible: boolean;
  alreadyLowest: boolean;
  message: string;
  /** Grams to shed from chargeable weight to reach the lower slab. */
  gramsToDrop: number;
  /** Per-dimension cm reduction that alone would reach the lower slab (only when volumetric dominates). */
  dimensionOptions: Array<{ dimension: "length" | "breadth" | "height"; reduceByCm: number }>;
  estimatedSavingPerOrder: RateRange | null;
};

export type EstimateResult = {
  volumetricKg: number;
  deadKg: number;
  chargeableGrams: number;
  volumetricDominates: boolean;
  slabIndex: number;
  slabLabel: string;
  zoneEstimates: Record<Zone, RateRange>;
  gstPercent: number;
  returnExposure: RateRange;
  dropSuggestion: SlabDropSuggestion;
};

export function volumetricWeightKg(lengthCm: number, breadthCm: number, heightCm: number): number {
  const raw = (lengthCm * breadthCm * heightCm) / VOLUMETRIC_DIVISOR;
  return Math.round(raw * 1000) / 1000;
}

export function chargeableWeightGrams(
  deadWeightGrams: number,
  lengthCm: number,
  breadthCm: number,
  heightCm: number,
): number {
  return Math.max(deadWeightGrams, volumetricWeightKg(lengthCm, breadthCm, heightCm) * 1000);
}

/**
 * Slab index for a chargeable weight. Weights beyond the last defined slab
 * keep extending in +500g virtual slabs (priced via extraPerHalfKg).
 */
export function findSlabIndex(chargeableGrams: number, card: RateCard = DEFAULT_RATE_CARD): number {
  const index = card.slabs.findIndex((slab) => chargeableGrams <= slab.maxGrams);
  if (index !== -1) return index;
  const lastMax = card.slabs[card.slabs.length - 1].maxGrams;
  const extra = Math.ceil((chargeableGrams - lastMax) / 500);
  return card.slabs.length - 1 + extra;
}

export function slabLabelFor(slabIndex: number, card: RateCard = DEFAULT_RATE_CARD): string {
  if (slabIndex < card.slabs.length) return card.slabs[slabIndex].label;
  const extra = slabIndex - (card.slabs.length - 1);
  const lastMax = card.slabs[card.slabs.length - 1].maxGrams;
  const from = (lastMax + (extra - 1) * 500) / 1000;
  const to = (lastMax + extra * 500) / 1000;
  return `${from}kg–${to}kg`;
}

export function ratesForSlab(slabIndex: number, card: RateCard = DEFAULT_RATE_CARD): Record<Zone, RateRange> {
  if (slabIndex < card.slabs.length) return card.slabs[slabIndex].rates;
  const last = card.slabs[card.slabs.length - 1].rates;
  const extra = slabIndex - (card.slabs.length - 1);
  const zones: Zone[] = ["local", "zonal", "national"];
  const result = {} as Record<Zone, RateRange>;
  for (const zone of zones) {
    result[zone] = {
      min: Math.round(last[zone].min + extra * card.extraPerHalfKg[zone].min),
      max: Math.round(last[zone].max + extra * card.extraPerHalfKg[zone].max),
    };
  }
  return result;
}

/** Lower bound (grams, exclusive floor) of a slab — i.e. the previous slab's max. */
function slabFloorGrams(slabIndex: number, card: RateCard): number {
  if (slabIndex <= 0) return 0;
  if (slabIndex <= card.slabs.length - 1) return card.slabs[slabIndex - 1].maxGrams;
  const lastMax = card.slabs[card.slabs.length - 1].maxGrams;
  return lastMax + (slabIndex - card.slabs.length) * 500;
}

export function buildDropSuggestion(
  input: EstimatorInput,
  card: RateCard = DEFAULT_RATE_CARD,
): SlabDropSuggestion {
  const chargeable = chargeableWeightGrams(
    input.deadWeightGrams,
    input.lengthCm,
    input.breadthCm,
    input.heightCm,
  );
  const slabIndex = findSlabIndex(chargeable, card);

  if (slabIndex === 0) {
    return {
      possible: false,
      alreadyLowest: true,
      message: "Already in the lowest slab — image compactness is now your main lever.",
      gramsToDrop: 0,
      dimensionOptions: [],
      estimatedSavingPerOrder: null,
    };
  }

  const targetGrams = slabFloorGrams(slabIndex, card); // need chargeable <= this
  const gramsToDrop = Math.ceil(chargeable - targetGrams);
  const volumetric = volumetricWeightKg(input.lengthCm, input.breadthCm, input.heightCm) * 1000;
  const volumetricDominates = volumetric > input.deadWeightGrams;

  const dimensionOptions: SlabDropSuggestion["dimensionOptions"] = [];
  if (volumetricDominates) {
    // Target volumetric grams must also be <= max(targetGrams, dead weight);
    // dropping below dead weight has no effect.
    const targetVolumetricGrams = Math.max(targetGrams, input.deadWeightGrams);
    const targetVolumeCm3 = (targetVolumetricGrams / 1000) * VOLUMETRIC_DIVISOR;
    const dims = [
      { dimension: "length" as const, value: input.lengthCm, others: input.breadthCm * input.heightCm },
      { dimension: "breadth" as const, value: input.breadthCm, others: input.lengthCm * input.heightCm },
      { dimension: "height" as const, value: input.heightCm, others: input.lengthCm * input.breadthCm },
    ];
    for (const dim of dims) {
      if (dim.others <= 0) continue;
      const needed = targetVolumeCm3 / dim.others;
      const reduceBy = Math.ceil((dim.value - needed) * 10) / 10;
      if (reduceBy > 0 && reduceBy < dim.value) {
        dimensionOptions.push({ dimension: dim.dimension, reduceByCm: reduceBy });
      }
    }
    dimensionOptions.sort((a, b) => a.reduceByCm - b.reduceByCm);
  }

  const current = ratesForSlab(slabIndex, card);
  const lower = ratesForSlab(slabIndex - 1, card);
  const saving: RateRange = {
    min: Math.max(0, current.national.min - lower.national.min),
    max: Math.max(0, current.national.max - lower.national.max),
  };

  const parts: string[] = [];
  if (volumetricDominates && dimensionOptions.length) {
    const best = dimensionOptions[0];
    parts.push(`Reduce packed ${best.dimension} by ${best.reduceByCm}cm`);
  }
  if (!volumetricDominates || input.deadWeightGrams > targetGrams) {
    parts.push(`reduce weight by ${gramsToDrop}g`);
  }
  const action = parts.length ? parts.join(" OR ") : `reduce chargeable weight by ${gramsToDrop}g`;
  const message = `${action} to fall into the ${slabLabelFor(slabIndex - 1, card)} slab and save ~₹${saving.min}–₹${saving.max}/order (national, estimate).`;

  return {
    possible: true,
    alreadyLowest: false,
    message,
    gramsToDrop,
    dimensionOptions,
    estimatedSavingPerOrder: saving,
  };
}

export function estimateShipping(input: EstimatorInput, card: RateCard = DEFAULT_RATE_CARD): EstimateResult {
  const volumetricKg = volumetricWeightKg(input.lengthCm, input.breadthCm, input.heightCm);
  const deadKg = input.deadWeightGrams / 1000;
  const chargeableGrams = Math.round(chargeableWeightGrams(
    input.deadWeightGrams,
    input.lengthCm,
    input.breadthCm,
    input.heightCm,
  ));
  const slabIndex = findSlabIndex(chargeableGrams, card);
  const zoneEstimates = ratesForSlab(slabIndex, card);

  return {
    volumetricKg,
    deadKg,
    chargeableGrams,
    volumetricDominates: volumetricKg * 1000 > input.deadWeightGrams,
    slabIndex,
    slabLabel: slabLabelFor(slabIndex, card),
    zoneEstimates,
    gstPercent: card.gstRatePercent,
    returnExposure: {
      min: Math.round(zoneEstimates.national.min * card.returnMultiplier),
      max: Math.round(zoneEstimates.national.max * card.returnMultiplier),
    },
    dropSuggestion: buildDropSuggestion(input, card),
  };
}
