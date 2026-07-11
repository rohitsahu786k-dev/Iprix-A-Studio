import { fail, ok, parseBody, requireApiUser } from "@/lib/api";
import { teamSchema } from "@/lib/crud";
import { connectDb } from "@/lib/db";
import { Team } from "@/models";

export async function GET() {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  await connectDb();
  const [items, count] = await Promise.all([
    Team.find({ ownerId: auth.session.id }).sort({ createdAt: -1 }).limit(100),
    Team.countDocuments({ ownerId: auth.session.id }),
  ]);
  return ok({ items, count });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const parsed = await parseBody(request, teamSchema);
  if (parsed.response) return parsed.response;
  await connectDb();
  const existing = await Team.findOne({ ownerId: auth.session.id, email: parsed.data.email.toLowerCase() });
  if (existing) return fail("This team member is already invited.", 409);
  const item = await Team.create({ ...parsed.data, email: parsed.data.email.toLowerCase(), ownerId: auth.session.id });
  return ok({ item }, { status: 201 });
}

async function ownedTeamMember(request: Request, ownerId: string) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return { response: fail("Missing id"), item: null };
  const item = await Team.findById(id);
  if (!item) return { response: fail("Team member not found", 404), item: null };
  if (String(item.ownerId) !== ownerId) return { response: fail("Forbidden", 403), item: null };
  return { response: null, item };
}

export async function PATCH(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const parsed = await parseBody(request, teamSchema.partial());
  if (parsed.response) return parsed.response;
  await connectDb();
  const owned = await ownedTeamMember(request, auth.session.id);
  if (owned.response) return owned.response;
  owned.item.set(parsed.data);
  await owned.item.save();
  return ok({ item: owned.item });
}

export async function DELETE(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  await connectDb();
  const owned = await ownedTeamMember(request, auth.session.id);
  if (owned.response) return owned.response;
  await owned.item.deleteOne();
  return ok({ deleted: true });
}
