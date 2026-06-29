import Link from "next/link";
import {
  Bell,
  LogOut,
  MonitorUp,
  Search,
  Zap,
} from "lucide-react";
import { dashboardNav } from "@/lib/brand";
import { requireUser } from "@/lib/auth";
import { BrandLogo } from "@/components/brand-logo";
import { DashboardNav } from "@/components/dashboard-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        
        {/* Sidebar */}
        <aside className="flex border-b border-zinc-900 bg-zinc-900/40 backdrop-blur-xl p-4 shadow-sm lg:min-h-screen lg:flex-col lg:border-b-0 lg:border-r lg:border-zinc-900 lg:p-6 lg:pb-8">
          <div className="mb-0 mr-4 flex shrink-0 justify-start pl-0 lg:mb-8 lg:mr-0 lg:pl-1">
            <BrandLogo href="/dashboard" size="md" priority />
          </div>
          
          <div className="flex-1 overflow-y-auto -mx-2 px-2 scrollbar-thin">
            <DashboardNav links={dashboardNav as [string, string][]} />
          </div>
          
          <div className="mt-auto hidden border-t border-zinc-900 pt-6 lg:block">
            {/* User Profile Info Card */}
            <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-850 bg-zinc-900/80 p-4 mb-4 shadow-sm">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-indigo-650 to-violet-550 text-xs font-extrabold text-white shadow-inner">
                {user.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-extrabold text-zinc-200">{user.name}</span>
                <span className="block truncate text-[10px] font-semibold text-zinc-500 mt-0.5">{user.email}</span>
              </span>
            </div>
            
            <div className="flex items-center justify-between rounded-2xl border border-indigo-950 bg-indigo-950/30 px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-indigo-400 mb-4">
              <span>Account Plan</span>
              <span className="rounded-full bg-indigo-900/50 px-2.5 py-1 text-[9px] font-extrabold text-indigo-300 tracking-normal normal-case shadow-sm">
                {user.plan}
              </span>
            </div>
            
            <form action="/api/auth/logout" method="post">
              <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-xs font-bold text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-sm">
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        </aside>

        {/* Workspace Main Area */}
        <section className="min-w-0 flex flex-col bg-zinc-950">
          <header className="sticky top-0 z-20 flex min-h-[74px] items-center justify-between gap-3 border-b border-zinc-900 bg-zinc-950/80 px-4 shadow-sm backdrop-blur-md sm:px-6">
            {/* Search Bar */}
            <div className="hidden min-w-[320px] items-center gap-2.5 rounded-2xl border border-zinc-850 bg-zinc-900/40 px-4 py-2.5 text-xs text-zinc-500 font-semibold md:flex focus-within:border-indigo-500 focus-within:bg-zinc-900 focus-within:ring-2 focus-within:ring-indigo-950/50 transition-all duration-200 shadow-inner">
              <Search className="h-4 w-4 text-zinc-500" />
              <span className="text-zinc-500">Search products, templates, compliance...</span>
            </div>
            
            {/* Action Indicators */}
            <div className="ml-auto flex min-w-0 items-center gap-2.5 sm:gap-3">
              <Link href="/dashboard/tutorial" className="hidden items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4.5 py-2.5 text-xs font-bold text-zinc-350 hover:bg-zinc-800 hover:text-zinc-100 transition-all duration-200 sm:inline-flex shadow-sm">
                <MonitorUp className="h-4 w-4 text-zinc-400" />
                Extension Connected
              </Link>
              
              <span className="inline-flex min-w-0 items-center gap-2 rounded-2xl border border-indigo-950 bg-indigo-950/40 px-4 py-2.5 text-[10px] font-extrabold uppercase text-indigo-400 sm:text-xs">
                <Zap className="h-4 w-4 text-indigo-500 fill-indigo-950 animate-pulse" />
                <span className="truncate">{user.plan} Active</span>
              </span>
              
              <Link href="/dashboard/notifications" className="grid h-10 w-10 place-items-center rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:text-zinc-100 transition-all duration-200 shadow-sm" aria-label="Notifications">
                <Bell className="h-4 w-4 text-zinc-450" />
              </Link>
            </div>
          </header>
          
          <div className="mx-auto w-full max-w-7xl flex-grow p-4 sm:p-6 lg:p-8">{children}</div>
        </section>
      </div>
    </main>
  );
}
