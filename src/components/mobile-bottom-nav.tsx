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
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800 bg-zinc-950/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:hidden">
      <nav className="flex items-stretch justify-around">
        {items.map(({ href, label, Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`group relative flex flex-1 flex-col items-center gap-1 pb-2 pt-2.5 transition-colors duration-200 ${
                isActive ? "text-indigo-600" : "text-zinc-500 active:text-zinc-300"
              }`}
            >
              {isActive ? (
                <span className="absolute top-0 h-[3px] w-9 rounded-b-full bg-linear-to-r from-indigo-500 to-violet-500" />
              ) : null}
              <Icon className={`h-5 w-5 transition-transform duration-200 ${isActive ? "" : "group-active:scale-95"}`} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] leading-none tracking-wide ${isActive ? "font-extrabold" : "font-semibold"}`}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
