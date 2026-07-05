# A+ Studio by Iprix Media

Production-ready Next.js SaaS foundation plus Manifest V3 Chrome extension for Indian marketplace sellers.

## Tech stack

Next.js App Router, TypeScript, MongoDB/Mongoose, Tailwind CSS, Zod, secure HTTP-only JWT cookies, Cloudinary, OpenAI Responses API, Nodemailer SMTP, Razorpay checkout/webhook framework, and Chrome Extension Manifest V3.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Fill MongoDB, JWT, OpenAI, Cloudinary, SMTP, Razorpay and app URL values.
3. Run `npm install`.
4. Run `npm run seed` to create:
   - Admin: `admin@iprixmedia.com` / `Admin@12345`
   - Demo user: `user@iprixmedia.com` / `User@12345`
5. Change both default passwords immediately after first login.
6. Run `npm run dev` and open `http://localhost:3000`.

## Environment

Secrets stay server-side only. Never put MongoDB, OpenAI, Cloudinary, SMTP, Razorpay or JWT secrets in frontend or extension code.

Required keys are documented in `.env.example`, including:

- `MONGODB_URI`
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`

## Webapp

- Public pages: Home, Features, Chrome Extension, Pricing, About, Contact, Terms, Privacy, Refund, Login, Signup, Forgot Password, Reset Password.
- User dashboard: overview, AI listings, templates, products, smart listings, image maker, label analyser, keyword research, AI content studio, CSV upload, subscription, tutorial, notifications, support, settings and team.
- Admin dashboard: overview, users, plans, subscriptions, payments, AI listings, keyword reports, products, templates, extension logs, contact inquiries, support tickets, feature flags, security logs, notifications, settings and audit logs.
- APIs: auth, products, templates, listings, smart listings, AI, images, labels, keywords, subscription, Razorpay webhook, contact, notifications, admin and extension.

## AI usage rules

- Free users get 5 lifetime AI listings and 5 lifetime keyword research reports.
- AI listing generation creates a draft preview and does not consume usage.
- Usage is consumed only when the user saves, sends to extension, exports, or completes extension autofill.
- Keyword research consumes usage only after a successful report.
- Failed AI calls are logged and do not consume usage.
- All AI calls run through backend routes only; no OpenAI key is exposed to the frontend or extension.

## Security notes

- Auth uses secure HTTP-only cookies and server-side route protection.
- Password and reset tokens are hashed.
- Auth, contact and AI routes have server-side rate limiting.
- Admin APIs require admin role.
- Payment plan activation must happen from verified Razorpay webhooks only.
- Do not commit real secrets. Use `.env.example` as the only shared env reference.

## Chrome extension

Load unpacked from `extension/` in `chrome://extensions`.

The MVP supports Meesho detection, field scanning, login, templates/products fetch, safe autofill preview and backend extension logs. Flipkart and Amazon are marked beta/Coming Soon until selectors are finalized.

Build a store zip:

```bash
npm run extension:zip
```

Chrome Web Store checklist:

- Use production `apiBase` in `extension/config.js`.
- Add screenshots for popup, Meesho detection, template save and autofill preview.
- Link privacy policy: `/privacy-policy`.
- Explain permissions: storage, activeTab, scripting and Meesho host access.

## Deployment

Run:

```bash
npm run typecheck
npm run lint
npm run build
```

Deploy to Vercel with the same environment variables. Configure Razorpay webhook URL as `/api/subscription/webhook`.

## QA

Run the full checklist in `QA_CHECKLIST.md` before any production release. It covers public pages, auth, dashboard, admin, subscription, Chrome extension, security and build verification.

## Known Coming Soon

Background removal, advanced carrier detection, embedded tutorial videos, public social links, Flipkart full selectors and Amazon full selectors are visibly marked Coming Soon until live integrations are completed.
