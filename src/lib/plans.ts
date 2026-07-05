export type PlanSlug = "free" | "seller" | "growth" | "pro" | "agency";

export type PricingPlan = {
  name: string;
  slug: PlanSlug;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlyDiscount: string;
  listings: string;
  productLimit: string;
  templates: string;
  team: string;
  featured?: boolean;
  features: string[];
};

export const planListingLimits: Record<PlanSlug, number> = {
  free: 50,
  seller: 100,
  growth: 500,
  pro: 1500,
  agency: 10000,
};

export const planKeywordResearchLimits: Record<PlanSlug, number> = {
  free: 30,
  seller: 100,
  growth: 500,
  pro: 1500,
  agency: 10000,
};

export const planTemplateLimits: Record<PlanSlug, number> = {
  free: 30,
  seller: -1,
  growth: -1,
  pro: -1,
  agency: -1,
};

export const planProductLimits: Record<PlanSlug, number> = {
  free: 30,
  seller: 100,
  growth: -1,
  pro: -1,
  agency: -1,
};

export const pricingPlans: PricingPlan[] = [
  {
    name: "Free",
    slug: "free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyDiscount: "Start free with 50 AI listings & 30 templates",
    listings: "50 lifetime",
    productLimit: "30",
    templates: "30",
    team: "Solo",
    features: [
      "Advanced AI title generation",
      "30 lifetime keyword research reports",
      "AI description, bullets, keywords, SKU and listing score",
      "Basic Chrome extension autofill",
      "Save old listing as template",
      "Basic SKU Generator & Auditor",
      "Free Image Optimization tools",
      "Community support",
    ],
  },
  {
    name: "Seller",
    slug: "seller",
    monthlyPrice: 99,
    yearlyPrice: 475,
    yearlyDiscount: "Save with yearly",
    listings: "100 / month",
    productLimit: "100",
    templates: "Unlimited",
    team: "Solo",
    features: [
      "Chrome extension autofill",
      "100 keyword research reports/month",
      "AI title, description, keywords, SKU and listing score",
      "Basic image tools",
      "Meesho support",
      "Basic support",
    ],
  },
  {
    name: "Growth",
    slug: "growth",
    monthlyPrice: 199,
    yearlyPrice: 955,
    yearlyDiscount: "Best for active sellers",
    listings: "500 / month",
    productLimit: "Unlimited",
    templates: "Unlimited",
    team: "2 members",
    featured: true,
    features: [
      "Advanced AI listing optimization",
      "500 keyword research reports/month",
      "CSV export",
      "Smart listing generator",
      "Flipkart beta",
      "Standard support",
    ],
  },
  {
    name: "Pro",
    slug: "pro",
    monthlyPrice: 299,
    yearlyPrice: 1435,
    yearlyDiscount: "Advanced automation",
    listings: "1,500 / month",
    productLimit: "Unlimited",
    templates: "Unlimited",
    team: "10 members",
    features: [
      "Full AI content studio",
      "Full smart listing",
      "Full image maker",
      "1,500 keyword research reports/month",
      "Advanced keyword clustering",
      "Bulk CSV import/export",
      "Meesho + Flipkart + Amazon beta",
      "Priority support",
    ],
  },
  {
    name: "Agency",
    slug: "agency",
    monthlyPrice: 799,
    yearlyPrice: 3835,
    yearlyDiscount: "Client workspaces",
    listings: "10,000 / month",
    productLimit: "Unlimited",
    templates: "Unlimited",
    team: "Unlimited",
    features: [
      "Bulk smart listings",
      "10,000 keyword research reports/month",
      "Client workspaces",
      "Advanced analytics",
      "Dedicated support",
      "White-label reports",
    ],
  },
];


export const featureModules = [
  "Reusable listing templates",
  "Product library",
  "Smart listing bulk generator",
  "AI content writer",
  "AI keyword research",
  "Label analyser",
  "Image maker",
  "Marketplace compliance score",
  "SKU generator",
  "Team collaboration",
  "CSV import/export",
  "Chrome extension autofill",
];
