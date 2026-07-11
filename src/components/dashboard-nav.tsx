"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  Bot,
  Boxes,
  Calculator,
  Camera,
  Compass,
  CreditCard,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Home,
  Image as ImageIcon,
  Layers3,
  Package,
  Search,
  Settings,
  Sparkles,
  Tag,
  Truck,
  Type,
  Users,
} from "lucide-react";

const navIcons = {
  Overview: Home,
  Listings: Boxes,
  Templates: Layers3,
  Products: Package,
  "Smart Listings": Sparkles,
  "Image Maker": ImageIcon,
  "Low Shipping Images": ImageIcon,
  "Label Analyser": FileText,
  "Keyword Research": Search,
  "Keyword Explorer": Compass,
  "Shipping Calculator": Truck,
  "Profit Calculator": Calculator,
  "Price Calculator": Calculator,
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

const sections = [
  { label: "Workspace", items: ["Overview", "Listings", "Templates", "Products", "Smart Listings"] },
  { label: "AI studio", items: ["AI Content Studio", "Keyword Research", "Image Maker", "Low Shipping Images", "Label Analyser", "Bulk CSV Upload"] },
  { label: "Free seller tools", items: ["Keyword Explorer", "Shipping Calculator", "Profit Calculator", "Price Calculator", "Image Checker", "SKU Generator", "Title Checker"] },
  { label: "Account", items: ["Subscription", "Tutorial", "Notifications", "Support", "Settings", "Team"] },
] as const;

const betaLabels = new Set(["Smart Listings", "Image Maker", "Label Analyser", "Keyword Research"]);
const freeLabels = new Set(["Keyword Explorer", "Shipping Calculator", "Profit Calculator", "Price Calculator", "Image Checker", "SKU Generator", "Title Checker"]);

interface DashboardNavProps {
  links: [string, string][];
  onNavigate?: () => void;
}

export function DashboardNav({ links, onNavigate }: DashboardNavProps) {
  const pathname = usePathname();
  const linkMap = new Map(links);

  return (
    <nav aria-label="Dashboard navigation" className="space-y-5">
      {sections.map((section) => (
        <div key={section.label}>
          <p className="mb-2 px-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">{section.label}</p>
          <div className="space-y-1">
            {section.items.map((label) => {
              const href = linkMap.get(label);
              if (!href) return null;
              const Icon = navIcons[label as keyof typeof navIcons] || Boxes;
              const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`)) || (href !== "/dashboard" && pathname === href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[11px] font-extrabold transition-all ${
                    isActive
                      ? "bg-slate-950 text-white shadow-lg shadow-slate-200"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                >
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg transition ${isActive ? "bg-white/12 text-indigo-300" : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-indigo-600"}`}>
                    <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                  {betaLabels.has(label) ? (
                    <span className={`rounded-full px-2 py-0.5 text-[7px] font-black uppercase tracking-wider ${isActive ? "bg-indigo-400/20 text-indigo-200" : "bg-violet-50 text-violet-600"}`}>Beta</span>
                  ) : null}
                  {freeLabels.has(label) ? (
                    <span className={`rounded-full px-2 py-0.5 text-[7px] font-black uppercase tracking-wider ${isActive ? "bg-emerald-400/20 text-emerald-200" : "bg-emerald-50 text-emerald-700"}`}>Free</span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
