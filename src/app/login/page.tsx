import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { PublicShell } from "@/components/public-shell";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Login" };
export default async function LoginPage({ searchParams }: { searchParams?: Promise<{ next?: string }> }) {
  const session = await getSession();
  const params = await searchParams;
  const next = params?.next;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  if (session) redirect(safeNext);
  return (
    <PublicShell>
      <AuthForm mode="login" redirectTo={safeNext} />
    </PublicShell>
  );
}
