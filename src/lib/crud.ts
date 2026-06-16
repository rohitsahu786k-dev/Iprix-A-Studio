import { z } from "zod";
import { connectDb } from "@/lib/db";
import { fail, ok, parseBody, requireApiUser, userFilter } from "@/lib/api";
import type { SessionUser } from "@/lib/auth";

type ModelLike = {
  find(filter: Record<string, unknown>): { sort(input: Record<string, number>): { limit(n: number): Promise<unknown[]> } };
  findById(id: string): Promise<unknown & { set?: (data: unknown) => void; save?: () => Promise<unknown>; deleteOne?: () => Promise<unknown> }>;
  create(data: Record<string, unknown>): Promise<unknown>;
  countDocuments(filter: Record<string, unknown>): Promise<number>;
};

export const productSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional().default(""),
  brand: z.string().optional().default(""),
  category: z.string().optional().default(""),
  sellingPrice: z.coerce.number().optional(),
  mrp: z.coerce.number().optional(),
  colors: z.array(z.string()).optional().default([]),
  sizes: z.array(z.string()).optional().default([]),
  features: z.array(z.string()).optional().default([]),
  keywords: z.array(z.string()).optional().default([]),
  internalNotes: z.string().optional().default(""),
  images: z.array(z.any()).optional().default([]),
});

export const templateSchema = z.object({
  name: z.string().min(2),
  platform: z.string().min(2).default("meesho"),
  category: z.string().optional().default(""),
  source: z.enum(["extension_capture", "manual", "ai_generated"]).optional().default("manual"),
  capturedFromUrl: z.string().optional().default(""),
  selectors: z.record(z.string(), z.any()).optional().default({}),
  fields: z
    .array(
      z.object({
        key: z.string().optional().default(""),
        label: z.string().optional().default(""),
        value: z.any().optional(),
        selector: z.string().optional().default(""),
        inputType: z.string().optional().default("text"),
        required: z.boolean().optional().default(false),
        confidence: z.number().optional().default(0.7),
        groupName: z.string().optional().default("Listing fields"),
      }),
    )
    .optional()
    .default([]),
  images: z.array(z.any()).optional().default([]),
  fieldCount: z.number().optional().default(0),
});

export const listingSchema = z.object({
  platform: z.string().min(2).default("meesho"),
  productId: z.string().optional(),
  templateId: z.string().optional(),
  source: z.enum(["ai_generated", "extension_capture", "manual", "csv", "product_library"]).optional().default("manual"),
  status: z.enum(["draft", "generated", "autofilled", "exported", "failed"]).optional().default("draft"),
  title: z.string().optional().default(""),
  description: z.string().optional().default(""),
  shortDescription: z.string().optional().default(""),
  bulletPoints: z.array(z.string()).optional().default([]),
  sku: z.string().optional().default(""),
  keywords: z.array(z.string()).optional().default([]),
  category: z.string().optional().default(""),
  brand: z.string().optional().default(""),
  price: z.coerce.number().optional(),
  mrp: z.coerce.number().optional(),
  colors: z.array(z.string()).optional().default([]),
  sizes: z.array(z.string()).optional().default([]),
  material: z.string().optional().default(""),
  images: z.array(z.any()).optional().default([]),
  aiScore: z.record(z.string(), z.any()).optional().default({}),
  aiGenerated: z.boolean().optional().default(false),
  aiModel: z.string().optional().default(""),
  aiCreditsUsed: z.number().optional().default(0),
  usageCounted: z.boolean().optional().default(false),
  payload: z.record(z.string(), z.any()).optional().default({}),
  errorMessages: z.array(z.string()).optional().default([]),
});

export const notificationSchema = z.object({
  title: z.string().min(2),
  message: z.string().min(2),
  type: z.string().optional().default("info"),
  read: z.boolean().optional().default(false),
  userId: z.string().optional(),
});

export const teamSchema = z.object({
  email: z.string().email(),
  role: z.enum(["owner", "admin", "member"]).default("member"),
  status: z.string().default("invited"),
});

export async function listItems(model: ModelLike, session: SessionUser, extra: Record<string, unknown> = {}) {
  await connectDb();
  const filter = { ...userFilter(session), ...extra };
  const [items, count] = await Promise.all([
    model.find(filter).sort({ createdAt: -1 }).limit(100),
    model.countDocuments(filter),
  ]);
  return ok({ items, count });
}

export async function createItem(
  request: Request,
  model: ModelLike,
  schema: z.ZodTypeAny,
  session: SessionUser,
  ownerKey = "userId",
) {
  await connectDb();
  const parsed = await parseBody(request, schema);
  if (parsed.response) return parsed.response;
  const item = await model.create({ ...(parsed.data as Record<string, unknown>), [ownerKey]: session.id });
  return ok({ item }, { status: 201 });
}

export async function updateOrDeleteItem(
  request: Request,
  model: ModelLike,
  schema: z.ZodTypeAny,
  session: SessionUser,
) {
  await connectDb();
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return fail("Missing id");
  const item = await model.findById(id);
  if (!item) return fail("Not found", 404);
  const owner = (item as { userId?: unknown }).userId;
  if (session.role !== "admin" && owner && String(owner) !== session.id) return fail("Forbidden", 403);

  if (request.method === "DELETE") {
    await item.deleteOne?.();
    return ok({ deleted: true });
  }

  const parsed = await parseBody(request, (schema as z.ZodObject<z.ZodRawShape>).partial());
  if (parsed.response) return parsed.response;
  item.set?.(parsed.data);
  const saved = await item.save?.();
  return ok({ item: saved || item });
}

export function resourceHandlers(model: ModelLike, schema: z.ZodTypeAny) {
  return {
    async GET() {
      const auth = await requireApiUser();
      if (auth.response) return auth.response;
      return listItems(model, auth.session);
    },
    async POST(request: Request) {
      const auth = await requireApiUser();
      if (auth.response) return auth.response;
      return createItem(request, model, schema, auth.session);
    },
    async PATCH(request: Request) {
      const auth = await requireApiUser();
      if (auth.response) return auth.response;
      return updateOrDeleteItem(request, model, schema, auth.session);
    },
    async DELETE(request: Request) {
      const auth = await requireApiUser();
      if (auth.response) return auth.response;
      return updateOrDeleteItem(request, model, schema, auth.session);
    },
  };
}
