import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";

export async function GET() {
  try {
    const db = await connectDb();
    return NextResponse.json({
      ok: true,
      readyState: db.connection.readyState,
      name: db.connection.name,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Database check failed" },
      { status: 500 },
    );
  }
}
