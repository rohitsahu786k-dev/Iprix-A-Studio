"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  LogOut,
  Menu,
  MonitorUp,
  Search,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { DashboardNav } from "@/components/dashboard-nav";
import { dashboardNav } from "@/lib/brand";

type DashboardUser = {
  name: string;
  email: string;
  plan: string;
};

type NotificationItem = {
  _id: string;
  title?: string;
  message?: string;
  type?: string;
  read?: boolean;
  createdAt?: string;
};

type ExtensionState = "checking" | "connected" | "not-detected";

export function DashboardShell({ children, user }: { children: React.ReactNode; user: DashboardUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [extensionState, setExtensionState] = useState<ExtensionState>("checking");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const runExtensionCheck = useCallback(() => {
    setExtensionState("checking");
    window.postMessage({ source: "lisstify-dashboard", type: "EXTENSION_PING" }, window.location.origin);
    window.setTimeout(() => {
      setExtensionState((current) => (current === "checking" ? "not-detected" : current));
    }, 1200);
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Notifications could not be loaded.");
      setNotifications(Array.isArray(data.items) ? data.items : []);
      setNotificationError("");
    } catch (error) {
      setNotificationError(error instanceof Error ? error.message : "Notifications could not be loaded.");
    }
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== window || event.data?.source !== "lisstify-extension") return;
      if (event.data?.type === "EXTENSION_PONG") setExtensionState("connected");
    };
    window.addEventListener("message", onMessage);
    const timer = window.setTimeout(() => {
      runExtensionCheck();
      void loadNotifications();
    }, 0);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);
    };
  }, [loadNotifications, runExtensionCheck]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDrawerOpen(false);
      setSearchOpen(false);
      setNotificationsOpen(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    function closeFloatingPanels(event: MouseEvent) {
      const target = event.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) setSearchOpen(false);
      if (notificationRef.current && !notificationRef.current.contains(target)) setNotificationsOpen(false);
    }
    document.addEventListener("mousedown", closeFloatingPanels);
    return () => document.removeEventListener("mousedown", closeFloatingPanels);
  }, []);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return dashboardNav.slice(0, 7);
    return dashboardNav.filter(([label, href]) => `${label} ${href}`.toLowerCase().includes(needle)).slice(0, 7);
  }, [query]);

  const unreadCount = notifications.filter((item) => !item.read).length;
  const planLabel = `${user.plan.charAt(0).toUpperCase()}${user.plan.slice(1)} active`;

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const first = matches[0];
    if (!first) return;
    router.push(first[1]);
    setQuery("");
    setSearchOpen(false);
  }

  async function markNotificationRead(item: NotificationItem) {
    if (item.read) return;
    const response = await fetch(`/api/notifications?id=${encodeURIComponent(item._id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: true }),
    });
    if (response.ok) {
      setNotifications((current) => current.map((entry) => (entry._id === item._id ? { ...entry, read: true } : entry)));
    }
  }

  const sidebar = (
    <>
      <div className="flex h-[78px] items-center justify-between border-b border-slate-200/80 px-5">
        <BrandLogo href="/dashboard" size="md" priority />
        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-label="Close navigation"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin]">
        <DashboardNav links={dashboardNav as [string, string][]} onNavigate={() => setDrawerOpen(false)} />
      </div>

      <div className="space-y-3 border-t border-slate-200/80 p-4">
        <Link
          href="/dashboard/subscription"
          className="flex items-center justify-between rounded-2xl border border-indigo-100 bg-indigo-50/80 px-4 py-3 text-xs font-extrabold text-indigo-700 transition hover:border-indigo-200 hover:bg-indigo-50"
        >
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Account plan
          </span>
          <span className="rounded-full bg-white px-2.5 py-1 text-[9px] uppercase tracking-wider shadow-sm">{user.plan}</span>
        </Link>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-linear-to-br from-indigo-600 to-violet-600 text-xs font-black text-white shadow-lg shadow-indigo-200">
            {user.name.slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-extrabold text-slate-900">{user.name}</span>
            <span className="mt-0.5 block truncate text-[10px] font-semibold text-slate-500">{user.email}</span>
          </span>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );

  return (
    <main className="min-h-screen bg-[#f6f7fb] font-sans text-slate-950">
      <div className="min-h-screen lg:grid lg:grid-cols-[288px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen flex-col border-r border-slate-200/80 bg-white lg:flex">{sidebar}</aside>

        {drawerOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} aria-label="Close navigation overlay" />
            <aside className="relative flex h-full w-[min(88vw,320px)] flex-col bg-white shadow-2xl">{sidebar}</aside>
          </div>
        ) : null}

        <section className="min-w-0">
          <header className="sticky top-0 z-40 flex h-[78px] items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 shadow-[0_1px_16px_rgba(15,23,42,0.04)] backdrop-blur-xl sm:px-6">
            <button
              type="button"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>

            <div className="relative hidden w-full max-w-md md:block" ref={searchRef}>
              <form onSubmit={submitSearch}>
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-10 pr-14 text-xs font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white"
                  placeholder="Search products, tools, templates..."
                  aria-label="Search dashboard"
                />
                <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[9px] font-bold text-slate-400">Enter</kbd>
              </form>
              {searchOpen ? (
                <div className="absolute left-0 right-0 top-13 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-200/70">
                  <p className="px-3 py-2 text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Navigate to</p>
                  {matches.length ? matches.map(([label, href]) => (
                    <button
                      type="button"
                      key={href}
                      onClick={() => router.push(href)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:text-indigo-700"
                    >
                      {label}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  )) : <p className="px-3 py-4 text-xs font-semibold text-slate-500">No dashboard section found.</p>}
                </div>
              ) : null}
            </div>

            <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={runExtensionCheck}
                className={`hidden h-10 items-center gap-2 rounded-xl border px-3 text-[10px] font-extrabold transition sm:inline-flex xl:px-4 xl:text-xs ${
                  extensionState === "connected"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : extensionState === "checking"
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-700"
                }`}
                title="Check Chrome extension connection"
              >
                {extensionState === "connected" ? <CheckCircle2 className="h-4 w-4" /> : extensionState === "checking" ? <MonitorUp className="h-4 w-4 animate-pulse" /> : <CircleAlert className="h-4 w-4" />}
                <span className="hidden xl:inline">
                  {extensionState === "connected" ? "Extension connected" : extensionState === "checking" ? "Checking extension" : "Extension not detected"}
                </span>
                <span className="xl:hidden">Extension</span>
              </button>

              <Link
                href="/dashboard/subscription"
                className="inline-flex h-10 min-w-0 items-center gap-1.5 rounded-xl border border-indigo-100 bg-indigo-50 px-2.5 text-[9px] font-extrabold uppercase tracking-wide text-indigo-700 transition hover:border-indigo-200 hover:bg-indigo-100 sm:px-3 sm:text-[10px]"
              >
                <Zap className="h-3.5 w-3.5 shrink-0 fill-indigo-600 text-indigo-600" />
                <span className="max-w-22 truncate sm:max-w-none">{planLabel}</span>
              </Link>

              <div className="relative" ref={notificationRef}>
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen((current) => !current);
                    void loadNotifications();
                  }}
                  className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700"
                  aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount ? (
                    <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-rose-500 px-1 text-[8px] font-black text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  ) : null}
                </button>

                {notificationsOpen ? (
                  <div className="absolute right-0 top-13 w-[min(88vw,370px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/70">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
                      <div>
                        <p className="text-xs font-extrabold text-slate-900">Notifications</p>
                        <p className="mt-0.5 text-[9px] font-bold text-slate-400">{unreadCount} unread updates</p>
                      </div>
                      <Link className="text-[10px] font-extrabold text-indigo-600" href="/dashboard/notifications">View all</Link>
                    </div>
                    <div className="max-h-80 overflow-y-auto p-2">
                      {notificationError ? <p className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">{notificationError}</p> : null}
                      {!notificationError && !notifications.length ? (
                        <div className="px-5 py-8 text-center">
                          <Bell className="mx-auto h-6 w-6 text-slate-300" />
                          <p className="mt-3 text-xs font-bold text-slate-600">You are all caught up.</p>
                        </div>
                      ) : null}
                      {notifications.slice(0, 6).map((item) => (
                        <button
                          type="button"
                          key={item._id}
                          onClick={() => void markNotificationRead(item)}
                          className={`mb-1 w-full rounded-xl p-3 text-left transition hover:bg-slate-50 ${item.read ? "opacity-65" : "bg-indigo-50/55"}`}
                        >
                          <span className="flex items-start gap-3">
                            <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.read ? "bg-slate-300" : "bg-indigo-600"}`} />
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-extrabold text-slate-800">{item.title || "A+ Studio update"}</span>
                              <span className="mt-1 block line-clamp-2 text-[10px] font-semibold leading-4 text-slate-500">{item.message || "Open your notification centre for details."}</span>
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <div className="mx-auto w-full max-w-[1500px] p-4 pb-10 sm:p-6 lg:p-8">{children}</div>
        </section>
      </div>
    </main>
  );
}
