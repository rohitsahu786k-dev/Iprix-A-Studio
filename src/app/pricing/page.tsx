import type { Metadata } from "next";
import { PublicShell } from "@/components/public-shell";
import { PricingSection } from "@/components/pricing-section";

export const metadata: Metadata = { title: "Pricing | A+ Studio" };

export default function PricingPage() {
  return (
    <PublicShell>
      <PricingSection />
    </PublicShell>
  );
}
