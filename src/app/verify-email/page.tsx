import type { Metadata } from "next";
import { PublicShell } from "@/components/public-shell";
import { VerifyEmailClient } from "@/components/verify-email-client";

export const metadata: Metadata = { title: "Verify Email | A+ Studio" };

export default function VerifyEmailPage() {
  return (
    <PublicShell>
      <section className="container py-24 flex items-center justify-center min-h-[60vh] bg-white">
        <VerifyEmailClient />
      </section>
    </PublicShell>
  );
}
