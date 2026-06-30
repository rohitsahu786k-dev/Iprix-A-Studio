import Link from "next/link";
import {
  Shield,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { requireUser } from "@/lib/auth";
import { adminNav } from "@/lib/brand";
import { AdminNav } from "@/components/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("admin");
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        
        {/* Sidebar / Top Nav (Sticky on both mobile and desktop) */}
        <aside className="sticky top-0 z-30 flex w-full items-center justify-between border-b border-zinc-900 bg-zinc-950/90 backdrop-blur-xl p-4 shadow-2xl lg:sticky lg:top-0 lg:h-screen lg:w-[280px] lg:max-w-[280px] lg:flex-col lg:border-b-0 lg:border-r lg:border-zinc-900 lg:p-6 lg:pb-8">
          <div className="mb-0 mr-4 flex shrink-0 justify-start pl-0 lg:mb-8 lg:mr-0 lg:pl-1">
            <BrandLogo href="/admin" size="md" priority />
          </div>
          
          <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden -mx-2 px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:w-full">
            <AdminNav links={adminNav as [string, string][]} />
          </div>
          
          <div className="mt-auto hidden border-t border-zinc-900 pt-6 lg:block w-full">
            {/* User Profile Info Card */}
            <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-850 bg-zinc-900/40 p-4 mb-4 shadow-md text-white hover:border-zinc-800 transition-colors duration-200">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 text-xs font-extrabold text-white shadow-inner">
                {user.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-extrabold text-white">{user.name}</span>
                <span className="block truncate text-[10px] font-semibold text-zinc-400 mt-0.5">{user.email}</span>
              </span>
            </div>
            
            <div className="flex items-center justify-between rounded-2xl border border-rose-500/10 bg-rose-500/5 px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-rose-400">
              <span>Security Level</span>
              <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 text-[9px] font-extrabold text-rose-300 tracking-normal normal-case shadow-sm">
                Super Admin
              </span>
            </div>
          </div>
        </aside>

        {/* Workspace Main Area */}
        <section className="min-w-0 flex flex-col bg-zinc-950">
          <header className="static lg:sticky lg:top-0 lg:z-20 flex min-h-[74px] items-center justify-between gap-3 border-b border-zinc-900 bg-zinc-950/80 px-4 shadow-sm backdrop-blur-md sm:px-6">
            <span className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/10 bg-rose-500/5 px-4 py-2.5 text-xs font-bold text-rose-400 shadow-sm">
              <Shield className="h-4 w-4 text-rose-500" />
              Secure Admin Console
            </span>
            <Link href="/dashboard" className="rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 px-4.5 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-200 active:scale-[0.98] cursor-pointer">
              User Dashboard
            </Link>
          </header>
          <div className="mx-auto w-full max-w-7xl flex-grow p-4 sm:p-6 lg:p-8">{children}</div>
        </section>
      </div>
    </main>
  );
}
