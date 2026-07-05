import { ok, requireApiUser } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { getKeywordResearchUsageSnapshot, getListingUsageSnapshot } from "@/lib/listing-usage";
import { ExtensionLog, User } from "@/models";

export async function GET() {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  await connectDb();
  const user = await User.findById(auth.session.id);
  const usage = user ? getListingUsageSnapshot(user) : null;
  const keywordUsage = user ? getKeywordResearchUsageSnapshot(user) : null;
  await Promise.all([
    user?.save(),
    ExtensionLog.create({
      userId: auth.session.id,
      platform: "extension",
      action: "status",
      success: true,
    }),
  ]);
  return ok({ connected: true, user: auth.session, usage, keywordUsage });
}
