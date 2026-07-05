import { getServerEnv, isConfigured } from "@/lib/env";

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

export async function generateWithOpenAI(feature: string, prompt: string) {
  if (!isConfigured("OPENAI_API_KEY") || getServerEnv().OPENAI_API_KEY === "replace_with_openai_key") {
    return {
      text: fallbackAI(feature, prompt),
      provider: "local-fallback",
    };
  }

  const env = getServerEnv();
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a professional e-commerce catalog writer. Write concise, high-converting, marketplace-safe ecommerce listing content for Indian sellers (Amazon, Flipkart, Meesho). Return practical, clean, professional output only without conversational filler.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";
  return { text, provider: "openai" };
}

export async function generateJsonWithOpenAI<T extends Record<string, unknown>>(
  feature: string,
  system: string,
  prompt: string,
  fallback: T,
) {
  if (!isConfigured("OPENAI_API_KEY") || getServerEnv().OPENAI_API_KEY === "replace_with_openai_key") {
    return {
      json: fallback,
      text: JSON.stringify(fallback, null, 2),
      provider: "local-fallback",
      model: DEFAULT_OPENAI_MODEL,
    };
  }

  const env = getServerEnv();
  const model = env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;
  const requestBody = {
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
  };
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "{}";
  try {
    return { json: JSON.parse(text) as T, text, provider: "openai", model };
  } catch {
    const retry = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        ...requestBody,
        messages: [
          { role: "system", content: `${system}\nRepair the previous response into parseable JSON only.` },
          { role: "user", content: `Original task:\n${prompt}\n\nInvalid JSON response:\n${text}` },
        ],
      }),
    });
    if (retry.ok) {
      const retryData = await retry.json();
      const retryText = retryData.choices?.[0]?.message?.content || "{}";
      try {
        return { json: JSON.parse(retryText) as T, text: retryText, provider: "openai", model };
      } catch {
        return { json: fallback, text: JSON.stringify(fallback, null, 2), provider: "local-fallback", model };
      }
    }
    return { json: fallback, text: JSON.stringify(fallback, null, 2), provider: "local-fallback", model };
  }
}

export function fallbackAdvancedTitle(input: Record<string, unknown>) {
  const product = String(input.productName || input.category || "Product").trim();
  const brand = String(input.brand || "").trim();
  const material = String(input.material || "").trim();
  const color = String(input.color || "").trim();
  const category = String(input.category || "").trim();
  const audience = String(input.targetAudience || input.gender || "").trim();
  const titleParts = [brand, color, material, product, category, audience]
    .filter(Boolean)
    .map((part) => part.replace(/\s+/g, " ").trim());
  const bestTitle = Array.from(new Set(titleParts)).join(" | ").slice(0, 140) || "Marketplace Ready Product Listing Title";
  const keywords = String(input.keywords || input.features || category || product)
    .split(/[,|]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);

  return {
    bestTitle,
    titleVariations: [bestTitle],
    titleScore: 86,
    keywordCoverage: keywords.length ? keywords : [product],
    characterCount: bestTitle.length,
    improvementNotes: ["Add material, use-case and platform keyword data for a stronger marketplace title."],
  };
}

export function fallbackFullListing(input: Record<string, unknown>) {
  const title = fallbackAdvancedTitle(input);
  const productName = String(input.productName || input.name || input.category || "Marketplace product").trim();
  const brand = String(input.brand || "").trim();
  const category = String(input.category || "General").trim();
  const material = String(input.material || "").trim();
  const audience = String(input.targetAudience || input.targetCustomer || input.gender || "Indian marketplace buyers").trim();
  const featureText = String(input.features || input.keyFeatures || "").trim();
  const featureList = featureText
    .split(/[\n,|]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
  const skuSeed = productName.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase() || "APS";
  const baseKeywords = Array.from(
    new Set(
      [
        productName,
        brand && `${brand} ${productName}`,
        category && `${category} online`,
        material && `${material} ${productName}`,
        audience && `${productName} for ${audience}`,
        ...title.keywordCoverage,
      ].filter(Boolean).map(String),
    ),
  ).slice(0, 10);
  return {
    generatedTitle: title.bestTitle,
    title: title.bestTitle,
    titleVariations: [title.bestTitle],
    shortDescription: `${brand ? `${brand} ` : ""}${productName} for ${audience}, written with clear marketplace-ready details.`,
    longDescription: `${brand ? `${brand} ` : ""}${productName} is positioned for ${audience} with searchable ${category.toLowerCase()} attributes, natural buying information and seller-safe copy. ${featureList.length ? `Key details include ${featureList.join(", ")}.` : "Add exact product features for even stronger conversion copy."}`,
    bulletPoints: featureList.length
      ? featureList.map((feature) => `${feature} with clear, buyer-friendly marketplace wording`)
      : [
          `Relevant ${category.toLowerCase()} listing copy for ${productName}`,
          "Natural title and description without keyword stuffing",
          "Seller-ready SKU and grouped keyword coverage",
          "Marketplace-safe language with practical improvement tips",
        ],
    keywords: baseKeywords,
    primaryKeywords: baseKeywords.slice(0, 4),
    secondaryKeywords: baseKeywords.slice(4, 8),
    longTailKeywords: baseKeywords.filter((keyword) => keyword.split(/\s+/).length >= 3).slice(0, 5),
    searchTerms: baseKeywords,
    sku: `APS-${skuSeed}-${Date.now().toString().slice(-4)}`,
    categorySuggestion: category,
    productHighlights: featureList.length ? featureList : [`${productName} listing optimized for ${category}`],
    careInstructions: material ? [`Follow care instructions suitable for ${material}.`] : [],
    listingScore: {
      total: 84,
      title: title.titleScore,
      keywords: 82,
      description: 84,
      completeness: 80,
      marketplaceReadiness: 88,
    },
    improvementTips: [
      ...(!brand ? ["Add the product brand for stronger brand-specific content."] : []),
      ...(!featureList.length ? ["Add exact product features to make the copy more conversion-focused."] : []),
      "Add verified dimensions, image details and marketplace category data for a higher score.",
    ],
    marketplaceCompliance: { safe: true, warnings: [], blockedTerms: [] },
  };
}

function fallbackAI(feature: string, prompt: string) {
  const p = prompt.toLowerCase();
  
  // 1. Detect Category & Style
  let title = "";
  let sku = "";
  let reason = "";
  let highlights: string[] = [];
  let keywords: string[] = [];

  if (p.includes("kurti") || p.includes("kurta") || p.includes("saree") || p.includes("ethnic") || p.includes("suit")) {
    title = "Premium Cotton Floral Printed A-Line Kurti for Women";
    sku = "APS-KRT-COT-01";
    reason = "Made with premium breathable organic cotton, this floral printed A-Line kurta features 3/4 sleeves and a clean regular fit, perfectly optimized for comfort and active daily use.";
    highlights = [
      "Fabric Quality: 100% Pure organic cotton that is light-weight, breathable and comfortable on skin.",
      "Vibrant Print: High-grade dye pigments that preserve floral patterns and prevent color bleeding after washes.",
      "Styling Details: Elegant round neck with 3/4 sleeves, regular fit styling matching standard Indian sizing charts.",
      "Perfect for: Office wear, casual outings, family gatherings, and everyday comfortable dressing.",
      "Marketplace Ready: Optimized patterns to match catalog specifications and reduce customer returns."
    ];
    keywords = ["cotton kurti", "printed kurta", "women ethnic wear", "meesho kurta", "flipkart clothing", "summer tunic"];
  } else if (p.includes("tshirt") || p.includes("t-shirt") || p.includes("shirt") || p.includes("top") || p.includes("jeans") || p.includes("denim")) {
    title = "Men's Regular Fit Breathable Cotton Solid Polo T-Shirt";
    sku = "APS-TSH-POLO-02";
    reason = "An essential regular-fit Polo T-shirt crafted from premium pique cotton mesh. It offers superior sweat absorption, a structured lay-flat collar, and a modern clean silhouette.";
    highlights = [
      "Premium Knit: High-quality pique knit cotton offering durability, soft handfeel, and sweat-wicking properties.",
      "Smart Structure: Lay-flat collar and ribbed cuffs that retain shape even after multiple machine wash cycles.",
      "Versatile Styling: Solid minimalist design that pairs effortlessly with casual denims, trousers, or shorts.",
      "Tailored Fit: Custom regular fit contours to body shape without causing restriction or tightness.",
      "Durability: Reinforced stitching at seams to withstand daily wash-and-wear cycles."
    ];
    keywords = ["men polo t-shirt", "solid cotton tee", "casual wear shirt", "amazon fashion men", "branded style polo", "flipkart shopping"];
  } else if (p.includes("shoe") || p.includes("sneaker") || p.includes("sandal") || p.includes("footwear") || p.includes("heel")) {
    title = "Men's Ultra-Lightweight Breathable Mesh Running Shoes";
    sku = "APS-SH-RUN-03";
    reason = "Engineered with responsive Phylon midsole cushioning and a breathable knit mesh upper, these running shoes provide exceptional energy return, high grip, and secure ankle support.";
    highlights = [
      "Responsive Cushioning: Advanced Phylon sole that absorbs landing impact and delivers explosive springback.",
      "Breathable Knit: Flexible woven mesh upper that keeps feet cool and prevents odor buildup during runs.",
      "Skid-Resistant Grip: Durable rubber outsole featuring traction grooves to ensure stability on wet or dry tracks.",
      "Ergonomic Fit: Cushioned collar lining and memory foam insole for maximum step-in comfort.",
      "Modern Aesthetics: Striking aerodynamic details suitable for gym workouts, jogging, and daily street styling."
    ];
    keywords = ["running shoes men", "breathable sneakers", "gym training footwear", "lightweight shoes", "mesh athletic flats"];
  } else if (p.includes("watch") || p.includes("smartwatch") || p.includes("earbud") || p.includes("headphone") || p.includes("gadget") || p.includes("phone")) {
    title = "Smart Fitness Watch with 1.8\" Display, SpO2 & Bluetooth Calling";
    sku = "APS-WT-SMART-04";
    reason = "A premium smartwatch featuring an expansive HD touch screen, dual Bluetooth calling, continuous heart rate tracking, sleep analytics, and 7-day battery life for busy active lifestyles.";
    highlights = [
      "HD Touch Display: Large 1.8-inch curved glass screen with rich color output and 500 nits peak brightness.",
      "Bluetooth Calling: Built-in high-fidelity speaker and microphone for smooth direct calling from your wrist.",
      "Health Tracking: Real-time SpO2 oxygen monitor, 24/7 heart rate monitor, stress tracker, and active step counter.",
      "Multi-Sport Modes: Track sports activities including running, cycling, yoga, walking, and swimming.",
      "Battery Endurance: Robust battery offering up to 7 days of normal use or 25 days on standby mode."
    ];
    keywords = ["smart watch fitness", "bluetooth calling watch", "spo2 tracker watch", "men smartwatch screen", "sport watch battery"];
  } else {
    // Default high quality e-commerce template
    title = "Premium Multi-Utility Ergonomic Home & Office Organizer";
    sku = "APS-ORG-GEN-05";
    reason = "An elegantly designed multi-utility organizer made from heavy-duty rustproof alloy. Features modular adjustable shelving, anti-skid rubber feet, and a space-saving structure.";
    highlights = [
      "Robust Build: Crafted from premium rust-resistant alloy for long-lasting structural strength and load capacity.",
      "Modular Adjustments: Easily reposition shelves and compartments to hold varied sizes of products.",
      "Space Saving: Compact vertical footprint designed to free up desk, shelf, or kitchen counter space.",
      "Anti-Slip Stability: High-friction rubber pads at the base prevent sliding or scratching of surfaces.",
      "Contemporary Look: Matte finish powder-coated surface that blends seamlessly with any modern interior decor."
    ];
    keywords = ["modular organizer", "desk storage shelf", "home utility rack", "rustproof stand", "space saving holder"];
  }

  // Feature logic returns
  if (feature.includes("sku")) {
    return sku;
  }
  if (feature.includes("keyword")) {
    return keywords.join(", ");
  }
  if (feature.includes("score")) {
    return `Listing score: 91/100. Excellent readability, high-converting bullet layout, clean Indian marketplace pricing metrics, and rich keyword coverage. Ready to publish!`;
  }

  // Otherwise return the complete listing details
  return `[MARKETPLACE SEARCH TITLE]
${title}

[CONCISE BUYING REASON]
${reason}

[KEY HIGHLIGHTS / BULLET POINTS]
${highlights.map(h => `• ${h}`).join("\n")}

[CONCISE SEO KEYWORDS]
${keywords.join(", ")}

[PRODUCT SKU ID]
${sku}`;
}
