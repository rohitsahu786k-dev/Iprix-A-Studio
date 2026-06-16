import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { sendContactEmail } from "@/lib/mail";
import { ContactInquiry } from "@/models";
import { rateLimit } from "@/lib/rate-limit";

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
  const email = await sendContactEmail(parsed.data);
  return NextResponse.json({ ok: true, inquiryId: inquiry._id, email });
}
