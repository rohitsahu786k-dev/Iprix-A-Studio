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
      <section className="container py-14">
        <h1 className="text-5xl font-medium">{title}</h1>
        <ul className="mt-8 grid gap-4 text-base leading-7 text-[#525252]">
          {body.map((item) => (
            <li className="rounded-lg border border-[#e5e5e5] bg-white p-5" key={item}>
              {item}
            </li>
          ))}
        </ul>
      </section>
    </PublicShell>
  );
}
