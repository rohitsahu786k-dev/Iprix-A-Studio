// Single source for all user-facing Low-Shipping strings so they can be
// translated to Hinglish in one place. `hi` variants are simple Hinglish.

export const LOW_SHIPPING_STRINGS = {
  disclaimer: {
    en: "Estimate only — confirm the final charge in your Meesho Supplier Panel. Rates vary by courier, zone and category, and Meesho revises them regularly.",
    hi: "Sirf estimate hai — final shipping charge apne Meesho Supplier Panel me hi confirm karein. Rates courier, zone aur category ke hisaab se badalte rehte hain.",
  },
  honestImageWarning: {
    en: "Keep images honest: same product, same shape, same colour, same contents. We only change background, crop and framing. Misleading images increase returns (₹140–170 return shipping hits you) and can trigger weight-discrepancy penalties.",
    hi: "Image hamesha honest rakhein: wahi product, wahi shape, wahi colour. Hum sirf background, crop aur framing badalte hain. Misleading photo se returns badhte hain (₹140–170 return shipping aap par lagta hai) aur weight-discrepancy penalty bhi lag sakti hai.",
  },
  whyTitle: {
    en: "Why does my image change my shipping?",
    hi: "Meri photo se shipping charge kyu badal jata hai?",
  },
  whyBody: {
    en: [
      "Meesho charges shipping on chargeable weight = max(dead weight, volumetric weight) by zone. Volumetric weight = (L × B × H) ÷ 5000 in cm.",
      "When you upload a product image, Meesho's system also runs computer vision on it to detect the category and estimate the product's physical bulk — it does not fully trust seller-entered data. The listing's shipping estimate is assigned from this perceived bulk.",
      "So the SAME 100g product can be quoted ₹60 shipping with one photo and ₹220 with another. Spread-out flat-lays, props, gift boxes, hands, models and cluttered backgrounds all inflate the perceived bulk because the system can't separate the product from the props.",
      "The fix: a clean pure-white background, no props, a compact composition of the product itself, a standard 1024×1024 canvas and a small file. Then A/B test which variant Meesho's system assigns the lowest slab to.",
      "Note: Meesho can change this behaviour anytime — this feature is best-effort, not a guarantee.",
    ],
    hi: [
      "Meesho shipping chargeable weight par lagata hai = max(dead weight, volumetric weight), zone ke hisaab se. Volumetric weight = (L × B × H) ÷ 5000 (cm me).",
      "Jab aap product image upload karte ho, Meesho ka system us photo par computer vision chalata hai — category detect karta hai aur photo se product ka physical bulk estimate karta hai. Wo seller ke bhare data par poora trust nahi karta.",
      "Isliye SAME 100g product ek photo me ₹60 shipping dikhata hai aur doosri photo me ₹220. Flat-lay spread, props, gift box, haath, model, cluttered background — sab perceived bulk badha dete hain kyunki system product aur props ko alag nahi kar pata.",
      "Fix: pure white background, koi props nahi, product ki compact framing, 1024×1024 canvas aur chhoti file. Phir A/B test karke dekho kaunsi variant par Meesho sabse kam slab deta hai.",
      "Dhyan rahe: Meesho ye behaviour kabhi bhi change kar sakta hai — ye feature best-effort hai, guarantee nahi.",
    ],
  },
  abTestSteps: {
    en: [
      "Create a draft catalog on the Meesho Supplier Panel with Variant V3 (Compact-40) as the primary image.",
      "Note the shipping estimate shown in the panel for that draft.",
      "Duplicate the draft with Variant V1 (Compact-70); compare the shipping shown.",
      "Publish whichever draft gets the lowest quote; delete the other drafts.",
    ],
    hi: [
      "Meesho Supplier Panel par ek draft catalog banao jisme Variant V3 (Compact-40) primary image ho.",
      "Panel me us draft ka shipping estimate note karo.",
      "Draft ko duplicate karo Variant V1 (Compact-70) ke saath; shipping compare karo.",
      "Jis draft par sabse kam shipping dikhe, usse publish karo; baaki drafts delete kar do.",
    ],
  },
  noAutomationNote: {
    en: "This tool never clicks, submits or uploads anything on the Meesho panel for you. You perform all panel actions manually — automated actions violate Meesho's terms and risk your seller account.",
    hi: "Ye tool Meesho panel par aapke liye kuch bhi click/submit/upload NAHI karta. Saare panel actions aap khud manually karte ho — automation Meesho ki terms ke against hai aur seller account ban ho sakta hai.",
  },
  bulkScoreHeuristicNote: {
    en: "Perceived Bulk Score is a heuristic (lower = likely lower slab), not a Meesho number.",
    hi: "Perceived Bulk Score ek heuristic hai (kam = shayad kam slab), ye Meesho ka official number nahi hai.",
  },
  bgNotRemovedBadge: {
    en: "Background not removed (model unavailable) — smart-crop applied instead.",
    hi: "Background remove nahi hua (model load nahi ho paya) — smart-crop lagaya gaya hai.",
  },
  variantNames: {
    v1: "V1 · Compact-70",
    v2: "V2 · Compact-55",
    v3: "V3 · Compact-40",
    v4: "V4 · Tight-Crop",
    v5: "V5 · Original-Cleaned",
  },
} as const;
