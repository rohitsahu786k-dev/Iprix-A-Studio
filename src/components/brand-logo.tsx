import Image from "next/image";
import Link from "next/link";
import { brand } from "@/lib/brand";

export function BrandLogo({
  href = "/",
  size = "md",
  priority = false,
}: {
  href?: string;
  size?: "sm" | "md" | "lg";
  priority?: boolean;
}) {
  const sizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const body = (
    <span className="flex items-center gap-2.5 select-none">
      <span
        className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-neutral-900 border border-neutral-800 shadow-md ${sizes[size]}`}
        aria-label={`${brand.company} ${brand.appName}`}
      >
        <Image
          src="/aplus-logo.png"
          alt={`${brand.company} logo`}
          width={80}
          height={80}
          className="h-full w-full object-cover"
          priority={priority}
        />
      </span>
      <span className="flex flex-col text-left">
        <span className="text-sm font-extrabold tracking-tight text-neutral-900 leading-none">A+ Studio</span>
        <span className="text-[9px] font-medium text-neutral-400 mt-0.5 leading-none">Iprix Media</span>
      </span>
    </span>
  );

  return href ? <Link href={href} className="no-underline">{body}</Link> : body;
}

export function WideLogo() {
  return <BrandLogo href="/" size="lg" priority />;}
