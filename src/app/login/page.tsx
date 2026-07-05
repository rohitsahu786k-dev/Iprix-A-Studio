import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { PublicShell } from "@/components/public-shell";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Login | A+ Studio",
  description: "Sign in to your A+ Studio account to access AI listing tools, keyword research, Chrome extension autofill and your seller dashboard for Meesho, Flipkart and Amazon India.",
  alternates: { canonical: "/login" },
};
export default async function LoginPage({ searchParams }: { searchParams?: Promise<{ next?: string }> }) {
  const session = await getSession();
  const params = await searchParams;
  const next = params?.next;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  if (session) redirect(safeNext);
  return (
    <PublicShell>
      <AuthForm mode="login" redirectTo={safeNext} />
      <section className="py-12 border-t border-zinc-900 bg-zinc-950">
        <div className="container max-w-2xl mx-auto text-center space-y-4">
          <h2 className="text-xl font-bold text-zinc-100">Your complete Meesho seller toolkit</h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            A+ Studio gives Indian marketplace sellers everything needed to list faster and earn more. After logging in you will find the AI listing generator, Meesho keyword research tool, image size checker, shipping weight calculator, bulk CSV upload, and the Chrome extension dashboard — all in one place. New to A+ Studio? <a href="/signup" className="text-indigo-400 hover:underline">Create a free account</a> — no credit card required.
          </p>
        </div>
      </section>
    </PublicShell>
  );
}
