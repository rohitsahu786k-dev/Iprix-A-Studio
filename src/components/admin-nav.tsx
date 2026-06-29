"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Gauge,
  Users,
  Package,
  Layers3,
  ListChecks,
  CreditCard,
  Receipt,
  FileText,
  Activity,
  Settings,
  Shield,
  Bell,
  Mail,
} from "lucide-react";

const adminIcons = {
  Overview: Gauge,
  Users,
  Products: Package,
  Templates: Layers3,
  Listings: ListChecks,
  Subscriptions: CreditCard,
  Payments: Receipt,
  "Contact Inquiries": FileText,
  "AI Usage": Activity,
  "AI Listings": ListChecks,
  "Keyword Reports": Activity,
  "Extension Logs": Activity,
  "Support Tickets": FileText,
  "Feature Flags": Settings,
  "Security Logs": Shield,
  Plans: CreditCard,
  Notifications: Bell,
  Settings,
  "Email Logs": Mail,
  "Audit Logs": Shield,
};

interface AdminNavProps {
  links: [string, string][];
}

export function AdminNav({ links }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto lg:grid lg:gap-1.5 lg:overflow-visible pr-2 py-2">
      {links.map(([label, href]) => {
        const Icon = adminIcons[label as keyof typeof adminIcons] || Gauge;
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
                  isActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-350"
                }`}
              />
              <span className="whitespace-nowrap">{label}</span>
            </span>

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
