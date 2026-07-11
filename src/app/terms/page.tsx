import { LegalPage } from "@/components/legal-page";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      items={[
        "A+ Studio helps generate and autofill listing content, but users are responsible for reviewing and submitting final marketplace listings.",
        "The service does not guarantee marketplace approval, ranking, sales or compliance.",
        "Users must keep account credentials secure and use the Chrome extension only on pages they are authorized to manage.",
        "Subscriptions, renewals, cancellations and invoices are handled through Razorpay once production billing is enabled.",
        "Abuse, scraping, spam, marketplace policy violations and attempts to bypass plan limits are prohibited.",
      ]}
    />
  );
}
