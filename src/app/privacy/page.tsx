import { LegalPage } from "@/components/legal-page";

export const metadata = { title: "Privacy Policy - A+ Studio" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      items={[
        "A+ Studio stores account, product, listing, template, uploaded media, AI usage and subscription data needed to run the service.",
        "Payment data is processed by Razorpay; server-side secrets must never be exposed to the browser or extension.",
        "The extension only reads marketplace listing pages where it is active and uses that data to save templates, detect fields and autofill forms.",
        "Uploaded images and generated files can be stored in Cloudinary with deletion controls and signed URLs where needed.",
        "Users can request data deletion by contacting info@iprixmedia.com.",
      ]}
    />
  );
}
