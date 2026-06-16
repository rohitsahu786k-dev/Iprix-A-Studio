import { z } from "zod";
import { fail, ok, parseBody, requireApiUser } from "@/lib/api";
import { connectDb } from "@/lib/db";
import {
  AIUsageLog,
  AuditLog,
  ContactInquiry,
  ExtensionLog,
  KeywordResearch,
  Listing,
  Notification,
  Payment,
  Product,
  FeatureFlag,
  SecurityLog,
  SubscriptionPlan,
  SupportTicket,
  Template,
  TemplateCaptureLog,
  User,
  UsageLog,
  EmailLog,
} from "@/models";

const models: Record<string, typeof User> = {
  users: User,
  products: Product,
  templates: Template,
  listings: Listing,
  subscriptions: SubscriptionPlan,
  payments: Payment,
  "contact-inquiries": ContactInquiry,
  "ai-usage": AIUsageLog,
  "keyword-reports": KeywordResearch,
  "extension-logs": ExtensionLog,
  "support-tickets": SupportTicket,
  "feature-flags": FeatureFlag,
  "security-logs": SecurityLog,
  "usage-logs": UsageLog,
  "template-capture-logs": TemplateCaptureLog,
  plans: SubscriptionPlan,
  notifications: Notification,
  "audit-logs": AuditLog,
  "email-logs": EmailLog,
};


const patchSchema = z.record(z.string(), z.any());

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ resource: string }> },
) {
  const auth = await requireApiUser("admin");
  if (auth.response) return auth.response;
  const { resource } = await params;
  const model = models[resource];
  if (!model) return fail("Unknown admin resource", 404);
  await connectDb();
  const items = await model.find({}).sort({ createdAt: -1 }).limit(200);
  return ok({ items });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ resource: string }> },
) {
  const auth = await requireApiUser("admin");
  if (auth.response) return auth.response;
  const { resource } = await params;
  const model = models[resource];
  if (!model) return fail("Unknown admin resource", 404);
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return fail("Missing id");
  const parsed = await parseBody(request, patchSchema);
  if (parsed.response) return parsed.response;
  await connectDb();
  const item = await model.findByIdAndUpdate(id, parsed.data, { returnDocument: "after" });
  await AuditLog.create({
    adminId: auth.session.id,
    action: `update:${resource}`,
    entity: resource,
    entityId: id,
    metadata: parsed.data,
  });
  return ok({ item });
}
