/* eslint-disable @typescript-eslint/no-require-imports */
const mongoose = require("mongoose");
const { Schema } = mongoose;

const timestamps = { timestamps: true };

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user", index: true },
    plan: { type: String, default: "free", index: true },
    subscriptionStatus: { type: String, default: "free", index: true },
    aiCredits: { type: Number, default: 10 },
    fillsThisMonth: { type: Number, default: 0 },
    freeListingsLimit: { type: Number, default: 5 },
    freeListingsUsed: { type: Number, default: 0 },
    monthlyListingsUsed: { type: Number, default: 0 },
    monthlyListingsLimit: { type: Number, default: 0 },
    monthlyListingsPeriod: String,
    freeKeywordResearchLimit: { type: Number, default: 5 },
    freeKeywordResearchUsed: { type: Number, default: 0 },
    monthlyKeywordResearchUsed: { type: Number, default: 0 },
    monthlyKeywordResearchLimit: { type: Number, default: 0 },
    monthlyKeywordResearchPeriod: String,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    lastUsageResetAt: Date,
    emailVerified: { type: Boolean, default: false },
    suspended: { type: Boolean, default: false },
    avatarUrl: String,
    gstin: String,
    billingDetails: Schema.Types.Mixed,
    resetTokenHash: String,
    resetTokenExpiresAt: Date,
    verifyTokenHash: String,
  },
  timestamps,
);

const productSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    title: { type: String, required: true },
    description: String,
    brand: String,
    category: String,
    sellingPrice: Number,
    mrp: Number,
    colors: [String],
    sizes: [String],
    features: [String],
    keywords: [String],
    internalNotes: String,
    images: [
      {
        url: String,
        publicId: String,
        width: Number,
        height: Number,
      },
    ],
  },
  timestamps,
);

const templateSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    name: { type: String, required: true },
    platform: { type: String, default: "meesho", index: true },
    category: String,
    url: String,
    vertical: String,
    brand: String,
    autoFill: { type: Boolean, default: false, index: true },
    source: {
      type: String,
      enum: ["extension_capture", "manual", "ai_generated"],
      default: "manual",
      index: true,
    },
    capturedFromUrl: String,
    selectors: Schema.Types.Mixed,
    fields: [
      {
        key: String,
        label: String,
        value: Schema.Types.Mixed,
        selector: String,
        inputType: String,
        // Extension capture metadata (kept for high-fidelity autofill).
        type: String,
        id: String,
        name: String,
        placeholder: String,
        required: Boolean,
        confidence: Number,
        groupName: String,
      },
    ],
    sections: [Schema.Types.Mixed],
    images: [
      {
        url: String,
        source: String,
        cloudinaryPublicId: String,
      },
    ],
    fieldCount: { type: Number, default: 0 },
    usageCount: { type: Number, default: 0 },
    lastUsedAt: Date,
  },
  timestamps,
);

const listingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    templateId: { type: Schema.Types.ObjectId, ref: "Template" },
    platform: { type: String, default: "meesho", index: true },
    source: {
      type: String,
      enum: ["ai_generated", "extension_capture", "manual", "csv", "product_library"],
      default: "manual",
      index: true,
    },
    status: {
      type: String,
      enum: ["draft", "generated", "autofilled", "exported", "failed"],
      default: "draft",
      index: true,
    },
    title: String,
    generatedTitle: String,
    titleVariations: [String],
    description: String,
    shortDescription: String,
    bulletPoints: [String],
    sku: String,
    keywords: [String],
    primaryKeywords: [String],
    secondaryKeywords: [String],
    longTailKeywords: [String],
    searchTerms: [String],
    productHighlights: [String],
    careInstructions: [String],
    improvementTips: [String],
    marketplaceCompliance: Schema.Types.Mixed,
    categorySuggestion: String,
    category: String,
    brand: String,
    price: Number,
    mrp: Number,
    colors: [String],
    sizes: [String],
    material: String,
    images: [Schema.Types.Mixed],
    aiScore: {
      total: Number,
      title: Number,
      keywords: Number,
      description: Number,
      completeness: Number,
      marketplaceReadiness: Number,
    },
    aiGenerated: { type: Boolean, default: false },
    aiModel: String,
    aiCreditsUsed: { type: Number, default: 0 },
    usageCounted: { type: Boolean, default: false, index: true },
    payload: Schema.Types.Mixed,
    errorMessages: [String],
  },
  timestamps,
);

const keywordResearchSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    productName: String,
    seedKeyword: String,
    category: String,
    platform: { type: String, default: "meesho", index: true },
    targetAudience: String,
    priceRange: String,
    season: String,
    competitorTitle: String,
    primaryKeywords: [String],
    secondaryKeywords: [String],
    longTailKeywords: [String],
    buyerIntentKeywords: [String],
    seasonalKeywords: [String],
    titleKeywords: [String],
    descriptionKeywords: [String],
    negativeKeywords: [String],
    keywordClusters: [Schema.Types.Mixed],
    keywordDifficulty: Schema.Types.Mixed,
    opportunityScore: Number,
    searchIntent: String,
    recommendedTitleTerms: [String],
    recommendedTags: [String],
    contentSuggestions: [String],
    aiModel: String,
    usageCounted: { type: Boolean, default: false, index: true },
    status: { type: String, default: "success", index: true },
    prompt: String,
    output: Schema.Types.Mixed,
  },
  timestamps,
);

const usageLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    listingId: { type: Schema.Types.ObjectId, ref: "Listing", index: true },
    plan: String,
    source: String,
    action: String,
    usageType: { type: String, default: "listing" },
    beforeUsed: Number,
    afterUsed: Number,
    limit: Number,
    metadata: Schema.Types.Mixed,
  },
  timestamps,
);

const templateCaptureLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    platform: String,
    url: String,
    fieldsDetected: Number,
    fieldsSaved: Number,
    status: { type: String, enum: ["success", "failed"], default: "success", index: true },
    errorMessage: String,
  },
  timestamps,
);

const simpleLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    feature: String,
    status: { type: String, default: "success" },
    message: String,
    metadata: Schema.Types.Mixed,
  },
  timestamps,
);

const supportTicketSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    category: { type: String, default: "general", index: true },
    status: { type: String, enum: ["open", "in_progress", "resolved", "closed"], default: "open", index: true },
    priority: { type: String, enum: ["low", "normal", "high"], default: "normal", index: true },
    attachmentUrl: String,
    adminNotes: String,
    replies: [
      {
        authorId: Schema.Types.ObjectId,
        authorRole: String,
        message: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  timestamps,
);

const featureFlagSchema = new Schema(
  {
    key: { type: String, unique: true, index: true },
    name: String,
    description: String,
    enabled: { type: Boolean, default: false, index: true },
    audience: { type: String, default: "all" },
    metadata: Schema.Types.Mixed,
  },
  timestamps,
);

const schemas = {
  User: userSchema,
  Product: productSchema,
  Template: templateSchema,
  Listing: listingSchema,
  SmartListingBatch: new Schema(
    {
      userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
      platform: String,
      productIds: [Schema.Types.ObjectId],
      listingIds: [Schema.Types.ObjectId],
      status: { type: String, default: "generated" },
      errorMessages: [String],
    },
    timestamps,
  ),
  SubscriptionPlan: new Schema(
    {
      slug: { type: String, unique: true, index: true },
      name: String,
      monthlyPrice: Number,
      aiCredits: Number,
      fillLimit: Number,
      listingLimit: Number,
      templateLimit: Number,
      features: [String],
      enabled: { type: Boolean, default: true },
    },
    timestamps,
  ),
  Payment: new Schema(
    {
      userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
      razorpayOrderId: String,
      razorpayPaymentId: String,
      amount: Number,
      currency: { type: String, default: "INR" },
      status: { type: String, default: "created" },
      plan: String,
    },
    timestamps,
  ),
  ContactInquiry: new Schema(
    {
      name: String,
      email: String,
      phone: String,
      businessType: String,
      message: String,
      status: { type: String, default: "new", index: true },
      ipHash: String,
    },
    timestamps,
  ),
  Notification: new Schema(
    {
      userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
      title: String,
      message: String,
      type: { type: String, default: "info" },
      read: { type: Boolean, default: false },
    },
    timestamps,
  ),
  AIUsageLog: new Schema(
    {
      userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
      feature: String,
      planAtTime: String,
      model: String,
      inputTokens: Number,
      outputTokens: Number,
      estimatedCost: Number,
      tokens: Number,
      creditsConsumed: { type: Number, default: 1 },
      status: String,
      reason: String,
      prompt: String,
      output: String,
    },
    timestamps,
  ),
  ExtensionLog: new Schema(
    {
      userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
      platform: String,
      action: String,
      success: Boolean,
      errorMessage: String,
      metadata: Schema.Types.Mixed,
    },
    timestamps,
  ),
  SupportTicket: supportTicketSchema,
  FeatureFlag: featureFlagSchema,
  SecurityLog: new Schema(
    {
      userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
      action: String,
      status: { type: String, default: "info", index: true },
      ipHash: String,
      userAgent: String,
      metadata: Schema.Types.Mixed,
    },
    timestamps,
  ),
  Team: new Schema(
    {
      ownerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
      email: String,
      role: { type: String, enum: ["owner", "admin", "member"], default: "member" },
      status: { type: String, default: "invited" },
    },
    timestamps,
  ),
  AuditLog: new Schema(
    {
      adminId: { type: Schema.Types.ObjectId, ref: "User", index: true },
      action: String,
      entity: String,
      entityId: String,
      metadata: Schema.Types.Mixed,
    },
    timestamps,
  ),
  ImageJob: simpleLogSchema,
  LabelJob: simpleLogSchema,
  KeywordResearch: keywordResearchSchema,
  UsageLog: usageLogSchema,
  TemplateCaptureLog: templateCaptureLogSchema,
  EmailLog: new Schema(
    {
      userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
      to: { type: String, required: true, index: true },
      subject: { type: String, required: true },
      trigger: { type: String, required: true, index: true },
      status: { type: String, enum: ["sent", "failed"], default: "sent", index: true },
      errorMessage: String,
      metadata: Schema.Types.Mixed,
    },
    timestamps,
  ),
};

function model(name: keyof typeof schemas) {
  return mongoose.models[name] || mongoose.model(name, schemas[name]);
}

export const User = model("User");
export const Product = model("Product");
export const Template = model("Template");
export const Listing = model("Listing");
export const SmartListingBatch = model("SmartListingBatch");
export const SubscriptionPlan = model("SubscriptionPlan");
export const Payment = model("Payment");
export const ContactInquiry = model("ContactInquiry");
export const Notification = model("Notification");
export const AIUsageLog = model("AIUsageLog");
export const ExtensionLog = model("ExtensionLog");
export const SupportTicket = model("SupportTicket");
export const FeatureFlag = model("FeatureFlag");
export const SecurityLog = model("SecurityLog");
export const Team = model("Team");
export const AuditLog = model("AuditLog");
export const ImageJob = model("ImageJob");
export const LabelJob = model("LabelJob");
export const KeywordResearch = model("KeywordResearch");
export const UsageLog = model("UsageLog");
export const TemplateCaptureLog = model("TemplateCaptureLog");
export const EmailLog = model("EmailLog");
