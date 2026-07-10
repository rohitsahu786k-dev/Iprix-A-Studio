import type { Metadata } from "next";
import { ShippingCalculator } from "@/components/seller-tools";
import { ToolPage } from "@/components/tool-page";

const title = "Free Meesho Shipping Calculator — Volumetric Weight & Slab";
const description =
  "Calculate Meesho chargeable weight before you publish: volumetric weight (L×B×H÷5000) vs dead weight, courier slab and estimated local/national shipping charge. Free, no login.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "meesho shipping calculator",
    "meesho volumetric weight calculator",
    "meesho shipping charges calculator",
    "volumetric weight calculator india",
    "meesho chargeable weight",
  ],
  alternates: { canonical: "/tools/meesho-shipping-calculator" },
  openGraph: { title, description, url: "https://aplusstudio.iprixmedia.com/tools/meesho-shipping-calculator", siteName: "A+ Studio", type: "website" },
  twitter: { card: "summary", title, description },
};

const faq = [
  {
    question: "How is Meesho shipping weight calculated?",
    answer:
      "Couriers charge on the higher of dead weight and volumetric weight. Volumetric weight (kg) = Length × Breadth × Height in cm ÷ 5000. If your packed box is 30×25×5 cm, volumetric weight is 0.75kg even if the product weighs 300g — you pay for 0.75kg.",
  },
  {
    question: "Why is my Meesho shipping charge higher than expected?",
    answer:
      "Usually because volumetric weight exceeds dead weight (bulky packaging), or because Meesho's system estimated a higher bulk from your listing image. Reduce packed dimensions, and use a compact white-background first image — try our free Low-Shipping Image Generator.",
  },
  {
    question: "Are these shipping charges exact?",
    answer:
      "No — they are planning estimates. Final charges vary by courier, zone and category, and Meesho revises rates regularly. Always confirm the final charge in your Meesho Supplier Panel.",
  },
];

export default function Page() {
  return (
    <ToolPage
      slug="meesho-shipping-calculator"
      title="Meesho Shipping Calculator"
      subtitle="Publish karne se pehle chargeable weight aur slab jaan lo — volumetric vs dead weight, aur estimated shipping charge. Estimates only; final charge Supplier Panel me confirm karein."
      faq={faq}
    >
      <ShippingCalculator />
    </ToolPage>
  );
}
