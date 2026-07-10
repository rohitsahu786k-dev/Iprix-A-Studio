import type { Metadata } from "next";
import { TitleChecker } from "@/components/seller-tools";
import { ToolPage } from "@/components/tool-page";

const title = "Free Meesho Title Checker — Length, Keywords & Banned Words";
const description =
  "Score your Meesho or Flipkart listing title in one click: character length, keyword coverage, banned/risky words and readability — with instant improvement tips. Free, no login.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "meesho title checker",
    "meesho listing title kaise likhe",
    "product title checker",
    "listing title optimizer free",
    "meesho title length",
  ],
  alternates: { canonical: "/tools/meesho-title-checker" },
  openGraph: { title, description, url: "https://aplusstudio.iprixmedia.com/tools/meesho-title-checker", siteName: "A+ Studio", type: "website" },
  twitter: { card: "summary", title, description },
};

const faq = [
  {
    question: "What makes a good Meesho listing title?",
    answer:
      "Front-load the strongest buyer keywords (product type, material, audience), keep it natural — no keyword stuffing or ALL CAPS — and avoid risky claims like 'best', 'guaranteed' or brand names you don't own. Aim for clear, searchable and compliant.",
  },
  {
    question: "How long should a listing title be?",
    answer:
      "Long enough to cover product type + key attributes + audience, short enough to stay readable — typically 50–120 characters works well across Meesho and Flipkart. The checker flags too-short and over-stuffed titles.",
  },
  {
    question: "Can AI write my titles too?",
    answer:
      "Yes — the free A+ Studio account includes AI title generation tuned for Indian marketplaces, with keyword coverage scoring and multiple variations on paid plans.",
  },
];

export default function Page() {
  return (
    <ToolPage
      slug="meesho-title-checker"
      title="Meesho Title Checker"
      subtitle="Har title publish se pehle check karo — length, keyword coverage, banned words aur readability, instant improvement tips ke saath."
      faq={faq}
    >
      <TitleChecker />
    </ToolPage>
  );
}
