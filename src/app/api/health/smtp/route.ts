import { NextResponse } from "next/server";
import { getMailer } from "@/lib/mail";

export async function GET() {
  try {
    await getMailer().verify();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "SMTP check failed" },
      { status: 500 },
    );
  }
}
