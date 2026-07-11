"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function NewsletterForm() {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") || "");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Newsletter subscriber",
          email,
          businessType: "Product updates",
          message: "Please add me to A+ Studio product and seller workflow updates.",
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Subscription failed.");
      form.reset();
      setStatus("You are subscribed.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Subscription failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form onSubmit={submit} className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 shadow-sm transition-colors focus-within:border-indigo-500/40">
        <input type="email" name="email" aria-label="Email for product updates" placeholder="your@email.com" className="w-full bg-transparent text-xs text-zinc-500 outline-none placeholder:text-zinc-700" required />
        <button type="submit" disabled={busy} className="flex shrink-0 items-center gap-1 bg-transparent text-xs font-bold text-indigo-650 transition-colors hover:text-indigo-500 disabled:opacity-60">
          {busy ? "Joining..." : "Join"}<ArrowRight className="h-3 w-3" />
        </button>
      </form>
      {status ? <p className={`mt-2 flex items-center gap-1.5 text-[10px] font-bold ${status.includes("subscribed") ? "text-emerald-600" : "text-rose-600"}`}>{status.includes("subscribed") ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}{status}</p> : null}
    </div>
  );
}
