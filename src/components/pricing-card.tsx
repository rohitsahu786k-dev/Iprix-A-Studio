"use client";

import { useState } from "react";
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
  const [internalBilling, setInternalBilling] = useState<"monthly" | "yearly">("monthly");
  const billing = propBilling || internalBilling;
  const setBilling = (b: "monthly" | "yearly") => {
    if (!propBilling) {
      setInternalBilling(b);
    }
  };

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

  const text = dark ? "text-white" : "text-neutral-900";
  const muted = dark ? "text-neutral-300" : "text-neutral-500";
  const featureText = dark ? "text-neutral-100" : "text-neutral-800";
  
  const features = [
    `${plan.templates} templates`,
    `${plan.listings} AI-powered listings`,
    `${plan.productLimit} products`,
    `Team: ${plan.team}`,
    ...plan.features,
  ];

  return (
    <article className={`relative rounded-2xl border p-6 flex flex-col justify-between h-full transition-all duration-200 group ${
      dark 
        ? "border-neutral-200 bg-neutral-950 shadow-md text-white" 
        : current 
          ? "border-2 border-neutral-200 bg-white shadow-sm" 
          : "border-neutral-200 bg-white shadow-sm hover:border-neutral-300"
    }`}>
      {badges[plan.slug] || current ? (
        <span className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
          dark ? "bg-white text-neutral-950" : "bg-neutral-950 text-white"
        }`}>
          {current ? "Current plan" : badges[plan.slug]}
        </span>
      ) : null}
      
      <div>
        <p className={`text-xs font-bold uppercase tracking-wider ${muted} mb-2`}>{plan.name}</p>
        <div className={`flex items-end gap-1 ${text} mb-1`}>
          <span className="text-4xl font-extrabold">
            {isFree ? "Free" : `₹${currentPrice}`}
          </span>
          {!isFree ? <span className={`pb-1.5 text-xs ${muted}`}>/mo</span> : null}
        </div>
        
        <p className={`text-[10px] font-semibold ${muted} mb-6`}>
          {isFree 
            ? "5 AI-powered listings | No card required" 
            : billing === "yearly"
              ? `Billed ₹${plan.yearlyPrice} yearly | Save ${discountPercent}%`
              : "Billed monthly | Cancel anytime"}
        </p>

        <div className={`border-t mb-6 ${dark ? "border-neutral-200" : "border-neutral-100"}`} />
        
        <ul className="space-y-3">
          {features.map((feature) => (
            <li className={`flex items-start gap-2.5 text-xs leading-relaxed ${featureText}`} key={feature}>
              <span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full ${
                dark ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-900"
              }`}>
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
            className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all cursor-pointer ${
              dark 
                ? "bg-white text-neutral-950 hover:bg-neutral-100" 
                : current 
                  ? "border-2 border-neutral-200 text-neutral-900 hover:bg-neutral-50" 
                  : "bg-neutral-950 text-white hover:bg-neutral-850"
            }`}
          >
            {current ? "Current Plan" : "Upgrade Plan"}
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <Link
            className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all ${
              dark 
                ? "bg-white text-neutral-950 hover:bg-neutral-100" 
                : current 
                  ? "border-2 border-neutral-200 text-neutral-900 hover:bg-neutral-50" 
                  : "bg-neutral-950 text-white hover:bg-neutral-850"
            }`}
            href={current || isFree ? "/dashboard" : loginCheckoutPath}
          >
            {current || isFree ? "Start free" : "Upgrade Plan"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        
        <div className={`mt-4 flex items-center gap-2 text-[10px] font-semibold ${muted}`}>
          {plan.slug === "free" ? <Clock3 className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
          {plan.yearlyDiscount}
        </div>
      </div>
    </article>
  );
}
