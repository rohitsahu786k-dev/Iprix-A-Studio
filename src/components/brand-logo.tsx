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
    sm: "h-9 w-[132px]",
    md: "h-11 w-[164px]",
    lg: "h-14 w-[210px]",
  };

  const body = (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-transparent ${sizes[size]}`}
      aria-label={`${brand.company} ${brand.appName}`}
    >
      <Image
        src={brand.logo}
        alt={`${brand.company} logo`}
        width={220}
        height={64}
        className="h-full w-full object-contain"
        priority={priority}
      />
    </span>
  );

  return href ? <Link href={href}>{body}</Link> : body;
}

export function WideLogo() {
  return <BrandLogo href="/" size="lg" priority />;
}
