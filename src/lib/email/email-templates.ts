import { brand } from "@/lib/brand";

export function getEmailWrapper(contentHtml: string, previewText: string, ctaUrl?: string, ctaText?: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://iprixmedia.com";
  // Fallback logo url if env is local
  const logoUrl = brand.logo.startsWith("http") ? brand.logo : `${appUrl}${brand.logo}`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${previewText}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #fafafa;
      padding-bottom: 40px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      overflow: hidden;
      margin-top: 40px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
    }
    .header {
      background-color: #09090b;
      padding: 32px 40px;
      text-align: center;
    }
    .logo {
      height: 28px;
      width: auto;
      display: inline-block;
    }
    .content {
      padding: 40px;
      color: #18181b;
      line-height: 1.6;
      font-size: 15px;
    }
    .heading {
      font-size: 20px;
      font-weight: 700;
      color: #09090b;
      margin-top: 0;
      margin-bottom: 16px;
      letter-spacing: -0.025em;
    }
    .text {
      color: #3f3f46;
      margin-bottom: 24px;
      font-size: 14px;
    }
    .highlight-card {
      background-color: #f4f4f5;
      border: 1px solid #e4e4e7;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .button-container {
      margin-top: 28px;
      margin-bottom: 28px;
      text-align: center;
    }
    .button {
      background-color: #09090b;
      color: #ffffff !important;
      padding: 12px 28px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      border-radius: 8px;
      display: inline-block;
    }
    .footer {
      padding: 32px 40px;
      background-color: #fafafa;
      text-align: center;
      font-size: 11px;
      color: #71717a;
      border-top: 1px solid #e5e7eb;
    }
    .footer a {
      color: #3f3f46;
      text-decoration: underline;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      background-color: #f4f4f5;
      color: #18181b;
      font-size: 10px;
      font-weight: 700;
      border-radius: 9999px;
      text-transform: uppercase;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <img src="${logoUrl}" alt="${brand.company}" class="logo" />
      </div>
      <div class="content">
        ${contentHtml}
        ${ctaUrl && ctaText ? `
        <div class="button-container">
          <a href="${ctaUrl}" class="button" target="_blank">${ctaText}</a>
        </div>` : ""}
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} ${brand.company}. All rights reserved.</p>
        <p>${brand.address} | Founders: ${brand.founders}</p>
        <p>You received this transactional email related to your registered account on <a href="${appUrl}">${brand.appName}</a>.</p>
      </div>
    </div>
  </div>
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

export const emailTemplates: Record<
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
      `${process.env.NEXT_PUBLIC_APP_URL || "https://iprixmedia.com"}/dashboard`,
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
      `${process.env.NEXT_PUBLIC_APP_URL || "https://iprixmedia.com"}/dashboard`,
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
      `${process.env.NEXT_PUBLIC_APP_URL || "https://iprixmedia.com"}/pricing`,
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
      `${process.env.NEXT_PUBLIC_APP_URL || "https://iprixmedia.com"}/pricing`,
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
      `${process.env.NEXT_PUBLIC_APP_URL || "https://iprixmedia.com"}/dashboard/subscription`,
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
      `${process.env.NEXT_PUBLIC_APP_URL || "https://iprixmedia.com"}/dashboard/subscription`,
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
      `${process.env.NEXT_PUBLIC_APP_URL || "https://iprixmedia.com"}/dashboard/support`,
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
      `${process.env.NEXT_PUBLIC_APP_URL || "https://iprixmedia.com"}/dashboard/support`,
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
      `${process.env.NEXT_PUBLIC_APP_URL || "https://iprixmedia.com"}/dashboard/support`,
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
      `${process.env.NEXT_PUBLIC_APP_URL || "https://iprixmedia.com"}/dashboard/support`,
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
      process.env.NEXT_PUBLIC_APP_URL || "https://iprixmedia.com",
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
      `${process.env.NEXT_PUBLIC_APP_URL || "https://iprixmedia.com"}/dashboard`,
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
      `${process.env.NEXT_PUBLIC_APP_URL || "https://iprixmedia.com"}/pricing`,
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
      `${process.env.NEXT_PUBLIC_APP_URL || "https://iprixmedia.com"}/dashboard/settings`,
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
      `${process.env.NEXT_PUBLIC_APP_URL || "https://iprixmedia.com"}/dashboard/tutorial`,
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
      `${process.env.NEXT_PUBLIC_APP_URL || "https://iprixmedia.com"}/dashboard/templates`,
      "Manage Templates"
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
      process.env.NEXT_PUBLIC_APP_URL || "https://iprixmedia.com",
      "Visit Site"
    );
    return { subject, html };
  },
};
