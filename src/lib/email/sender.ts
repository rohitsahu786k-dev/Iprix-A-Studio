import { getMailer } from "@/lib/mail";
import { emailTemplates, EmailTemplateInput } from "./email-templates";
import { EmailLog } from "@/models";
import { connectDb } from "@/lib/db";
import { getServerEnv } from "@/lib/env";

export async function sendMailWithLog(
  userId: string | null,
  to: string,
  trigger: keyof typeof emailTemplates,
  input: EmailTemplateInput,
  metadata?: Record<string, any>
) {
  try {
    const templateBuilder = emailTemplates[trigger];
    if (!templateBuilder) {
      console.error(`Email template trigger not found: ${trigger}`);
      return { sent: false, error: `Template trigger "${trigger}" not found` };
    }

    const { subject, html } = templateBuilder(input);
    const env = getServerEnv();
    const from = env.SMTP_FROM || "info@iprixmedia.com";

    let sendError: string | undefined = undefined;
    let status: "sent" | "failed" = "sent";

    try {
      const transporter = getMailer();
      await transporter.sendMail({
        from,
        to,
        subject,
        html,
      });
    } catch (err: any) {
      console.error(`Error sending SMTP email for trigger "${trigger}":`, err);
      sendError = err?.message || String(err);
      status = "failed";
    }

    try {
      await connectDb();
      await EmailLog.create({
        userId: userId || null,
        to,
        subject,
        trigger,
        status,
        errorMessage: sendError,
        metadata: {
          ...metadata,
          input,
        },
      });
    } catch (dbErr) {
      console.error("Failed to write email log to database:", dbErr);
    }

    return { sent: status === "sent", error: sendError };
  } catch (outerErr: any) {
    console.error("Fatal error in sendMailWithLog:", outerErr);
    return { sent: false, error: outerErr?.message || String(outerErr) };
  }
}
