import type { Metadata } from "next";
import { PublicShell } from "@/components/public-shell";
import { PricingSection } from "@/components/pricing-section";

export const metadata: Metadata = {
  title: "Affordable Pricing Plans for E-commerce Sellers | A+ Studio",
  description: "Check out monthly and yearly subscription options for A+ Studio. Automate listing generation and autofill forms starting at ₹99/month.",
  keywords: ["A+ Studio pricing", "seller automation plans", "AI listing tool cost", "Meesho seller tool plans"],
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <PublicShell>
      <PricingSection />
    </PublicShell>
  );
}
