import { z } from "zod";
import { fail, ok, parseBody, requireApiUser } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { planTemplateLimits } from "@/lib/plans";
import { normalizePlan } from "@/lib/listing-usage";
import { Template, TemplateCaptureLog, User } from "@/models";

const fieldSchema = z.object({
  key: z.string().optional().default(""),
  label: z.string().optional().default(""),
  value: z.any().optional(),
  selector: z.string().optional().default(""),
  inputType: z.string().optional().default("text"),
  required: z.boolean().optional().default(false),
  confidence: z.number().optional().default(0.75),
  groupName: z.string().optional().default("Listing fields"),
});

const captureSchema = z.object({
  name: z.string().min(2).optional(),
  platform: z.string().min(2).default("meesho"),
  category: z.string().optional().default(""),
  capturedFromUrl: z.string().optional().default(""),
  fields: z.array(fieldSchema).min(1),
  images: z.array(z.any()).optional().default([]),
});

const blockedKeys = /(password|otp|cookie|token|payment|card|cvv|upi|bank|account|secret|private)/i;

function sanitizeFields(fields: Array<z.infer<typeof fieldSchema>>) {
  return fields
    .filter((field) => {
      const haystack = `${field.key} ${field.label} ${field.selector} ${field.inputType}`;
      return !blockedKeys.test(haystack);
    })
    .slice(0, 120)
    .map((field) => ({
      ...field,
      key: field.key || field.label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""),
      label: field.label || field.key || "Listing field",
      value: typeof field.value === "string" ? field.value.slice(0, 3000) : field.value,
    }));
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const parsed = await parseBody(request, captureSchema);
  if (parsed.response) return parsed.response;

  await connectDb();
  const user = await User.findById(auth.session.id);
  if (!user || user.suspended) return fail("Account unavailable", 403);

  const plan = normalizePlan(user.plan);
  const limit = planTemplateLimits[plan];
  if (limit !== -1) {
    const existing = await Template.countDocuments({ userId: auth.session.id });
    if (existing >= limit) {
      await TemplateCaptureLog.create({
        userId: auth.session.id,
        platform: parsed.data.platform,
        url: parsed.data.capturedFromUrl,
        fieldsDetected: parsed.data.fields.length,
        fieldsSaved: 0,
        status: "failed",
        errorMessage: "Template limit reached",
      });
      return fail("Free template limit reached. Upgrade to save unlimited templates.", 402, {
        code: "template_limit_reached",
      });
    }
  }

  const fields = sanitizeFields(parsed.data.fields);
  if (!fields.length) return fail("No listing fields found to save", 400);
  const template = await Template.create({
    userId: auth.session.id,
    name: parsed.data.name || `${parsed.data.platform} captured template`,
    platform: parsed.data.platform,
    category: parsed.data.category,
    source: "extension_capture",
    capturedFromUrl: parsed.data.capturedFromUrl,
    fields,
    fieldCount: fields.length,
    images: parsed.data.images,
  });
  await TemplateCaptureLog.create({
    userId: auth.session.id,
    platform: parsed.data.platform,
    url: parsed.data.capturedFromUrl,
    fieldsDetected: parsed.data.fields.length,
    fieldsSaved: fields.length,
    status: "success",
  });
  return ok({ template, fieldsSaved: fields.length }, { status: 201 });
}
