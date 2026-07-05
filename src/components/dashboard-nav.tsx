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
  Truck,
  Calculator,
  Camera,
  Compass,
  Tag,
  Type,
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
  "Keyword Explorer": Compass,
  "Shipping Calculator": Truck,
  "Profit Calculator": Calculator,
  "Image Checker": Camera,
  "SKU Generator": Tag,
  "Title Checker": Type,
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
            className={`group relative flex shrink-0 items-center justify-between gap-3 rounded-full px-4 py-3 text-[11px] font-extrabold tracking-wide transition-all duration-200 ease-out ${
              isActive
                ? "bg-[#211922] text-white shadow-pin"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
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

            {/* Beta badges or count labels */}
            {["Smart Listings", "Image Maker", "Label Analyser", "Keyword Research"].includes(label) ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest transition-all duration-200 ${
                  isActive
                    ? "bg-white/15 text-white"
                    : "bg-indigo-50 text-indigo-500 group-hover:bg-indigo-100"
                }`}
              >
                Beta
              </span>
            ) : null}

            {["Keyword Explorer", "Shipping Calculator", "Profit Calculator", "Image Checker", "SKU Generator", "Title Checker"].includes(label) ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest transition-all duration-200 ${
                  isActive ? "bg-white/15 text-white" : "bg-emerald-50 text-emerald-600"
                }`}
              >
                Free
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
