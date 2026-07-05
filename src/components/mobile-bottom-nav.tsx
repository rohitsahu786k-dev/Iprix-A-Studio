"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, IndianRupee, Puzzle, User, Zap } from "lucide-react";

const items = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/features", label: "Features", Icon: Zap },
  { href: "/chrome-extension", label: "Extension", Icon: Puzzle },
  { href: "/pricing", label: "Pricing", Icon: IndianRupee },
  { href: "/login", label: "Account", Icon: User },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-[22px] border border-zinc-900 bg-zinc-950/85 p-1.5 shadow-2xl shadow-black/40 backdrop-blur-xl lg:hidden">
      <nav className="flex items-center justify-around">
        {items.map(({ href, label, Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`group relative flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2.5 transition-all duration-200 ${
                isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {isActive ? (
                <span className="absolute inset-0 rounded-2xl bg-linear-to-b from-indigo-500/15 to-violet-500/5 border border-indigo-500/20" />
              ) : null}
              <Icon className={`relative h-4.5 w-4.5 transition-transform duration-200 ${isActive ? "scale-105 text-indigo-400" : "group-hover:scale-105"}`} strokeWidth={2.25} />
              <span className="relative text-[9.5px] font-bold uppercase tracking-wide leading-none">{label}</span>
              {isActive ? <span className="absolute -top-0.5 h-1 w-1 rounded-full bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,0.9)]" /> : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
