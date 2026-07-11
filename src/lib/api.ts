import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, getSessionFromRequest, type SessionUser } from "@/lib/auth";

export function ok(data: unknown = {}, init?: ResponseInit) {
  return NextResponse.json({ ok: true, ...((data || {}) as object) }, init);
}

export function fail(error: string, status = 400, data: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, error, ...data }, { status });
}

/**
 * Authenticate an API request.
 * Supports both cookie-based sessions (website) and Bearer JWT tokens (extension).
 * Pass the request object to enable Bearer token auth; omit for cookie-only auth.
 */
export async function requireApiUser(role?: "admin", request?: Request) {
  // Try Bearer token auth first if request is provided
  let session: SessionUser | null = null;
  if (request) {
    session = await getSessionFromRequest(request);
  } else {
    session = await getSession();
  }
  if (!session) return { response: fail("Authentication required", 401), session: null };
  if (role && session.role !== role) return { response: fail("Admin access required", 403), session: null };
  return { response: null, session };
}

export async function parseBody<T extends z.ZodTypeAny>(request: Request, schema: T) {
  const json = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return {
      data: null,
      response: fail("Invalid request data", 400, { issues: parsed.error.flatten().fieldErrors }),
    };
  }
  return { data: parsed.data as z.infer<T>, response: null };
}

export function userFilter(session: SessionUser) {
  return session.role === "admin" ? {} : { userId: session.id };
}

export function toCsv(rows: Array<Record<string, unknown>>) {
  const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [keys.join(","), ...rows.map((row) => keys.map((key) => escape(row[key])).join(","))].join("\n");
}
