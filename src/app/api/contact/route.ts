import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { sendMailWithLog } from "@/lib/email/sender";
import { ContactInquiry } from "@/models";
import { rateLimit } from "@/lib/rate-limit";
import { getAdminEmails } from "@/lib/env";

const contactSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  businessType: z.string().max(80).optional(),
  message: z.string().min(10).max(3000),
});

export async function POST(request: Request) {
  const limited = rateLimit(request, "contact", 8, 60_000);
  if (limited) return limited;
  const parsed = contactSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid contact form data", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  await connectDb();
  const inquiry = await ContactInquiry.create(parsed.data);

  const isNewsletter = parsed.data.businessType === "Product updates";
  await sendMailWithLog(null, parsed.data.email, isNewsletter ? "newsletter_welcome" : "contact_received", {
    name: parsed.data.name,
  });

  // Send contact_admin_alert to admins
  const adminEmails = getAdminEmails();
  for (const adminEmail of adminEmails) {
    await sendMailWithLog(null, adminEmail, "contact_admin_alert", {
      name: parsed.data.name,
      inquiryName: parsed.data.name,
      inquiryEmail: parsed.data.email,
      inquiryMessage: parsed.data.message,
    });
  }

  return NextResponse.json({ ok: true, inquiryId: inquiry._id });
}
