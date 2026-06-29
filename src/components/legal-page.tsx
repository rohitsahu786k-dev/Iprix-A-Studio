import { PublicShell } from "@/components/public-shell";
import { brand } from "@/lib/brand";

export function LegalPage({ title, items }: { title: string; items?: string[] }) {
  const body =
    items && items.length
      ? items
      : [
          `A+ Studio by ${brand.company} must be used legally and in line with marketplace seller policies.`,
          "We store account, product, template, listing, extension, AI usage, payment and support data only to operate the service.",
          `Refunds, cancellations and support requests are handled through ${brand.supportEmail}.`,
        ];

  return (
    <PublicShell>
      <section className="container py-20 relative overflow-hidden bg-zinc-950">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-950/10 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse" />
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-2">
            {title}
          </h1>
          <div className="w-12 h-1 bg-indigo-500 rounded-full mb-10" />
          
          <ul className="grid gap-4 text-sm leading-relaxed text-zinc-350">
            {body.map((item) => (
              <li className="rounded-2xl border border-zinc-850 bg-zinc-900/30 p-6 shadow-sm hover:border-zinc-800 hover:bg-zinc-900/40 transition-all duration-200" key={item}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </PublicShell>
  );
}
