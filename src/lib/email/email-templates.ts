import { brand } from "@/lib/brand";

const APP_URL = "https://aplusstudio.iprixmedia.com";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function getEmailWrapper(contentHtml: string, previewText: string, ctaUrl?: string, ctaText?: string) {
  const logoUrl = `${APP_URL}/aplus-logo.png`;
  const safePreview = escapeHtml(previewText);
  const safeCtaUrl = ctaUrl ? escapeHtml(ctaUrl) : "";
  const safeCtaText = ctaText ? escapeHtml(ctaText) : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>${safePreview}</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; display: block; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background: #f4f6fb; color: #0f172a; font-family: Arial, Helvetica, sans-serif; }
    .content { padding: 38px 42px; color: #0f172a; font-size: 15px; line-height: 1.7; }
    .heading { margin: 0 0 16px; color: #0f172a; font-size: 25px; line-height: 1.25; font-weight: 800; letter-spacing: -0.6px; }
    .text { margin: 0 0 20px; color: #475569; font-size: 14px; line-height: 1.75; }
    .highlight-card { margin: 24px 0; padding: 20px; border: 1px solid #e2e8f0; border-radius: 14px; background: #f8fafc; }
    .button-container { margin: 30px 0 10px; text-align: left; }
    .button { display: inline-block; padding: 14px 24px; border-radius: 12px; background: #4f46e5; color: #ffffff !important; font-size: 13px; font-weight: 800; line-height: 1; text-decoration: none; box-shadow: 0 8px 18px rgba(79,70,229,.22); }
    .badge { display: inline-block; margin: 0 0 16px; padding: 6px 11px; border-radius: 999px; background: #eef2ff; color: #4338ca; font-size: 9px; line-height: 1; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; }
    .footer-link { color: #4f46e5 !important; text-decoration: none; }
    @media screen and (max-width: 620px) { .email-shell { width: 100% !important; border-radius: 0 !important; } .content { padding: 30px 22px !important; } .header-cell { padding: 24px 22px !important; } .footer-cell { padding: 24px 22px !important; } }
  </style>
</head>
<body>
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${safePreview}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f4f6fb;">
    <tr><td align="center" style="padding:34px 12px;">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" class="email-shell" style="width:600px;max-width:600px;overflow:hidden;border:1px solid #e2e8f0;border-radius:22px;background:#ffffff;box-shadow:0 18px 45px rgba(15,23,42,.08);">
        <tr><td class="header-cell" style="padding:28px 42px;background:#0f172a;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
            <td width="48" valign="middle"><img src="${logoUrl}" width="42" height="42" alt="A+ Studio" style="width:42px;height:42px;border-radius:12px;"></td>
            <td valign="middle" style="padding-left:12px;color:#ffffff;"><div style="font-size:16px;line-height:1.2;font-weight:800;">A+ Studio</div><div style="margin-top:4px;color:#a5b4fc;font-size:9px;line-height:1;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">by Iprix Media</div></td>
            <td align="right" valign="middle" style="color:#cbd5e1;font-size:10px;font-weight:700;">Seller workspace</td>
          </tr></table>
        </td></tr>
        <tr><td class="content">${contentHtml}${ctaUrl && ctaText ? `<div class="button-container"><a href="${safeCtaUrl}" class="button" target="_blank" rel="noopener">${safeCtaText} &nbsp;→</a></div>` : ""}</td></tr>
        <tr><td class="footer-cell" style="padding:26px 42px;border-top:1px solid #e2e8f0;background:#f8fafc;text-align:center;color:#64748b;font-size:10px;line-height:1.7;">
          <p style="margin:0 0 6px;font-weight:700;color:#475569;">&copy; ${new Date().getFullYear()} ${brand.company}. All rights reserved.</p>
          <p style="margin:0 0 6px;">${brand.address} &nbsp;•&nbsp; ${brand.supportEmail}</p>
          <p style="margin:0;">This transactional email relates to your <a class="footer-link" href="${APP_URL}">${brand.appName}</a> account.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export type EmailTemplateInput = {
  name: string;
  url?: string;
  used?: number;
  limit?: number;
  amount?: number;
  plan?: string;
  error?: string;
  ticketId?: string;
  subject?: string;
  replyText?: string;
  inquiryName?: string;
  inquiryEmail?: string;
  inquiryMessage?: string;
  ip?: string;
  userAgent?: string;
  templateName?: string;
  platform?: string;
  message?: string;
};

function sanitizeEmailInput(input: EmailTemplateInput): EmailTemplateInput {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, typeof value === "string" ? escapeHtml(value) : value]),
  ) as EmailTemplateInput;
}

const emailTemplateBuilders: Record<
  string,
  (input: EmailTemplateInput) => { subject: string; html: string }
> = {
  verification: (input) => {
    const subject = "Verify your email address - A+ Studio";
    const html = getEmailWrapper(
      `<span class="badge">Security</span>
       <h1 class="heading">Verify Your Email Address</h1>
       <p class="text">Hi ${input.name},</p>
       <p class="text">Thank you for signing up for A+ Studio. Please click the button below to verify your email address and activate your account:</p>`,
      "Verify your email address",
      input.url,
      "Verify Email Address"
    );
    return { subject, html };
  },

  welcome: (input) => {
    const subject = "Welcome to A+ Studio by Iprix Media!";
    const html = getEmailWrapper(
      `<span class="badge">Welcome</span>
       <h1 class="heading">Welcome to the Premium Suite!</h1>
       <p class="text">Hi ${input.name},</p>
       <p class="text">We are thrilled to welcome you to A+ Studio. Your account is verified, and you can now start creating premium marketplace listings, saving reusable templates, and automating your workflow.</p>
       <div class="highlight-card">
         <p class="text" style="margin-bottom: 0; font-weight: bold;">Quick Start Checklist:</p>
         <ul class="text" style="margin-bottom: 0; padding-left: 20px;">
           <li>Install the A+ Studio Chrome Extension.</li>
           <li>Configure your listing templates.</li>
           <li>Open a marketplace form and try out Autofill.</li>
         </ul>
       </div>`,
      "Welcome to A+ Studio",
      `${APP_URL}/dashboard`,
      "Go to Dashboard"
    );
    return { subject, html };
  },

  forgot_password: (input) => {
    const subject = "Reset your password - A+ Studio";
    const html = getEmailWrapper(
      `<span class="badge">Security</span>
       <h1 class="heading">Password Reset Request</h1>
       <p class="text">Hi ${input.name},</p>
       <p class="text">We received a request to reset your password. Click the button below to set a new password. This link is valid for 1 hour:</p>`,
      "Reset your password",
      input.url,
      "Reset Password"
    );
    return { subject, html };
  },

  password_changed: (input) => {
    const subject = "Security Alert: Password Changed";
    const html = getEmailWrapper(
      `<span class="badge">Security</span>
       <h1 class="heading">Password Changed Successfully</h1>
       <p class="text">Hi ${input.name},</p>
       <p class="text">Your account password was successfully updated. If you did not make this change, please contact our support team immediately.</p>`,
      "Your password has changed",
      `${APP_URL}/dashboard`,
      "Go to Dashboard"
    );
    return { subject, html };
  },

  quota_warning_80: (input) => {
    const subject = "Warning: 80% quota usage reached - A+ Studio";
    const html = getEmailWrapper(
      `<span class="badge">Usage Limit</span>
       <h1 class="heading">Approaching Quota Limits</h1>
       <p class="text">Hi ${input.name},</p>
       <p class="text">This is a quick notification to let you know that you have used ${input.used} of your ${input.limit} listings. Upgrade your subscription to ensure uninterrupted service.</p>`,
      "Quota warning",
      `${APP_URL}/pricing`,
      "Upgrade Plan"
    );
    return { subject, html };
  },

  quota_warning_100: (input) => {
    const subject = "Alert: 100% quota usage reached - A+ Studio";
    const html = getEmailWrapper(
      `<span class="badge" style="background-color: #fee2e2; color: #991b1b;">Limit Reached</span>
       <h1 class="heading">Quota Limit Reached</h1>
       <p class="text">Hi ${input.name},</p>
       <p class="text">You have used ${input.used} of your ${input.limit} available listings. Please upgrade your plan to unlock more listings and continue generating high-converting copy.</p>`,
      "Limit Reached",
      `${APP_URL}/pricing`,
      "Upgrade Now"
    );
    return { subject, html };
  },

  payment_success: (input) => {
    const subject = "Payment Invoice & Confirmation - A+ Studio";
    const html = getEmailWrapper(
      `<span class="badge">Billing</span>
       <h1 class="heading">Payment Successful!</h1>
       <p class="text">Hi ${input.name},</p>
       <p class="text">Thank you for your subscription. We have received your payment of Rs ${input.amount}. Your ${input.plan} plan is now active.</p>
       <div class="highlight-card">
         <p class="text" style="margin: 0;"><strong>Invoice Summary:</strong></p>
         <p class="text" style="margin: 0; font-size: 13px;">Plan: ${input.plan}</p>
         <p class="text" style="margin: 0; font-size: 13px;">Amount Paid: Rs ${input.amount}</p>
         <p class="text" style="margin: 0; font-size: 13px;">Status: Paid & Active</p>
       </div>`,
      "Payment Confirmation",
      `${APP_URL}/dashboard/subscription`,
      "View Subscription"
    );
    return { subject, html };
  },

  payment_failed: (input) => {
    const subject = "Subscription Payment Failed - Action Required";
    const html = getEmailWrapper(
      `<span class="badge" style="background-color: #fee2e2; color: #991b1b;">Payment Failed</span>
       <h1 class="heading">Payment Failed</h1>
       <p class="text">Hi ${input.name},</p>
       <p class="text">We were unable to process your payment of Rs ${input.amount} for your ${input.plan} subscription.</p>
       <p class="text">Reason: ${input.error || "Declined by bank"}. Please update your payment method to keep your premium benefits active.</p>`,
      "Payment Failed",
      `${APP_URL}/dashboard/subscription`,
      "Update Billing Info"
    );
    return { subject, html };
  },

  ticket_created: (input) => {
    const subject = `Support Ticket #${input.ticketId} Created`;
    const html = getEmailWrapper(
      `<span class="badge">Support</span>
       <h1 class="heading">Support Ticket Created</h1>
       <p class="text">Hi ${input.name},</p>
       <p class="text">We have successfully opened support ticket <strong>#${input.ticketId}</strong> for you.</p>
       <div class="highlight-card">
         <p class="text" style="margin: 0;"><strong>Ticket Info:</strong></p>
         <p class="text" style="margin: 0; font-size: 13px;">Subject: ${input.subject}</p>
       </div>
       <p class="text">Our team is reviewing your request and will get back to you shortly.</p>`,
      `Ticket #${input.ticketId} created`,
      `${APP_URL}/dashboard/support`,
      "View Support Tickets"
    );
    return { subject, html };
  },

  support_ticket_created: (input) => {
    const subject = `Support Ticket #${input.ticketId} Created`;
    const html = getEmailWrapper(
      `<span class="badge">Support</span>
       <h1 class="heading">Support Ticket Created</h1>
       <p class="text">Hi ${input.name},</p>
       <p class="text">We have successfully opened support ticket <strong>#${input.ticketId}</strong> for you.</p>
       <div class="highlight-card">
         <p class="text" style="margin: 0;"><strong>Ticket Info:</strong></p>
         <p class="text" style="margin: 0; font-size: 13px;">Subject: ${input.subject}</p>
       </div>
       <p class="text">Our team is reviewing your request and will get back to you shortly.</p>`,
      `Ticket #${input.ticketId} created`,
      `${APP_URL}/dashboard/support`,
      "View Support Tickets"
    );
    return { subject, html };
  },

  support_ticket_resolved: (input) => {
    const subject = `Support Ticket #${input.ticketId} Resolved`;
    const html = getEmailWrapper(
      `<span class="badge" style="background-color: #d1fae5; color: #065f46;">Resolved</span>
       <h1 class="heading">Support Ticket Resolved</h1>
       <p class="text">Hi ${input.name},</p>
       <p class="text">Your support ticket <strong>#${input.ticketId}</strong> has been marked as resolved by our team.</p>
       <div class="highlight-card">
         <p class="text" style="margin: 0;"><strong>Ticket:</strong> ${input.subject}</p>
       </div>
       <p class="text">If you have any further questions or if this issue was not fully addressed, please reply or open a new ticket.</p>`,
      `Ticket #${input.ticketId} resolved`,
      `${APP_URL}/dashboard/support`,
      "View Support Tickets"
    );
    return { subject, html };
  },

  ticket_replied: (input) => {
    const subject = `New Reply on Support Ticket #${input.ticketId}`;
    const html = getEmailWrapper(
      `<span class="badge">Support</span>
       <h1 class="heading">Reply Added to Ticket</h1>
       <p class="text">Hi ${input.name},</p>
       <p class="text">A team member has replied to your support ticket <strong>#${input.ticketId}</strong>:</p>
       <div class="highlight-card">
         <p class="text" style="margin: 0; font-style: italic;">"${input.replyText}"</p>
       </div>`,
      "New support reply",
      `${APP_URL}/dashboard/support`,
      "Reply Back"
    );
    return { subject, html };
  },

  contact_received: (input) => {
    const subject = "We've received your enquiry - A+ Studio";
    const html = getEmailWrapper(
      `<span class="badge">Info</span>
       <h1 class="heading">Thank You for Contacting Us</h1>
       <p class="text">Hi ${input.name},</p>
       <p class="text">We have successfully received your business inquiry. A customer representative from Iprix Media will reach out to you within 24 business hours.</p>`,
      "Enquiry received",
      APP_URL,
      "Visit Website"
    );
    return { subject, html };
  },

  contact_admin_alert: (input) => {
    const subject = `Admin Alert: New Inquiry from ${input.inquiryName}`;
    const html = getEmailWrapper(
      `<span class="badge">System</span>
       <h1 class="heading">New Business Enquiry</h1>
       <p class="text">A new contact inquiry has been submitted with the following details:</p>
       <div class="highlight-card">
         <p class="text" style="margin: 0;">Name: ${input.inquiryName}</p>
         <p class="text" style="margin: 0;">Email: ${input.inquiryEmail}</p>
         <p class="text" style="margin: 0;">Message: ${input.inquiryMessage}</p>
       </div>`,
      "New inquiry alert"
    );
    return { subject, html };
  },

  plan_upgrade: (input) => {
    const subject = "Plan Upgraded Successfully - A+ Studio";
    const html = getEmailWrapper(
      `<span class="badge">Billing</span>
       <h1 class="heading">Plan Upgraded</h1>
       <p class="text">Hi ${input.name},</p>
       <p class="text">Your A+ Studio plan has been successfully upgraded to <strong>${input.plan}</strong>. You now have access to higher template limits, additional listings, and all beta features.</p>`,
      "Plan upgraded",
      `${APP_URL}/dashboard`,
      "Go to Dashboard"
    );
    return { subject, html };
  },

  plan_downgrade: (input) => {
    const subject = "Plan Downgrade Alert - A+ Studio";
    const html = getEmailWrapper(
      `<span class="badge">Billing</span>
       <h1 class="heading">Plan Downgraded</h1>
       <p class="text">Hi ${input.name},</p>
       <p class="text">Your subscription plan has been downgraded to <strong>${input.plan}</strong>. If this was a mistake or you wish to re-subscribe, click below:</p>`,
      "Plan downgraded",
      `${APP_URL}/pricing`,
      "Resubscribe"
    );
    return { subject, html };
  },

  login_alert: (input) => {
    const subject = "Security Alert: New Sign In Detected";
    const html = getEmailWrapper(
      `<span class="badge">Security</span>
       <h1 class="heading">New Sign In Detected</h1>
       <p class="text">Hi ${input.name},</p>
       <p class="text">A new sign in was detected on your A+ Studio account.</p>
       <div class="highlight-card">
         <p class="text" style="margin: 0;">IP Address: ${input.ip || "Unknown"}</p>
         <p class="text" style="margin: 0;">Device/Browser: ${input.userAgent || "Unknown"}</p>
       </div>
       <p class="text">If this was you, no action is needed. If you do not recognize this activity, please reset your password immediately.</p>`,
      "New login alert",
      `${APP_URL}/dashboard/settings`,
      "Account Security"
    );
    return { subject, html };
  },

  extension_connected: (input) => {
    const subject = "Chrome Extension Successfully Connected!";
    const html = getEmailWrapper(
      `<span class="badge">Extension</span>
       <h1 class="heading">Extension Connected!</h1>
       <p class="text">Hi ${input.name},</p>
       <p class="text">Your A+ Studio Chrome Extension has been successfully authorized and connected to your account.</p>
       <p class="text">You can now automatically save listing drafts and autofill forms on Flipkart, Amazon, and Meesho supplier portals.</p>`,
      "Extension connected",
      `${APP_URL}/dashboard/tutorial`,
      "View Extension Tutorial"
    );
    return { subject, html };
  },

  template_captured: (input) => {
    const subject = "New Template Saved - A+ Studio";
    const html = getEmailWrapper(
      `<span class="badge">Template</span>
       <h1 class="heading">Listing Template Saved</h1>
       <p class="text">Hi ${input.name},</p>
       <p class="text">You have successfully saved a new template: <strong>${input.templateName}</strong> for <strong>${input.platform}</strong>.</p>
       <p class="text">This template is now synced to your dashboard and available for instant autofilling.</p>`,
      "Template saved",
      `${APP_URL}/dashboard/templates`,
      "Manage Templates"
    );
    return { subject, html };
  },

  newsletter_welcome: (input) => {
    const subject = "You're subscribed to A+ Studio updates";
    const html = getEmailWrapper(
      `<span class="badge">Product updates</span>
       <h1 class="heading">Welcome to A+ Studio updates</h1>
       <p class="text">Hi ${input.name},</p>
       <p class="text">You are now subscribed to practical seller workflow tips, new A+ Studio features and important product announcements. We keep these updates focused and useful.</p>
       <div class="highlight-card"><p class="text" style="margin:0;"><strong>While you wait:</strong> explore the free Meesho calculators, listing checks and step-by-step extension documentation.</p></div>`,
      "You're subscribed to A+ Studio updates",
      `${APP_URL}/tools`,
      "Explore Free Seller Tools",
    );
    return { subject, html };
  },

  system_alert: (input) => {
    const subject = "System Notification - A+ Studio";
    const html = getEmailWrapper(
      `<span class="badge">System</span>
       <h1 class="heading">Important Announcement</h1>
       <p class="text">Hi ${input.name},</p>
       <p class="text">${input.message}</p>`,
      "System notice",
      APP_URL,
      "Visit Site"
    );
    return { subject, html };
  },
};

export const emailTemplates: Record<
  string,
  (input: EmailTemplateInput) => { subject: string; html: string }
> = Object.fromEntries(
  Object.entries(emailTemplateBuilders).map(([trigger, builder]) => [
    trigger,
    (input: EmailTemplateInput) => builder(sanitizeEmailInput(input)),
  ]),
);
