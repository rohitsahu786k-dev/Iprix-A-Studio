"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Check, KeyRound, Lock, Mail, ShieldCheck, Sparkles, User, Zap } from "lucide-react";

type Mode = "login" | "signup" | "forgot" | "reset";

const copy = {
  login: {
    title: "Welcome back, seller",
    subtitle: "Login to your listings, templates, keyword reports and extension autofill.",
    button: "Login to dashboard",
  },
  signup: {
    title: "Create your free account",
    subtitle: "AI listings, free keyword research, image checker and Meesho autofill — no credit card.",
    button: "Create free account",
  },
  forgot: {
    title: "Recover access",
    subtitle: "Enter your account email and we will send reset instructions.",
    button: "Send reset link",
  },
  reset: {
    title: "Set a new password",
    subtitle: "Use your reset token to secure your A+ Studio account.",
    button: "Reset password",
  },
};

const highlights = [
  { label: "Free AI listing generator — start with zero cost", Icon: Sparkles },
  { label: "Meesho autofill Chrome extension", Icon: Zap },
  { label: "Unlimited free keyword research", Icon: Check },
  { label: "Bank-grade security, server-side AI", Icon: ShieldCheck },
];

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
    <div className="relative min-h-[calc(100vh-80px)] bg-zinc-900/40">
      <div className="container relative z-10 grid lg:grid-cols-[1.05fr_1fr] items-center gap-10 min-h-[calc(100vh-80px)] py-12">
        {/* Left column: brand story */}
        <section className="hidden lg:flex flex-col gap-8 pr-8">
          <div className="flex items-center gap-4">
            <Image src="/aplus-logo.png" alt="A+ Studio logo" width={64} height={64} className="h-16 w-16 object-contain drop-shadow-md" priority unoptimized />
            <div>
              <p className="text-2xl font-extrabold tracking-tight text-zinc-100 leading-none">
                A+ <span className="text-indigo-500">Studio</span>
              </p>
              <p className="text-xs font-semibold text-zinc-500 mt-1">Meesho listing AI tool by Iprix Media</p>
            </div>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-100 leading-[1.15] max-w-lg">
            List products <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">10x faster</span> on
            Meesho, Flipkart &amp; Amazon
          </h1>

          <div className="grid gap-3 max-w-md">
            {highlights.map(({ label, Icon }) => (
              <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-800 bg-white shadow-pin px-5 py-4 text-sm font-bold text-zinc-200" key={label}>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-50 text-indigo-500">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                {label}
              </div>
            ))}
          </div>

          <p className="text-xs font-semibold text-zinc-500">Trusted by Indian marketplace sellers | Iprix Media, Udaipur</p>
        </section>

        {/* Right column: form card */}
        <section className="flex items-center justify-center">
          <div className="w-full max-w-[440px]">
            <div className="rounded-[28px] border border-zinc-800 bg-white shadow-pin-lg p-8 md:p-10">
              <div className="lg:hidden flex justify-center mb-6">
                <Image src="/aplus-logo.png" alt="A+ Studio logo" width={56} height={56} className="h-14 w-14 object-contain" priority unoptimized />
              </div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-500">
                {mode === "signup" ? "Free forever plan" : "Secure access"}
              </p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-100">{page.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{page.subtitle}</p>

              <form onSubmit={onSubmit} className="mt-8 space-y-4">
                {mode === "signup" ? <Field name="name" label="Full name" icon="user" autoComplete="name" /> : null}
                <Field name="email" label="Email address" type="email" icon="mail" autoComplete="email" />
                {mode === "reset" ? <Field name="token" label="Reset token" icon="key" /> : null}
                {mode !== "forgot" ? (
                  <Field
                    name="password"
                    label="Password"
                    type="password"
                    icon="lock"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                  />
                ) : null}

                {mode === "login" ? (
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 py-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" className="accent-[#4f46e5] rounded w-4 h-4 cursor-pointer" />
                      Remember me
                    </label>
                    <Link href="/forgot-password" className="text-indigo-500 hover:text-indigo-600 font-bold">
                      Forgot password?
                    </Link>
                  </div>
                ) : null}

                <button
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-indigo-500 px-4 py-4 text-sm font-bold text-white shadow-md hover:bg-indigo-600 active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
                  disabled={busy}
                >
                  {busy ? "Please wait..." : page.button}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              {status ? (
                <p className="mt-4 rounded-2xl bg-indigo-50 px-4 py-3 text-xs font-bold text-indigo-700">{status}</p>
              ) : null}

              <div className="mt-7 border-t border-zinc-850 pt-5 text-center text-xs font-semibold text-zinc-400">
                {mode !== "login" ? (
                  <>
                    Already have an account?{" "}
                    <Link href="/login" className="text-indigo-500 hover:text-indigo-600 font-bold">
                      Login
                    </Link>
                  </>
                ) : (
                  <>
                    New to A+ Studio?{" "}
                    <Link href="/signup" className="text-indigo-500 hover:text-indigo-600 font-bold">
                      Create free account
                    </Link>
                  </>
                )}
              </div>
            </div>

            <p className="mt-5 flex items-center justify-center gap-2 text-[11px] font-semibold text-zinc-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Secure HTTP-only session | Passwords hashed | No card required
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  icon,
  autoComplete,
}: {
  name: string;
  label: string;
  type?: string;
  icon: "user" | "mail" | "key" | "lock";
  autoComplete?: string;
}) {
  const Icon = icon === "user" ? User : icon === "mail" ? Mail : icon === "key" ? KeyRound : Lock;
  return (
    <label className="grid gap-1.5 text-xs">
      <span className="font-bold text-zinc-300">{label}</span>
      <span className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-white px-4 transition-colors focus-within:border-indigo-400">
        <Icon className="h-4 w-4 shrink-0 text-zinc-500" />
        <input
          className="min-h-12 flex-1 bg-transparent py-3.5 outline-none text-sm text-zinc-100 font-semibold"
          name={name}
          type={type}
          autoComplete={autoComplete}
          required
        />
      </span>
    </label>
  );
}
