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
    <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto lg:flex lg:flex-col lg:gap-1.5 lg:overflow-x-hidden pr-2 py-2">
      {links.map(([label, href]) => {
        const Icon = adminIcons[label as keyof typeof adminIcons] || Gauge;
        // Keep active if exact match or if sub-route (except admin root itself)
        const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));

        return (
          <Link
            key={href}
            href={href}
            className={`group relative flex shrink-0 items-center justify-between gap-3 rounded-2xl px-4 py-3 text-[11px] font-extrabold tracking-wider uppercase transition-all duration-200 ease-out border ${
              isActive
                ? "bg-gradient-to-r from-rose-500/10 via-amber-500/5 to-transparent border-rose-500/20 text-white shadow-[0_4px_20px_-4px_rgba(244,63,94,0.12)]"
                : "text-zinc-400 border-transparent hover:bg-zinc-900/40 hover:text-zinc-100 hover:translate-x-0.5"
            }`}
          >
            <span className="flex items-center gap-3">
              <Icon
                className={`h-4 w-4 transition-colors duration-200 ${
                  isActive ? "text-rose-400" : "text-zinc-500 group-hover:text-zinc-300"
                }`}
              />
              <span className="whitespace-nowrap">{label}</span>
            </span>

            {/* Glowing left line for active security route */}
            {isActive && (
              <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-gradient-to-b from-rose-500 to-amber-500" />
            )}

            {/* Glowing neon dot indicator on right */}
            {isActive && (
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
