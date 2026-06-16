import Link from "next/link";
import {
  Activity,
  Bell,
  CreditCard,
  FileText,
  Gauge,
  Layers3,
  ListChecks,
  Package,
  Receipt,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { requireUser } from "@/lib/auth";
import { adminNav } from "@/lib/brand";

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
  "Audit Logs": Shield,
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("admin");
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="flex border-b border-neutral-200 bg-white p-4 shadow-sm lg:min-h-screen lg:flex-col lg:border-b-0 lg:border-r">
          <div className="mb-0 mr-4 rounded-lg border border-neutral-100 bg-white p-2 shadow-sm lg:mb-6 lg:mr-0 lg:p-3">
            <BrandLogo href="/admin" size="md" priority />
          </div>
          <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto lg:grid lg:overflow-visible">
            {adminNav.map(([label, href]) => {
              const Icon = adminIcons[label as keyof typeof adminIcons] || Gauge;
              return (
                <Link key={href} href={href} className="flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-bold text-neutral-600 transition-all hover:bg-neutral-50 hover:text-neutral-950 lg:text-sm">
                  <Icon className="h-4 w-4 text-neutral-400" />
                  <span className="whitespace-nowrap">{label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto hidden rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-600 lg:block">
            <p className="font-bold text-neutral-900">Admin</p>
            <p className="mt-1 truncate text-xs font-semibold">{user.email}</p>
          </div>
        </aside>
        <section className="min-w-0">
          <header className="sticky top-0 z-20 flex min-h-[74px] items-center justify-between gap-3 border-b border-neutral-200 bg-white/90 px-4 shadow-sm backdrop-blur sm:px-5">
            <span className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-bold text-neutral-700 sm:text-sm">
              <Shield className="h-4 w-4" />
              Admin access
            </span>
            <Link href="/dashboard" className="rounded-lg bg-neutral-950 px-3 py-2 text-xs font-bold text-white sm:text-sm">
              User dashboard
            </Link>
          </header>
          <div className="p-4 sm:p-5 lg:p-8">{children}</div>
        </section>
      </div>
    </main>
  );
}
