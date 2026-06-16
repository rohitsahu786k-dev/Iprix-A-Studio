import crypto from "crypto";
import fs from "fs";
import mongoose from "mongoose";

for (const file of [".env.local", ".env"]) {
  if (!fs.existsSync(file)) continue;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (process.env[key]) continue;
    process.env[key] = rest.join("=").replace(/^['"]|['"]$/g, "");
  }
}

const uri = process.env.MONGODB_URI;
if (!uri || uri.startsWith("replace")) {
  console.error("MONGODB_URI is required. Load .env.local before running seed.");
  process.exit(1);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true },
    passwordHash: String,
    role: String,
    plan: String,
    aiCredits: Number,
    freeListingsLimit: Number,
    freeListingsUsed: Number,
    monthlyListingsUsed: Number,
    monthlyListingsLimit: Number,
    monthlyListingsPeriod: String,
    freeKeywordResearchLimit: Number,
    freeKeywordResearchUsed: Number,
    monthlyKeywordResearchUsed: Number,
    monthlyKeywordResearchLimit: Number,
    monthlyKeywordResearchPeriod: String,
    subscriptionStatus: String,
    emailVerified: Boolean,
    suspended: Boolean,
  },
  { timestamps: true },
);

const planSchema = new mongoose.Schema(
  {
    slug: { type: String, unique: true },
    name: String,
    monthlyPrice: Number,
    aiCredits: Number,
    fillLimit: Number,
    listingLimit: Number,
    templateLimit: Number,
    features: [String],
    enabled: Boolean,
  },
  { timestamps: true },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
const SubscriptionPlan = mongoose.models.SubscriptionPlan || mongoose.model("SubscriptionPlan", planSchema);
const productSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, title: String, brand: String, category: String, sellingPrice: Number, mrp: Number, description: String, keywords: [String] }, { timestamps: true });
const templateSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, name: String, platform: String, source: String, fields: [mongoose.Schema.Types.Mixed], fieldCount: Number }, { timestamps: true });
const listingSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, title: String, generatedTitle: String, brand: String, category: String, platform: String, source: String, status: String, keywords: [String], primaryKeywords: [String], secondaryKeywords: [String], longTailKeywords: [String], sku: String, usageCounted: Boolean, aiGenerated: Boolean }, { timestamps: true });
const keywordResearchSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, productName: String, brand: String, seedKeyword: String, platform: String, primaryKeywords: [String], secondaryKeywords: [String], longTailKeywords: [String], usageCounted: Boolean, status: String }, { timestamps: true });
const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
const Template = mongoose.models.Template || mongoose.model("Template", templateSchema);
const Listing = mongoose.models.Listing || mongoose.model("Listing", listingSchema);
const KeywordResearch = mongoose.models.KeywordResearch || mongoose.model("KeywordResearch", keywordResearchSchema);

const accounts = [
  { name: "A+ Studio Admin", email: "admin@iprixmedia.com", password: "Admin@12345", role: "admin", plan: "agency", aiCredits: 10000 },
  { name: "Demo Seller", email: "user@iprixmedia.com", password: "User@12345", role: "user", plan: "free", aiCredits: 10 },
];

const listingLimits = { free: 5, seller: 100, growth: 500, pro: 1500, agency: 10000 };
const keywordLimits = { free: 5, seller: 100, growth: 500, pro: 1500, agency: 10000 };
const plans = [
  ["free", "Free", 0, 0, 5, 5, 5],
  ["seller", "Seller", 99, 0, 100, 100, -1],
  ["growth", "Growth", 199, 0, 500, -1, -1],
  ["pro", "Pro", 299, 0, 1500, -1, -1],
  ["agency", "Agency", 799, 0, 10000, -1, -1],
];

await mongoose.connect(uri, { bufferCommands: false });

for (const account of accounts) {
  await User.findOneAndUpdate(
    { email: account.email },
    {
      name: account.name,
      email: account.email,
      passwordHash: hashPassword(account.password),
      role: account.role,
      plan: account.plan,
      aiCredits: account.aiCredits,
      freeListingsLimit: 5,
      freeListingsUsed: 0,
      monthlyListingsUsed: 0,
      monthlyListingsLimit: account.plan === "free" ? 0 : listingLimits[account.plan],
      monthlyListingsPeriod: new Date().toISOString().slice(0, 7),
      freeKeywordResearchLimit: 5,
      freeKeywordResearchUsed: 0,
      monthlyKeywordResearchUsed: 0,
      monthlyKeywordResearchLimit: account.plan === "free" ? 0 : keywordLimits[account.plan],
      monthlyKeywordResearchPeriod: new Date().toISOString().slice(0, 7),
      subscriptionStatus: account.plan === "free" ? "free" : "active",
      emailVerified: true,
      suspended: false,
    },
    { upsert: true, returnDocument: "after" },
  );
  console.log(`Seeded ${account.email}`);
}

const demoUser = await User.findOne({ email: "user@iprixmedia.com" });
if (demoUser) {
  const product = await Product.findOneAndUpdate(
    { userId: demoUser._id, title: "Demo Cotton Kurti" },
    {
      userId: demoUser._id,
      title: "Demo Cotton Kurti",
      brand: "Iprix Demo Brand",
      category: "Women Ethnic Wear",
      sellingPrice: 499,
      mrp: 999,
      description: "Demo product for testing AI listings and template autofill.",
      keywords: ["cotton kurti", "women kurti", "ethnic wear"],
    },
    { upsert: true, returnDocument: "after" },
  );
  await Template.findOneAndUpdate(
    { userId: demoUser._id, name: "Demo Meesho Template" },
    {
      userId: demoUser._id,
      name: "Demo Meesho Template",
      platform: "meesho",
      source: "ai_generated",
      fields: [
        { key: "title", label: "Product title", value: "Iprix Demo Brand Cotton Kurti", inputType: "text" },
        { key: "description", label: "Description", value: "Soft cotton kurti for everyday wear.", inputType: "textarea" },
      ],
      fieldCount: 2,
    },
    { upsert: true, returnDocument: "after" },
  );
  await Listing.findOneAndUpdate(
    { userId: demoUser._id, title: "Iprix Demo Brand Cotton Kurti for Women" },
    {
      userId: demoUser._id,
      productId: product._id,
      title: "Iprix Demo Brand Cotton Kurti for Women",
      generatedTitle: "Iprix Demo Brand Cotton Kurti for Women",
      brand: "Iprix Demo Brand",
      category: "Women Ethnic Wear",
      platform: "meesho",
      source: "ai_generated",
      status: "generated",
      keywords: ["cotton kurti", "women ethnic wear", "daily wear kurti"],
      primaryKeywords: ["cotton kurti", "women kurti"],
      secondaryKeywords: ["ethnic wear", "daily wear"],
      longTailKeywords: ["cotton kurti for women"],
      sku: "APS-DEMO-KURTI",
      usageCounted: true,
      aiGenerated: true,
    },
    { upsert: true, returnDocument: "after" },
  );
  await KeywordResearch.findOneAndUpdate(
    { userId: demoUser._id, seedKeyword: "cotton kurti" },
    {
      userId: demoUser._id,
      productName: "Demo Cotton Kurti",
      brand: "Iprix Demo Brand",
      seedKeyword: "cotton kurti",
      platform: "meesho",
      primaryKeywords: ["cotton kurti", "Iprix Demo Brand kurti"],
      secondaryKeywords: ["women kurti", "ethnic wear"],
      longTailKeywords: ["cotton kurti for women daily wear"],
      usageCounted: true,
      status: "success",
    },
    { upsert: true, returnDocument: "after" },
  );
}

for (const [slug, name, monthlyPrice, aiCredits, fillLimit, listingLimit, templateLimit] of plans) {
  await SubscriptionPlan.findOneAndUpdate(
    { slug },
    { slug, name, monthlyPrice, aiCredits, fillLimit, listingLimit, templateLimit, enabled: true },
    { upsert: true, returnDocument: "after" },
  );
}

await mongoose.disconnect();
console.log("Seed complete. Change default passwords after first login.");
