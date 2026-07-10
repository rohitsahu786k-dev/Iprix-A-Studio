import type { Metadata } from "next";
import { ImageChecker } from "@/components/seller-tools";
import { ToolPage } from "@/components/tool-page";

const title = "Free Meesho Image Checker — Size, Ratio & Background Test";
const description =
  "Check your Meesho listing image before upload: resolution, 1:1 square ratio, white-background percentage, brightness and file size — instantly in your browser. Free, no login.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "meesho image checker",
    "meesho listing image size",
    "meesho image size 512x512",
    "meesho image guidelines",
    "product image checker free",
  ],
  alternates: { canonical: "/tools/meesho-image-checker" },
  openGraph: { title, description, url: "https://aplusstudio.iprixmedia.com/tools/meesho-image-checker", siteName: "A+ Studio", type: "website" },
  twitter: { card: "summary", title, description },
};

const faq = [
  {
    question: "What is the correct Meesho listing image size?",
    answer:
      "Minimum 512×512 px; we recommend 1000×1000 px or higher with a 1:1 square ratio, plain white background, no text/watermark, and file size under 2 MB. This checker verifies all of it in one click.",
  },
  {
    question: "Why does my first image matter so much on Meesho?",
    answer:
      "Meesho verifies declared weight and category against the FIRST catalog image, and its vision system estimates the product's bulk from it. A cluttered or combo-looking first image causes shipping overcharges and rejected weight claims.",
  },
  {
    question: "Is my image uploaded to a server?",
    answer: "No. The analysis runs 100% in your browser — the image never leaves your device.",
  },
];

export default function Page() {
  return (
    <ToolPage
      slug="meesho-image-checker"
      title="Meesho Image Checker"
      subtitle="Upload se pehle first image check karo — size, square ratio, white background aur brightness. Rejection aur shipping overcharge se bacho. 100% browser me chalta hai."
      faq={faq}
    >
      <ImageChecker />
    </ToolPage>
  );
}
