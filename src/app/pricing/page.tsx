import type { Metadata } from "next";
import { PublicShell } from "@/components/public-shell";
import { PricingSection } from "@/components/pricing-section";

export const metadata: Metadata = {
  title: "Affordable Seller Tool Pricing Plans | A+ Studio",
  description: "Check out monthly and yearly subscription options for A+ Studio. Automate listing generation and autofill forms starting at ₹99/month.",
  keywords: ["A+ Studio pricing", "seller automation plans", "AI listing tool cost", "Meesho seller tool plans"],
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Affordable Pricing Plans for E-commerce Sellers | A+ Studio",
    description: "Check out monthly and yearly subscription options for A+ Studio. Automate listing generation and autofill forms starting at ₹99/month.",
    url: "https://aplusstudio.iprixmedia.com/pricing",
    siteName: "A+ Studio",
    type: "website",
    images: [{ url: "https://aplusstudio.iprixmedia.com/seller-dashboard.png", width: 1200, height: 630, alt: "A+ Studio Pricing" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Affordable Seller Tool Pricing Plans | A+ Studio",
    description: "Check out monthly and yearly subscription options for A+ Studio. Automate listing generation and autofill forms starting at ₹99/month.",
    images: ["https://aplusstudio.iprixmedia.com/seller-dashboard.png"],
  },
};

export default function PricingPage() {
  return (
    <PublicShell>
      <PricingSection />
    </PublicShell>
  );
}
