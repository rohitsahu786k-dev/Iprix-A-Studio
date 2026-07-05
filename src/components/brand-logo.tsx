import Image from "next/image";
import Link from "next/link";
import { brand } from "@/lib/brand";

export function BrandLogo({
  href = "/",
  size = "md",
  priority = false,
  dark = false,
}: {
  href?: string;
  size?: "sm" | "md" | "lg";
  priority?: boolean;
  dark?: boolean;
}) {
  const sizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const body = (
    <span className="flex items-center gap-2.5 select-none">
      <span
        className={`inline-flex shrink-0 items-center justify-center ${sizes[size]}`}
        aria-label={`${brand.company} ${brand.appName}`}
      >
        <Image
          src="/aplus-logo.png"
          alt={`${brand.appName} logo`}
          width={96}
          height={96}
          className="h-full w-full object-contain drop-shadow-sm"
          priority={priority}
          unoptimized
        />
      </span>
      <span className="flex flex-col text-left">
        <span className={`text-sm font-extrabold tracking-tight leading-none ${dark ? "text-white" : "text-zinc-100"}`}>
          A+ <span className="text-indigo-500">Studio</span>
        </span>
        <span className={`text-[9px] font-semibold mt-0.5 leading-none ${dark ? "text-slate-400" : "text-zinc-550"}`}>
          by Iprix Media
        </span>
      </span>
    </span>
  );

  return href ? <Link href={href} className="no-underline">{body}</Link> : body;
}

export function WideLogo({ dark = false }: { dark?: boolean }) {
  return <BrandLogo href="/" size="lg" priority dark={dark} />;
}
