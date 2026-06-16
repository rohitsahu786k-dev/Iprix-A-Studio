import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://iprixmedia.com"),
  title: {
    default: "A+ Studio by Iprix Media - AI Listing Autofill Tool for Indian Sellers",
    template: "%s | A+ Studio",
  },
  description:
    "Create marketplace-ready product listings, AI titles, descriptions, keywords, SKUs and images for Meesho, Flipkart and Amazon sellers.",
  keywords: ["A+ Studio", "Iprix Media", "Meesho listing automation", "Chrome extension", "AI listing tool"],
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
    url: "https://iprixmedia.com",
    siteName: "A+ Studio",
    type: "website",
    images: [{ url: "/seller-dashboard.png", width: 1200, height: 630, alt: "A+ Studio seller dashboard" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "A+ Studio by Iprix Media",
    description: "AI-powered listing automation for Indian marketplace sellers.",
    images: ["/seller-dashboard.png"],
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
