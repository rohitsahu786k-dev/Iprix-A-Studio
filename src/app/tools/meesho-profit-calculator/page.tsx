import type { Metadata } from "next";
import { ProfitCalculator } from "@/components/seller-tools";
import { ToolPage } from "@/components/tool-page";

const title = "Free Meesho Profit Calculator — GST, Commission, RTO Included";
const description =
  "Calculate real per-order profit on Meesho after commission, GST on fees, shipping, packaging, ads and RTO losses. See bank settlement, margin and breakeven price. Free, no login.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "meesho profit calculator",
    "meesho seller profit calculator",
    "meesho settlement calculator",
    "meesho margin calculator",
    "rto loss calculator",
  ],
  alternates: { canonical: "/tools/meesho-profit-calculator" },
  openGraph: { title, description, url: "https://aplusstudio.iprixmedia.com/tools/meesho-profit-calculator", siteName: "A+ Studio", type: "website" },
  twitter: { card: "summary", title, description },
};

const faq = [
  {
    question: "How is Meesho seller profit calculated?",
    answer:
      "Profit per delivered order = bank settlement − product cost − packaging − ads − product GST. Settlement = selling price − commission − shipping charged to you − 18% GST on those fees. Then factor RTO: real profit = delivered profit × (1 − RTO%) − RTO% × loss per returned order.",
  },
  {
    question: "Why am I losing money even with a margin?",
    answer:
      "RTO (returns) is the usual killer: each returned COD order costs you forward + return shipping and repackaging. At 15–20% RTO, a thin margin turns negative. This calculator shows real profit after RTO so you can fix price or block RTO-heavy pin codes.",
  },
  {
    question: "What profit margin is good on Meesho?",
    answer:
      "Most healthy Meesho sellers target 15%+ margin per delivered order after ads and RTO. Below 10%, one rate revision or a returns spike can wipe out the month — use the breakeven price shown to set a safe floor.",
  },
];

export default function Page() {
  return (
    <ToolPage
      slug="meesho-profit-calculator"
      title="Meesho Profit Calculator"
      subtitle="Commission, GST, shipping, ads aur RTO ke baad har order ka REAL profit dekho — settlement, margin aur breakeven price ke saath. Planning estimates only."
      faq={faq}
    >
      <ProfitCalculator />
    </ToolPage>
  );
}
