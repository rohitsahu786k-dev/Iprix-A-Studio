"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Boxes,
  Layers3,
  Package,
  Sparkles,
  Image as ImageIcon,
  FileText,
  Search,
  Bot,
  FileSpreadsheet,
  CreditCard,
  BookOpen,
  Bell,
  HelpCircle,
  Settings,
  Users,
} from "lucide-react";

const navIcons = {
  Overview: Home,
  Listings: Boxes,
  Templates: Layers3,
  Products: Package,
  "Smart Listings": Sparkles,
  "Image Maker": ImageIcon,
  "Label Analyser": FileText,
  "Keyword Research": Search,
  "AI Content Studio": Bot,
  "Bulk CSV Upload": FileSpreadsheet,
  Subscription: CreditCard,
  Tutorial: BookOpen,
  Notifications: Bell,
  Support: HelpCircle,
  Settings,
  Team: Users,
};

interface DashboardNavProps {
  links: [string, string][];
}

export function DashboardNav({ links }: DashboardNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto lg:grid lg:overflow-visible pr-2">
      {links.map(([label, href]) => {
        const Icon = navIcons[label as keyof typeof navIcons] || Boxes;
        const isActive = pathname === href;

        return (
          <Link
            key={href}
            href={href}
            className={`group relative flex shrink-0 items-center justify-between gap-3 rounded-2xl px-4 py-3 text-xs font-bold transition-all duration-200 ${
              isActive
                ? "bg-indigo-650/15 border border-indigo-500/20 text-indigo-400 shadow-md shadow-indigo-950/40"
                : "text-zinc-400 hover:bg-zinc-900/80 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-3">
              <Icon
                className={`h-4.5 w-4.5 transition-colors duration-200 ${
                  isActive ? "text-white" : "text-zinc-500 group-hover:text-white"
                }`}
              />
              <span className="whitespace-nowrap">{label}</span>
            </span>

            {/* Beta badges or count labels */}
            {["Smart Listings", "Image Maker", "Label Analyser", "Keyword Research"].includes(label) ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide transition-all ${
                  isActive
                    ? "bg-zinc-900/50 backdrop-blur-md/20 text-white"
                    : "bg-zinc-900 text-zinc-400 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                }`}
              >
                Beta
              </span>
            ) : null}

            {/* Micro-dot active indicator on right */}
            {isActive && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-zinc-900/50 backdrop-blur-md animate-pulse" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
