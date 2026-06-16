import { NextResponse } from "next/server";
import { getCloudinary } from "@/lib/cloudinary";

export async function GET() {
  try {
    const cloudinary = getCloudinary();
    const result = await cloudinary.api.ping();
    return NextResponse.json({ ok: result.status === "ok", status: result.status });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Cloudinary check failed" },
      { status: 500 },
    );
  }
}
