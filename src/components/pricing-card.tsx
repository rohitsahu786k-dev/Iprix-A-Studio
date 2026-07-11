"use client";

import Link from "next/link";
import { ArrowRight, Check, Clock3, ShieldCheck } from "lucide-react";
import { type PricingPlan } from "@/lib/plans";

const badges: Record<string, string> = {
  seller: "Recurring",
  growth: "Best value",
  pro: "Most popular",
  agency: "Best value",
};

export function PricingCard({ 
  plan, 
  dark = false, 
  current = false,
  billing: propBilling,
  onSubscribe
}: { 
  plan: PricingPlan; 
  dark?: boolean; 
  current?: boolean;
  billing?: "monthly" | "yearly";
  onSubscribe?: (planSlug: string, billing: "monthly" | "yearly") => void;
}) {
  const billing = propBilling || "monthly";

  const isFree = plan.monthlyPrice === 0;

  // Dynamically calculate discount percentage based on yearly vs monthly values
  const totalMonthlyCost = plan.monthlyPrice * 12;
  const discountPercent = plan.monthlyPrice > 0 && plan.yearlyPrice > 0
    ? Math.round(((totalMonthlyCost - plan.yearlyPrice) / totalMonthlyCost) * 100)
    : 0;

  const currentPrice = isFree
    ? 0 
    : billing === "yearly"
      ? Math.round(plan.yearlyPrice / 12)
      : plan.monthlyPrice;

  const checkoutPath = `/dashboard/subscription?plan=${plan.slug}&billing=${billing}`;
  const loginCheckoutPath = `/login?next=${encodeURIComponent(checkoutPath)}`;

  const features = [
    `${plan.templates} templates`,
    `${plan.listings} AI-powered listings`,
    `${plan.productLimit} products`,
    `Team: ${plan.team}`,
    ...plan.features,
  ];

  return (
    <article className={`relative rounded-3xl border p-6 flex flex-col justify-between h-full transition-all duration-300 group hover:-translate-y-1 ${
      dark
        ? "border-indigo-300 bg-white shadow-pin-lg text-zinc-100 hover:border-indigo-450"
        : current
          ? "border-zinc-700 bg-white shadow-pin text-zinc-100 hover:border-zinc-600"
          : "border-zinc-800 bg-white shadow-pin text-zinc-100 hover:border-zinc-700"
    }`}>
      {badges[plan.slug] || current ? (
        <span className={`absolute -top-3 left-1/2 -translate-y-0.5 -translate-x-1/2 rounded-full px-3.5 py-1 text-[9px] font-extrabold uppercase tracking-widest shadow-sm ${
          dark ? "bg-gradient-to-r from-indigo-550 to-violet-550 text-white" : "bg-zinc-800 text-zinc-100"
        }`}>
          {current ? "Current plan" : badges[plan.slug]}
        </span>
      ) : null}
      
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 mb-2">{plan.name}</p>
        <div className="flex items-end gap-1 text-zinc-100 mb-1">
          <span className="text-4xl font-extrabold tracking-tight">
            {isFree ? "Free" : `₹${currentPrice}`}
          </span>
          {!isFree ? <span className="pb-1.5 text-xs text-zinc-400">/mo</span> : null}
        </div>
        
        <p className="text-[10px] font-semibold text-zinc-400 mb-6 leading-relaxed">
          {isFree 
            ? `${plan.listings} AI-powered listings | No card required` 
            : billing === "yearly"
              ? `Billed ₹${plan.yearlyPrice} yearly | Save ${discountPercent}%`
              : "Billed monthly | Cancel anytime"}
        </p>

        <div className={`border-t mb-6 ${dark ? "border-zinc-800" : "border-zinc-800/60"}`} />
        
        <ul className="space-y-3">
          {features.map((feature) => (
            <li className="flex items-start gap-2.5 text-xs leading-relaxed text-zinc-300" key={feature}>
              <span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-zinc-800 text-zinc-300 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors duration-200`}>
                <Check className="h-3 w-3" />
              </span>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <div>
        {onSubscribe ? (
          <button
            onClick={() => onSubscribe(plan.slug, billing as "monthly" | "yearly")}
            className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-xs font-bold transition-all duration-200 active:scale-[0.98] cursor-pointer ${
              dark 
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-550/20" 
                : current 
                  ? "border border-zinc-800 text-zinc-300 hover:bg-zinc-800" 
                  : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
            }`}
          >
            {current ? "Current Plan" : "Upgrade Plan"}
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <Link
            className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-xs font-bold transition-all duration-200 active:scale-[0.98] ${
              dark 
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-550/20" 
                : current 
                  ? "border border-zinc-800 text-zinc-300 hover:bg-zinc-800" 
                  : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
            }`}
            href={current || isFree ? "/dashboard" : loginCheckoutPath}
          >
            {current || isFree ? "Start free" : "Upgrade Plan"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        <div className="mt-4 flex items-center gap-2 text-[10px] font-semibold text-zinc-500">
          {plan.slug === "free" ? <Clock3 className="h-4 w-4 text-zinc-500" /> : <ShieldCheck className="h-4 w-4 text-zinc-500" />}
          {plan.yearlyDiscount}
        </div>
      </div>
    </article>
  );
}
