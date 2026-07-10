// Meesho has no public rate card and revises rates roughly quarterly.
// Everything here is an EDITABLE, INDICATIVE default. The UI persists a
// user-edited copy in localStorage (webapp) / chrome.storage (extension)
// and always shows the "estimate only" disclaimer next to ₹ figures.

export type Zone = "local" | "zonal" | "national";

export type RateRange = { min: number; max: number };

export type RateSlab = {
  /** Upper bound of the slab in grams (inclusive). */
  maxGrams: number;
  label: string;
  rates: Record<Zone, RateRange>;
};

export type RateCard = {
  version: number;
  updatedAt: string;
  note: string;
  slabs: RateSlab[];
  /** Added per extra 500g beyond the last defined slab. */
  extraPerHalfKg: Record<Zone, RateRange>;
  /** Indicative return shipping exposure per slab position (forward + return). */
  returnMultiplier: number;
  gstRatePercent: number;
};

export const DEFAULT_RATE_CARD: RateCard = {
  version: 1,
  updatedAt: "2026-07-01",
  note: "Indicative defaults. Meesho revises rates roughly quarterly — edit these to match your latest supplier panel quotes.",
  slabs: [
    {
      maxGrams: 500,
      label: "0–500g",
      rates: {
        local: { min: 27, max: 45 },
        zonal: { min: 55, max: 70 },
        national: { min: 65, max: 90 },
      },
    },
    {
      maxGrams: 1000,
      label: "500g–1kg",
      rates: {
        local: { min: 45, max: 68 },
        zonal: { min: 68, max: 95 },
        national: { min: 80, max: 120 },
      },
    },
    {
      maxGrams: 1500,
      label: "1kg–1.5kg",
      rates: {
        local: { min: 62, max: 90 },
        zonal: { min: 88, max: 120 },
        national: { min: 100, max: 150 },
      },
    },
    {
      maxGrams: 2000,
      label: "1.5kg–2kg",
      rates: {
        local: { min: 80, max: 112 },
        zonal: { min: 108, max: 145 },
        national: { min: 120, max: 180 },
      },
    },
  ],
  extraPerHalfKg: {
    local: { min: 18, max: 26 },
    zonal: { min: 22, max: 30 },
    national: { min: 26, max: 36 },
  },
  returnMultiplier: 1.8,
  gstRatePercent: 18,
};

export const LOW_SHIPPING_CATEGORIES = [
  "jewellery",
  "saree",
  "kurti",
  "western wear",
  "footwear",
  "home",
  "kitchen",
  "kids",
  "beauty",
  "electronics accessories",
  "other",
] as const;

export type LowShippingCategory = (typeof LOW_SHIPPING_CATEGORIES)[number];

export function isValidRateCard(value: unknown): value is RateCard {
  if (!value || typeof value !== "object") return false;
  const card = value as RateCard;
  return (
    Array.isArray(card.slabs) &&
    card.slabs.length > 0 &&
    card.slabs.every(
      (slab) =>
        typeof slab.maxGrams === "number" &&
        slab.rates &&
        (["local", "zonal", "national"] as Zone[]).every(
          (zone) =>
            typeof slab.rates[zone]?.min === "number" && typeof slab.rates[zone]?.max === "number",
        ),
    )
  );
}
