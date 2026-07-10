import type { Metadata } from "next";
import { PriceCalculator } from "@/components/seller-tools";
import { ToolPage } from "@/components/tool-page";

const title = "Free Meesho Price Calculator — What Price Should I Sell At?";
const description =
  "Enter the profit you want per order and get the minimum Meesho listing price — commission, GST on fees, shipping, packaging, ads and RTO losses all factored in. Free, no login.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "meesho price calculator",
    "meesho selling price calculator",
    "meesho listing price kaise rakhe",
    "product pricing calculator india",
    "meesho breakeven price",
  ],
  alternates: { canonical: "/tools/meesho-price-calculator" },
  openGraph: { title, description, url: "https://aplusstudio.iprixmedia.com/tools/meesho-price-calculator", siteName: "A+ Studio", type: "website" },
  twitter: { card: "summary", title, description },
};

const faq = [
  {
    question: "How do I decide my Meesho selling price?",
    answer:
      "Work backwards from the profit you want: add product cost, packaging, ads and shipping, account for commission and 18% GST on fees, then buffer for RTO losses. This calculator solves that equation and gives the minimum listing price plus a psychological 'charm price' ending in 9.",
  },
  {
    question: "What is a breakeven price?",
    answer:
      "The price at which, after all fees and expected RTO losses, your profit is exactly ₹0. Selling below breakeven means every order loses money. Always price above it with enough buffer for rate changes.",
  },
  {
    question: "Is the suggested price guaranteed?",
    answer:
      "No — commission and shipping vary by category, zone and Meesho's periodic revisions. Treat this as a planning estimate and verify your category rate card in the Supplier Panel.",
  },
];

export default function Page() {
  return (
    <ToolPage
      slug="meesho-price-calculator"
      title="Meesho Price Calculator"
      subtitle="Batao har order par kitna profit chahiye — ye tool commission, GST, shipping, ads aur RTO ghata kar minimum listing price aur charm price nikal dega. Planning estimates only."
      faq={faq}
    >
      <PriceCalculator />
    </ToolPage>
  );
}
