import nodemailer from "nodemailer";
import { getServerEnv, isConfigured } from "@/lib/env";

export function getMailer() {
  const env = getServerEnv();
  if (!isConfigured("SMTP_HOST", "SMTP_USER", "SMTP_PASS", "SMTP_FROM")) {
    throw new Error("SMTP is not configured");
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

export async function sendContactEmail(input: {
  name: string;
  email: string;
  phone?: string;
  businessType?: string;
  message: string;
}) {
  if (!isConfigured("SMTP_HOST", "SMTP_USER", "SMTP_PASS", "SMTP_FROM")) {
    return { sent: false, reason: "SMTP not configured" };
  }

  const env = getServerEnv();
  const transporter = getMailer();

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: env.ADMIN_EMAILS || env.SMTP_USER,
    replyTo: input.email,
    subject: `A+ Studio enquiry from ${input.name}`,
    text: [
      `Name: ${input.name}`,
      `Email: ${input.email}`,
      `Phone: ${input.phone || "-"}`,
      `Business type: ${input.businessType || "-"}`,
      "",
      input.message,
    ].join("\n"),
  });
  return { sent: true };
}
