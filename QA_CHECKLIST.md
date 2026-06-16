# A+ Studio QA Checklist

Run this before production deployment.

## Build

- [ ] `npm run lint` passes.
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] No broken imports, route errors, or console errors on core flows.

## Public Website

- [ ] Header and footer render on Home, Features, Chrome Extension, Pricing, About, Contact, Terms, Privacy, Refund, Login, Signup, Forgot Password and Reset Password.
- [ ] Pricing paid plans send logged-out users to login with a safe `next` checkout URL.
- [ ] Logged-in users choosing a paid plan land on dashboard subscription checkout, not signup.
- [ ] Contact form validates input, rate-limits spam, saves inquiry, and sends email when SMTP is configured.
- [ ] SEO metadata, sitemap, robots, Open Graph and favicon assets exist.
- [ ] No dark borders are used on forms or dividers.

## Auth

- [ ] Signup creates a free user with 5 AI listing and 5 keyword report limits.
- [ ] Login, logout, forgot password and reset password work.
- [ ] Protected dashboard routes redirect unauthenticated users.
- [ ] Admin routes require admin role.
- [ ] Suspended users cannot use APIs.
- [ ] Rate limits trigger on repeated auth requests.

## User Dashboard

- [ ] Overview shows real database counts, not dummy numbers.
- [ ] Onboarding checklist is clear.
- [ ] AI Listing flow requires product and brand context.
- [ ] AI listing generation creates a draft without consuming usage.
- [ ] Save Listing consumes usage once.
- [ ] Send to Extension consumes usage once and creates a template.
- [ ] CSV export is blocked for free users and consumes usage for paid plans.
- [ ] Existing listings/templates remain visible after limit is reached.
- [ ] Keyword research creates structured reports and consumes keyword usage only on success.
- [ ] 6th free AI listing is blocked.
- [ ] 6th free keyword report is blocked.
- [ ] Upgrade modal appears after free limit.
- [ ] Products, templates, notifications, team and support ticket forms save real backend records.

## Admin Dashboard

- [ ] Overview stats load: total users, free users, paid users, active subscriptions, MRR estimate, payments, AI listings, keyword reports, limit-risk users, extension autofills, failed AI, failed payments, contact inquiries and support tickets.
- [ ] Admin can search/filter exported data manually from resource tables.
- [ ] Admin can suspend/activate users.
- [ ] Admin can reset listing usage and keyword usage.
- [ ] Admin can change a user to Free or Seller.
- [ ] Plans, payments, AI usage, keyword reports, products, templates, extension logs, support tickets, feature flags, security logs and audit logs are visible.

## Subscription

- [ ] Server calculates plan pricing.
- [ ] Razorpay order creation works when credentials are configured.
- [ ] Missing Razorpay credentials show a safe configuration message.
- [ ] Webhook signature is verified.
- [ ] Paid plan activation happens only after verified captured payment webhook.
- [ ] Paid listing and keyword monthly limits are set after activation.

## Chrome Extension

- [ ] Popup shows logo, user, current plan, AI listing usage and keyword usage.
- [ ] Login works through backend only.
- [ ] Marketplace detection works on supported pages.
- [ ] Fill & Save Template captures listing fields only.
- [ ] Password, OTP, payment, cookie and private account fields are ignored.
- [ ] User can preview/edit captured fields.
- [ ] Template saves to backend and appears in dashboard.
- [ ] Autofill never auto-submits marketplace forms.
- [ ] Autofill success consumes listing usage once.
- [ ] Extension logs capture success/failure.
- [ ] No OpenAI, MongoDB, Razorpay, Cloudinary or SMTP secrets exist in extension files.

## Security

- [ ] No real secrets are committed.
- [ ] All user resources query by `userId`.
- [ ] Admin APIs are admin-only.
- [ ] AI, auth and contact routes are rate-limited.
- [ ] AI output is requested as structured JSON and retried once on parse failure.
- [ ] Failed AI calls do not consume usage.
- [ ] Payment webhook is idempotent enough to avoid duplicate quota reset.
- [ ] Upload routes validate file type/size before production use.

## Coming Soon Labels

- [ ] Features not fully integrated are visibly marked Coming Soon.
- [ ] No button claims a working flow unless a backend route exists and returns a real result.
