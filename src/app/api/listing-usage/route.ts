import { fail, ok, requireApiUser } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { getListingUsageSnapshot } from "@/lib/listing-usage";
import { User } from "@/models";

export async function GET() {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  await connectDb();
  const user = await User.findById(auth.session.id);
  if (!user || user.suspended) return fail("Account unavailable", 403);
  const usage = getListingUsageSnapshot(user);
  await user.save();
  return ok(usage);
}
