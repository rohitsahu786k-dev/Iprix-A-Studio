import type { Metadata } from "next";
import { Check, Sparkles } from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { pricingPlans } from "@/lib/plans";
import { PricingCard } from "@/components/pricing-card";

export const metadata: Metadata = { title: "Pricing | A+ Studio" };

export default function PricingPage() {
  const topPlans = pricingPlans.filter((plan) => plan.slug !== "agency");
  const agency = pricingPlans.find((plan) => plan.slug === "agency");

  return (
    <PublicShell>
      <section className="border-b border-neutral-200 bg-neutral-50 py-3.5">
        <div className="container flex items-center justify-center gap-2 text-sm font-semibold text-neutral-850">
          <Sparkles className="h-4 w-4 text-neutral-900" />
          Start free with 5 AI-powered listings. Upgrade when your free listings are used.
        </div>
      </section>

      <section className="container py-20 bg-white">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <p className="inline-flex items-center gap-2 rounded-full border border-neutral-250 bg-neutral-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-neutral-800">
            Simple Pricing
          </p>
          <h1 className="mt-6 text-5xl font-extrabold leading-tight md:text-6xl text-neutral-900">
            Plans for every <span className="underline decoration-neutral-950 underline-offset-4">Indian seller.</span>
          </h1>
          <p className="mt-4 text-base leading-7 text-neutral-500">
            Generate real AI listings, capture templates with the Chrome extension, and move to monthly quotas when you are ready.
          </p>
        </div>

        <div className="mx-auto grid gap-6 lg:grid-cols-4 max-w-6xl mb-8">
          {topPlans.map((plan) => (
            <PricingCard key={plan.slug} plan={plan} dark={plan.slug === "pro"} current={plan.slug === "free"} />
          ))}
        </div>

        {agency ? (
          <div className="mx-auto max-w-[310px]">
            <PricingCard plan={agency} />
          </div>
        ) : null}

        <div className="mx-auto mt-16 flex max-w-3xl flex-wrap items-center justify-center gap-6 border-t border-neutral-200 pt-10 text-sm font-medium text-neutral-600">
          {["No credit card for Free", "14-day money-back guarantee", "Cancel anytime", "Secure checkout"].map((item) => (
            <span className="inline-flex items-center gap-2" key={item}>
              <Check className="h-4 w-4 text-neutral-900" />
              {item}
            </span>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
