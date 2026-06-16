import { z } from "zod";

const optional = z.string().optional().default("");

const serverEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: optional,
  MONGODB_URI: optional,
  JWT_SECRET: optional,
  OPENAI_API_KEY: optional,
  OPENAI_MODEL: optional,
  CLOUDINARY_CLOUD_NAME: optional,
  CLOUDINARY_API_KEY: optional,
  CLOUDINARY_API_SECRET: optional,
  SMTP_HOST: optional,
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_USER: optional,
  SMTP_PASS: optional,
  SMTP_FROM: optional,
  ADMIN_EMAILS: optional,
  RAZORPAY_KEY_ID: optional,
  RAZORPAY_KEY_SECRET: optional,
  RAZORPAY_WEBHOOK_SECRET: optional,
});

export function getServerEnv() {
  return serverEnvSchema.parse(process.env);
}

export function requireEnv<K extends keyof ReturnType<typeof getServerEnv>>(
  key: K,
): NonNullable<ReturnType<typeof getServerEnv>[K]> {
  const env = getServerEnv();
  const value = env[key];
  if (!value || String(value).startsWith("replace")) {
    throw new Error(`${String(key)} is not configured`);
  }
  return value as NonNullable<ReturnType<typeof getServerEnv>[K]>;
}

export function isConfigured(...keys: Array<keyof ReturnType<typeof getServerEnv>>) {
  const env = getServerEnv();
  return keys.every((key) => {
    const value = env[key];
    return Boolean(value && !String(value).startsWith("replace"));
  });
}

export function getAdminEmails() {
  const env = getServerEnv();
  return (env.ADMIN_EMAILS || env.SMTP_USER || "info@iprixmedia.com")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}
