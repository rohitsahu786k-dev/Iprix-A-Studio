import { z } from "zod";
import { fail, ok, parseBody, requireApiUser } from "@/lib/api";
import { templateSchema } from "@/lib/crud";
import { connectDb } from "@/lib/db";
import { Template } from "@/models";

type Context = { params: Promise<{ id: string }> | { id: string } };

async function getId(context: Context) {
  const params = await context.params;
  return params.id;
}

async function findOwnedTemplate(id: string, userId: string, isAdmin: boolean) {
  const template = await Template.findById(id);
  if (!template) return null;
  if (!isAdmin && String(template.userId) !== userId) return null;
  return template;
}

const updateSchema = templateSchema.partial().extend({
  autoFill: z.boolean().optional(),
});

export async function GET(_request: Request, context: Context) {
  const auth = await requireApiUser(undefined, _request);
  if (auth.response) return auth.response;
  await connectDb();
  const template = await findOwnedTemplate(await getId(context), auth.session.id, auth.session.role === "admin");
  if (!template) return fail("Template not found", 404);
  return ok({ item: template, template });
}

export async function PUT(request: Request, context: Context) {
  const auth = await requireApiUser(undefined, request);
  if (auth.response) return auth.response;
  const parsed = await parseBody(request, updateSchema);
  if (parsed.response) return parsed.response;
  await connectDb();

  const template = await findOwnedTemplate(await getId(context), auth.session.id, auth.session.role === "admin");
  if (!template) return fail("Template not found", 404);

  if (parsed.data.autoFill === true) {
    await Template.updateMany(
      {
        userId: template.userId,
        platform: parsed.data.platform || template.platform,
        category: parsed.data.category ?? template.category,
        _id: { $ne: template._id },
      },
      { $set: { autoFill: false } },
    );
  }

  template.set(parsed.data);
  await template.save();
  return ok({ item: template, template });
}

export const PATCH = PUT;

export async function DELETE(request: Request, context: Context) {
  const auth = await requireApiUser(undefined, request);
  if (auth.response) return auth.response;
  await connectDb();
  const template = await findOwnedTemplate(await getId(context), auth.session.id, auth.session.role === "admin");
  if (!template) return fail("Template not found", 404);
  await template.deleteOne();
  return ok({ deleted: true });
}
