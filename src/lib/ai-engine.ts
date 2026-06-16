import { z } from "zod";
import { fallbackFullListing, generateJsonWithOpenAI } from "@/lib/openai";
import { getPlanAIConfig, normalizePlan } from "@/lib/listing-usage";

export const aiListingInputSchema = z.object({
  productName: z.string().min(2),
  brand: z.string().min(1, "Brand is required for brand-related AI content"),
  category: z.string().optional().default(""),
  platform: z.string().optional().default("meesho"),
  targetPlatform: z.string().optional(),
  price: z.coerce.number().optional(),
  sellingPrice: z.coerce.number().optional(),
  mrp: z.coerce.number().optional(),
  color: z.string().optional().default(""),
  size: z.string().optional().default(""),
  material: z.string().optional().default(""),
  gender: z.string().optional().default(""),
  occasion: z.string().optional().default(""),
  targetAudience: z.string().optional().default(""),
  targetCustomer: z.string().optional().default(""),
  inputFeatures: z.string().optional().default(""),
  keyFeatures: z.string().optional().default(""),
  features: z.string().optional().default(""),
  keywords: z.string().optional().default(""),
  tone: z.string().optional().default("marketplace optimized"),
});

export const keywordResearchInputSchema = z.object({
  productName: z.string().min(2),
  seedKeyword: z.string().min(2),
  brand: z.string().min(1, "Brand is required for brand-related keyword research"),
  category: z.string().optional().default(""),
  platform: z.string().optional().default("meesho"),
  targetAudience: z.string().optional().default(""),
  priceRange: z.string().optional().default(""),
  season: z.string().optional().default(""),
  competitorTitle: z.string().optional().default(""),
});

export function listingSystemPrompt() {
  return "You are an expert Indian e-commerce listing strategist, SEO copywriter and marketplace optimization specialist for Meesho, Flipkart, Amazon and other Indian marketplaces. Create marketplace-safe, high-conversion, SEO-friendly product listings. Output must be relevant to the product and brand, not generic. Avoid false claims, medical claims, trademark misuse, misleading guarantees, spammy keyword stuffing and unsupported superlatives. Keep language simple, seller-friendly and conversion-focused. Return valid JSON only.";
}

export function keywordSystemPrompt() {
  return "You are an expert Indian marketplace keyword research specialist. Generate highly relevant keywords for product listings on Meesho, Flipkart, Amazon and similar marketplaces. Keywords must be relevant to the product and brand, buyer-intent focused and useful for product title, description, tags and search terms. Do not create irrelevant keywords. Return valid JSON only.";
}

export async function generateAIListing(data: z.infer<typeof aiListingInputSchema>, plan?: string) {
  const config = getPlanAIConfig(plan);
  const normalized = {
    ...data,
    platform: data.targetPlatform || data.platform,
    price: data.price ?? data.sellingPrice,
    targetAudience: data.targetAudience || data.targetCustomer,
    features: data.inputFeatures || data.keyFeatures || data.features,
  };
  const prompt = `Create an advanced AI-powered product listing.
Product data:
Product name: ${normalized.productName}
Brand: ${normalized.brand}
Category: ${normalized.category}
Platform: ${normalized.platform}
Price: ${normalized.price ?? ""}
MRP: ${normalized.mrp ?? ""}
Color: ${normalized.color}
Size: ${normalized.size}
Material: ${normalized.material}
Gender: ${normalized.gender}
Occasion: ${normalized.occasion}
Target audience: ${normalized.targetAudience}
Features: ${normalized.features}
Existing keywords: ${normalized.keywords}
Tone: ${normalized.tone}

Rules:
Generate final marketplace-ready content only.
Use the provided brand naturally where relevant.
Title must include strong searchable terms naturally.
Description must be clear, useful and buyer-focused.
Keywords must be relevant and grouped.
SKU must be clean and seller-friendly.
Generate ${config.titleVariations} title variation(s).
Do not use emojis, ALL CAPS, irrelevant terms, placeholders, or generic filler.
Do not overpromise or invent brand claims.
If input is weak, generate with available data and mention missing data in improvementTips.

Return valid JSON only:
{"generatedTitle":"string","titleVariations":["string"],"shortDescription":"string","longDescription":"string","bulletPoints":["string"],"primaryKeywords":["string"],"secondaryKeywords":["string"],"longTailKeywords":["string"],"searchTerms":["string"],"sku":"string","categorySuggestion":"string","productHighlights":["string"],"careInstructions":["string"],"listingScore":{"total":number,"title":number,"keywords":number,"description":number,"completeness":number,"marketplaceReadiness":number},"improvementTips":["string"],"marketplaceCompliance":{"safe":boolean,"warnings":["string"],"blockedTerms":["string"]}}`;

  const fallback = fallbackFullListing(normalized);
  const result = await generateJsonWithOpenAI("ai-listing", listingSystemPrompt(), prompt, fallback);
  const output = result.json as Record<string, unknown>;
  output.generatedTitle = String(output.generatedTitle || output.title || fallback.generatedTitle);
  output.title = String(output.generatedTitle);
  output.keywords = [
    ...toList(output.primaryKeywords),
    ...toList(output.secondaryKeywords),
    ...toList(output.longTailKeywords),
  ].filter(Boolean);
  return { ...result, json: output, prompt };
}

export async function generateKeywordReport(data: z.infer<typeof keywordResearchInputSchema>) {
  const prompt = `Create keyword research report.
Input:
Product name: ${data.productName}
Brand: ${data.brand}
Seed keyword: ${data.seedKeyword}
Category: ${data.category}
Platform: ${data.platform}
Target audience: ${data.targetAudience}
Price range: ${data.priceRange}
Season/festival: ${data.season}
Competitor title: ${data.competitorTitle}

Rules:
Return final product-specific keywords only.
Use the brand only where it is relevant and not spammy.
Separate primary, secondary and long-tail keywords.
Avoid repeated, generic or irrelevant keywords.
Do not use placeholders.

Return valid JSON only:
{"primaryKeywords":["string"],"secondaryKeywords":["string"],"longTailKeywords":["string"],"buyerIntentKeywords":["string"],"seasonalKeywords":["string"],"titleKeywords":["string"],"descriptionKeywords":["string"],"negativeKeywords":["string"],"keywordClusters":[{"clusterName":"string","keywords":["string"],"usage":"title | description | tags | ads"}],"keywordDifficulty":{"level":"low | medium | high","reason":"string"},"opportunityScore":number,"searchIntent":"string","recommendedTitleTerms":["string"],"recommendedTags":["string"],"contentSuggestions":["string"]}`;

  const fallback = fallbackKeywordReport(data);
  const result = await generateJsonWithOpenAI("keyword-research", keywordSystemPrompt(), prompt, fallback);
  return { ...result, prompt };
}

function fallbackKeywordReport(data: z.infer<typeof keywordResearchInputSchema>) {
  const base = [data.seedKeyword, data.productName, data.brand, data.category].filter(Boolean);
  const primaryKeywords = Array.from(new Set([`${data.brand} ${data.productName}`, data.seedKeyword, data.productName].filter(Boolean)));
  const secondaryKeywords = Array.from(new Set(base.map((item) => `${item} online`).concat(base.map((item) => `${item} for ${data.platform}`)))).slice(0, 8);
  const longTailKeywords = [
    `${data.productName} for ${data.targetAudience || "Indian buyers"}`,
    `${data.brand} ${data.category || data.productName} ${data.platform}`,
    `buy ${data.seedKeyword} online India`,
  ];
  return {
    primaryKeywords,
    secondaryKeywords,
    longTailKeywords,
    buyerIntentKeywords: [`buy ${data.seedKeyword}`, `${data.seedKeyword} price`, `${data.productName} online`],
    seasonalKeywords: data.season ? [`${data.seedKeyword} for ${data.season}`] : [],
    titleKeywords: primaryKeywords.slice(0, 4),
    descriptionKeywords: secondaryKeywords.slice(0, 6),
    negativeKeywords: ["free", "duplicate", "fake", "used"],
    keywordClusters: [
      { clusterName: "Core product", keywords: primaryKeywords, usage: "title" },
      { clusterName: "Buyer intent", keywords: [`buy ${data.seedKeyword}`, `${data.seedKeyword} price`], usage: "tags" },
    ],
    keywordDifficulty: { level: "medium", reason: "Use exact product, brand and marketplace terms to avoid broad competition." },
    opportunityScore: 78,
    searchIntent: `Buyers are searching for ${data.productName} with clear brand, category and price-fit details.`,
    recommendedTitleTerms: primaryKeywords.slice(0, 5),
    recommendedTags: [...primaryKeywords, ...secondaryKeywords].slice(0, 10),
    contentSuggestions: ["Use the brand, product type, material and audience in the title naturally."],
  };
}

function toList(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

export function planAtTime(plan?: string) {
  return normalizePlan(plan);
}
