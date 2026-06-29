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
    <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto lg:grid lg:overflow-visible pr-2">
      {links.map(([label, href]) => {
        const Icon = adminIcons[label as keyof typeof adminIcons] || Gauge;
        const isActive = pathname === href;

        return (
          <Link
            key={href}
            href={href}
            className={`group relative flex shrink-0 items-center justify-between gap-3 rounded-2xl px-4 py-3 text-xs font-bold transition-all duration-200 ${
              isActive
                ? "bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 shadow-lg shadow-indigo-950/20"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 border border-transparent"
            }`}
          >
            <span className="flex items-center gap-3">
              <Icon
                className={`h-4.5 w-4.5 transition-colors duration-200 ${
                  isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-350"
                }`}
              />
              <span className="whitespace-nowrap">{label}</span>
            </span>

            {/* Active micro-indicator */}
            {isActive && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-400" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
