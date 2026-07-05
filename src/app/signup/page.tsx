import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { PublicShell } from "@/components/public-shell";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Signup" };
export default async function SignupPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");
  return (
    <PublicShell>
      <AuthForm mode="signup" />
    </PublicShell>
  );
}
