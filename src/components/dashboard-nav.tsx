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
    <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto lg:grid lg:gap-1.5 lg:overflow-visible pr-2 py-2">
      {links.map(([label, href]) => {
        const Icon = navIcons[label as keyof typeof navIcons] || Boxes;
        const isActive = pathname === href;

        return (
          <Link
            key={href}
            href={href}
            className={`group relative flex shrink-0 items-center justify-between gap-3 rounded-xl px-4 py-3 text-[11px] font-bold tracking-wide transition-all duration-300 ease-out ${
              isActive
                ? "bg-gradient-to-r from-indigo-500/12 to-violet-500/6 border border-indigo-500/30 border-l-[3px] border-l-indigo-550 text-indigo-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03),0_8px_16px_rgba(99,102,241,0.05)]"
                : "text-zinc-400 hover:bg-zinc-900/50 hover:text-white hover:translate-x-1 border border-transparent"
            }`}
          >
            <span className="flex items-center gap-3">
              <Icon
                className={`h-4.5 w-4.5 transition-colors duration-300 ${
                  isActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"
                }`}
              />
              <span className="whitespace-nowrap">{label}</span>
            </span>

            {/* Beta badges or count labels */}
            {["Smart Listings", "Image Maker", "Label Analyser", "Keyword Research"].includes(label) ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide transition-all duration-300 ${
                  isActive
                    ? "bg-indigo-950/80 text-indigo-300 border border-indigo-900/40"
                    : "bg-zinc-900 text-zinc-500 group-hover:bg-zinc-800 group-hover:text-zinc-350"
                }`}
              >
                Beta
              </span>
            ) : null}

            {/* Glowing neon dot indicator on right */}
            {isActive && (
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1] animate-pulse" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
