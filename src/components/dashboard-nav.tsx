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
    <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto lg:flex lg:flex-col lg:gap-1.5 lg:overflow-x-hidden pr-2 py-2">
      {links.map(([label, href]) => {
        const Icon = navIcons[label as keyof typeof navIcons] || Boxes;
        // Keep active if exact match or if sub-route (except dashboard home itself)
        const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

        return (
          <Link
            key={href}
            href={href}
            className={`group relative flex shrink-0 items-center justify-between gap-3 rounded-2xl px-4 py-3 text-[11px] font-extrabold tracking-wider uppercase transition-all duration-200 ease-out border ${
              isActive
                ? "bg-gradient-to-r from-indigo-500/10 via-violet-500/5 to-transparent border-indigo-500/20 text-white shadow-[0_4px_20px_-4px_rgba(99,102,241,0.12)]"
                : "text-zinc-400 border-transparent hover:bg-zinc-900/40 hover:text-zinc-100 hover:translate-x-0.5"
            }`}
          >
            <span className="flex items-center gap-3">
              <Icon
                className={`h-4 w-4 transition-colors duration-200 ${
                  isActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"
                }`}
              />
              <span className="whitespace-nowrap">{label}</span>
            </span>

            {/* Reusable left gradient glowing line for active link */}
            {isActive && (
              <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-gradient-to-b from-indigo-500 to-violet-500" />
            )}

            {/* Beta badges or count labels */}
            {["Smart Listings", "Image Maker", "Label Analyser", "Keyword Research"].includes(label) ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-950/80 text-indigo-350 border border-indigo-900/50"
                    : "bg-zinc-900 text-zinc-500 group-hover:bg-zinc-800 group-hover:text-zinc-400"
                }`}
              >
                Beta
              </span>
            ) : null}

            {/* Glowing neon dot indicator on right */}
            {isActive && (
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-pulse" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
