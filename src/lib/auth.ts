import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerEnv } from "@/lib/env";
import { User } from "@/models";
import { connectDb } from "@/lib/db";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  plan: string;
};

const COOKIE_NAME = "aps_session";

function secret() {
  const env = getServerEnv();
  return env.JWT_SECRET && !env.JWT_SECRET.startsWith("replace")
    ? env.JWT_SECRET
    : "development-only-change-me";
}

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function sign(value: string) {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

export function createToken(payload: SessionUser, maxAgeSeconds = 60 * 60 * 24 * 7) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(
    JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + maxAgeSeconds }),
  );
  const signature = sign(`${header}.${body}`);
  return `${header}.${body}.${signature}`;
}

export function readToken(token?: string): SessionUser | null {
  if (!token) return null;
  const [header, body, signature] = token.split(".");
  if (!header || !body || !signature || sign(`${header}.${body}`) !== signature) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionUser & { exp: number };
    if (!parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return {
      id: parsed.id,
      email: parsed.email,
      name: parsed.name,
      role: parsed.role,
      plan: parsed.plan,
    };
  } catch {
    return null;
  }
}

export async function setSession(user: SessionUser) {
  const store = await cookies();
  store.set(COOKIE_NAME, createToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession() {
  const store = await cookies();
  return readToken(store.get(COOKIE_NAME)?.value);
}

export async function requireUser(role?: "admin") {
  const session = await getSession();
  if (!session) redirect("/login");
  if (role && session.role !== role) redirect("/dashboard");
  return session;
}

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await new Promise<string>((resolve, reject) => {
    crypto.pbkdf2(password, salt, 120000, 32, "sha256", (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey.toString("hex"));
    });
  });
  return `${salt}:${hash}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = await new Promise<string>((resolve, reject) => {
    crypto.pbkdf2(password, salt, 120000, 32, "sha256", (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey.toString("hex"));
    });
  });
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(candidate));
}

export async function findUserByEmail(email: string) {
  await connectDb();
  return User.findOne({ email: email.toLowerCase() });
}

export function toSessionUser(user: {
  _id: unknown;
  email: string;
  name: string;
  role?: "user" | "admin";
  plan?: string;
}): SessionUser {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role || "user",
    plan: user.plan || "free",
  };
}
