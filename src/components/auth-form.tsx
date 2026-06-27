"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, KeyRound, Lock, Mail, MonitorUp, ShieldCheck, Sparkles, User } from "lucide-react";

type Mode = "login" | "signup" | "forgot" | "reset";

const copy = {
  login: {
    title: "Welcome back",
    subtitle: "Login to manage listings, templates, products and extension autofill.",
    button: "Login",
  },
  signup: {
    title: "Create your workspace",
    subtitle: "Start with templates, products, AI credits and Meesho autofill.",
    button: "Create account",
  },
  forgot: {
    title: "Recover access",
    subtitle: "Enter your account email and we will prepare reset instructions.",
    button: "Send reset link",
  },
  reset: {
    title: "Set new password",
    subtitle: "Use your reset token to secure your A+ Studio account.",
    button: "Reset password",
  },
};

export function AuthForm({ mode, redirectTo = "/dashboard" }: { mode: Mode; redirectTo?: string }) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const page = copy[mode];

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch(`/api/auth/${mode === "forgot" ? "forgot-password" : mode === "reset" ? "reset-password" : mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      setStatus(data.message || "Success");
      if (mode === "login" || mode === "signup") {
        // Save JWT token to localStorage so the extension bridge can pick it up
        if (data.token) {
          localStorage.setItem("listify_token", data.token);
        }
        router.push(redirectTo);
      }
    } else {
      setStatus(data.error || "Something went wrong");
    }
    setBusy(false);
  }

  return (
    <div className="relative min-h-[calc(100vh-80px)] bg-white text-neutral-950">
      {/* Split background layout */}
      <div className="absolute inset-0 hidden lg:grid lg:grid-cols-[1fr_1fr] pointer-events-none">
        <div className="bg-neutral-50/50 border-r border-neutral-150 h-full" />
        <div className="bg-white h-full" />
      </div>

      <div className="container relative z-10 grid lg:grid-cols-[1fr_1fr] items-stretch min-h-[calc(100vh-80px)]">
        {/* Left column: Info & Graphics */}
        <section className="hidden py-16 pr-12 flex-col justify-between lg:flex relative">
          <div>
            <div className="max-w-md">
              <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-bold text-neutral-800 mb-6">
                <Sparkles className="h-4.5 w-4.5 text-neutral-900" />
                AI listing automation for Indian sellers
              </div>
              
              <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 leading-tight mb-8">
                One secure workspace for <span className="underline decoration-neutral-900 underline-offset-4">products, templates and autofill.</span>
              </h1>
              
              <div className="space-y-3">
                {[
                  { label: "Chrome extension connected", Icon: MonitorUp },
                  { label: "Server-side AI generation", Icon: ShieldCheck },
                  { label: "Protected dashboard access", Icon: Lock },
                ].map(({ label, Icon }) => (
                  <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3.5 text-xs font-bold text-neutral-700" key={label}>
                    <Icon className="h-4 w-4 text-neutral-800" />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Left-Aligned Graphic / SVG Illustration */}
          <div className="relative w-full max-w-xs my-8 flex items-center justify-start">
            <svg className="w-full h-auto max-h-48 text-neutral-800" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Geometric grid lines */}
              <line x1="10" y1="20" x2="190" y2="20" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.3" />
              <line x1="10" y1="60" x2="190" y2="60" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.3" />
              <line x1="10" y1="100" x2="190" y2="100" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.3" />
              
              {/* Connection paths */}
              <path d="M40 60H160" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
              <path d="M100 20V100" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
              
              {/* Outer Security Shield shape in minimalist contour lines */}
              <path d="M100 25C80 25 70 37.5 70 60C70 87.5 100 105 100 105C100 105 130 87.5 130 60C130 37.5 120 25 100 25Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M100 32C85 32 77 42.5 77 60C77 82.5 100 97 100 97C100 97 123 82.5 123 60C123 42.5 115 32 100 32Z" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 2" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Automation nodes / circles */}
              <circle cx="100" cy="60" r="15" fill="white" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="100" cy="60" r="4" fill="currentColor" />
              
              {/* Left/Right orbital nodes */}
              <circle cx="40" cy="60" r="6" fill="white" stroke="currentColor" strokeWidth="1.5" />
              <path d="M38 60H42M40 58V62" stroke="currentColor" strokeWidth="1" />
              
              <circle cx="160" cy="60" r="6" fill="white" stroke="currentColor" strokeWidth="1.5" />
              <path d="M158 60H162M160 58V62" stroke="currentColor" strokeWidth="1" />
              
              {/* Top/Bottom node */}
              <circle cx="100" cy="20" r="4" fill="currentColor" />
              <circle cx="100" cy="100" r="4" fill="currentColor" />
            </svg>
          </div>
          
          <p className="text-xs font-medium text-neutral-450">Iprix Media | Udaipur, Rajasthan 313001</p>
        </section>

        {/* Right column: Form */}
        <section className="flex items-center justify-center p-6 lg:py-16 lg:pl-12 bg-white lg:bg-transparent">
          <div className="w-full max-w-[460px] flex flex-col justify-center">
            
            {/* Form Card */}
            <div className="rounded-3xl border border-neutral-200 bg-white p-8 md:p-10 shadow-sm">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-450">
                {mode === "login" ? "Account access" : "Secure onboarding"}
              </p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-neutral-900">{page.title}</h2>
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">{page.subtitle}</p>

              <form onSubmit={onSubmit} className="mt-8 space-y-4">
                {mode === "signup" ? <Field name="name" label="Name" icon="user" /> : null}
                <Field name="email" label="Email" type="email" icon="mail" />
                {mode === "reset" ? <Field name="token" label="Reset token" icon="key" /> : null}
                {mode !== "forgot" ? <Field name="password" label="Password" type="password" icon="lock" /> : null}
                
                {mode === "login" ? (
                  <div className="flex items-center justify-between text-xs text-neutral-500 py-1">
                    <label className="flex items-center gap-2 cursor-pointer font-medium select-none">
                      <input type="checkbox" className="accent-neutral-900 rounded border-neutral-300 w-4 h-4 cursor-pointer" />
                      Remember me
                    </label>
                    <Link href="/forgot-password" className="hover:text-neutral-900 hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                ) : null}

                <button 
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 py-3.5 text-xs font-bold text-white shadow-sm hover:bg-neutral-850 transition-all disabled:opacity-60 cursor-pointer" 
                  disabled={busy}
                >
                  {busy ? "Please wait" : page.button}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              {status ? <p className="mt-4 rounded-xl bg-neutral-50 border border-neutral-200 p-3 text-xs text-neutral-700">{status}</p> : null}

              {/* Toggle links */}
              <div className="mt-6 flex items-center justify-center gap-4 text-xs font-semibold text-neutral-500">
                {mode !== "login" ? (
                  <Link href="/login" className="hover:text-neutral-900 transition-colors">Login</Link>
                ) : (
                  <Link href="/signup" className="hover:text-neutral-900 transition-colors">Create account</Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({ name, label, type = "text", icon }: { name: string; label: string; type?: string; icon: "user" | "mail" | "key" | "lock" }) {
  const Icon = icon === "user" ? User : icon === "mail" ? Mail : icon === "key" ? KeyRound : Lock;
  return (
    <label className="grid gap-1.5 text-xs">
      <span className="font-bold text-neutral-700">{label}</span>
      <span className="flex items-center gap-3 rounded-xl border border-neutral-250 bg-white px-3 focus-within:border-neutral-300 focus-within:ring-2 focus-within:ring-neutral-100 transition-colors">
        <Icon className="h-4 w-4 shrink-0 text-neutral-400" />
        <input className="min-h-12 flex-1 bg-transparent py-3.5 outline-none text-xs text-neutral-900 font-semibold" name={name} type={type} required />
      </span>
    </label>
  );
}
