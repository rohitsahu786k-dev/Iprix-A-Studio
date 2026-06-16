import Link from "next/link";
import {
  Bell,
  BookOpen,
  Bot,
  Boxes,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Home,
  Image as ImageIcon,
  Layers3,
  LogOut,
  MonitorUp,
  Package,
  Search,
  Settings,
  HelpCircle,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { dashboardNav } from "@/lib/brand";
import { requireUser } from "@/lib/auth";
import { BrandLogo } from "@/components/brand-logo";

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

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <main className="min-h-screen bg-neutral-50/50 text-neutral-900">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        
        {/* Sidebar */}
        <aside className="flex border-b border-neutral-200 bg-white p-4 shadow-sm lg:min-h-screen lg:flex-col lg:border-b-0 lg:border-r lg:p-5">
          <div className="mb-0 mr-4 flex shrink-0 justify-start pl-0 lg:mb-8 lg:mr-0 lg:pl-2">
            <BrandLogo href="/dashboard" size="md" priority />
          </div>
          
          <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto lg:grid lg:overflow-visible">
            {dashboardNav.map(([label, href]) => {
              const Icon = navIcons[label as keyof typeof navIcons] || Boxes;
              return (
                <Link
                  key={href}
                  href={href}
                  className="group flex shrink-0 items-center justify-between gap-3 rounded-xl px-3 py-3 text-xs font-bold text-neutral-500 transition-all hover:bg-neutral-50 hover:text-neutral-950"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4.5 w-4.5 text-neutral-400 group-hover:text-neutral-950 transition-colors" />
                    <span className="whitespace-nowrap">{label}</span>
                  </span>
                  {["Smart Listings", "Image Maker", "Label Analyser", "Keyword Research"].includes(label) ? (
                    <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[8px] font-extrabold uppercase text-neutral-550 group-hover:bg-white transition-all">
                      Beta
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
          
          <div className="mt-auto hidden border-t border-neutral-200 pt-6 lg:block">
            {/* User Profile Info Card */}
            <div className="flex items-center gap-3 rounded-2xl border border-neutral-150 bg-neutral-50/50 p-3.5 mb-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-900 text-xs font-extrabold text-white">
                {user.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-bold text-neutral-900">{user.name}</span>
                <span className="block truncate text-[10px] font-semibold text-neutral-450">{user.email}</span>
              </span>
            </div>
            
            <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 mb-4">
              <span>Plan Type</span>
              <span className="text-neutral-900">{user.plan}</span>
            </div>
            
            <form action="/api/auth/logout" method="post">
              <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-250 bg-white px-4 py-3 text-xs font-bold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 active:scale-[0.98] transition-all cursor-pointer">
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        </aside>

        {/* Workspace Main Area */}
        <section className="min-w-0 flex flex-col bg-neutral-50/30">
          <header className="sticky top-0 z-20 flex min-h-[74px] items-center justify-between gap-3 border-b border-neutral-200 bg-white/85 px-4 shadow-sm backdrop-blur sm:px-6">
            {/* Search Bar */}
            <div className="hidden min-w-[280px] items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-xs text-neutral-450 font-semibold md:flex focus-within:border-neutral-400 transition-colors">
              <Search className="h-4 w-4 text-neutral-400" />
              <span>Search products, templates, listings...</span>
            </div>
            
            {/* Action Indicators */}
            <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
              <Link href="/dashboard/tutorial" className="hidden items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-all sm:inline-flex">
                <MonitorUp className="h-4 w-4 text-neutral-500" />
                Extension Connected
              </Link>
              
              <span className="inline-flex min-w-0 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-[10px] font-extrabold uppercase text-neutral-800 sm:px-4 sm:text-xs">
                <Zap className="h-4 w-4 text-neutral-900" />
                <span className="truncate">{user.plan} Active</span>
              </span>
              
              <Link href="/dashboard/notifications" className="grid h-10 w-10 place-items-center rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 transition-all" aria-label="Notifications">
                <Bell className="h-4 w-4 text-neutral-800" />
              </Link>
            </div>
          </header>
          
          <div className="mx-auto w-full max-w-7xl flex-grow p-4 sm:p-6 lg:p-8">{children}</div>
        </section>
      </div>
    </main>
  );
}
