import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://aplusstudio.iprixmedia.com"),
  title: {
    default: "Meesho Listing AI Tool & Chrome Extension — Free AI Listing Generator | A+ Studio",
    template: "%s | A+ Studio — Meesho Listing AI Tool",
  },
  description:
    "Free AI listing generator + Meesho listing extension for Indian sellers. Create catalog titles, descriptions, keywords & SKUs, autofill Meesho listings, research keywords free, and check image size & shipping weight.",
  keywords: [
    "meesho listing tool",
    "meesho listing extension",
    "meesho listing ai tool",
    "ai listing generator free",
    "meesho catalog upload",
    "meesho catalogue maker",
    "product listing software india",
    "meesho keyword research tool",
    "A+ Studio",
    "Iprix Media",
  ],
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [
      { rel: "manifest", url: "/site.webmanifest" },
      { rel: "icon", url: "/android-chrome-192x192.png", sizes: "192x192" },
      { rel: "icon", url: "/android-chrome-512x512.png", sizes: "512x512" },
    ],
  },
  openGraph: {
    title: "A+ Studio by Iprix Media",
    description:
      "AI listing autofill, templates, keywords, SKUs, images and seller automation for Indian marketplaces.",
    url: "https://aplusstudio.iprixmedia.com",
    siteName: "A+ Studio",
    type: "website",
    images: [{ url: "https://aplusstudio.iprixmedia.com/seller-dashboard.png", width: 1200, height: 630, alt: "A+ Studio seller dashboard" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "A+ Studio by Iprix Media",
    description: "AI-powered listing automation for Indian marketplace sellers.",
    images: ["https://aplusstudio.iprixmedia.com/seller-dashboard.png"],
  },
  verification: {
    google: "VlbcOEYvmtWDcrr1rWxsMvY6hUKC6HVdQzEs6CuEPf0",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={beVietnam.variable} data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
