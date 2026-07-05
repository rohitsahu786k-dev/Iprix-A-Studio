import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { PublicShell } from "@/components/public-shell";

export const metadata: Metadata = {
  title: "Forgot Password | A+ Studio",
  description: "Reset your A+ Studio account password. Enter your registered email address and we will send you a secure password reset link within minutes.",
  alternates: { canonical: "/forgot-password" },
};
export default function ForgotPasswordPage() {
  return (
    <PublicShell>
      <AuthForm mode="forgot" />
      <section className="py-12 border-t border-zinc-900 bg-zinc-950">
        <div className="container max-w-2xl mx-auto text-center space-y-4">
          <h2 className="text-xl font-bold text-zinc-100">Having trouble accessing your account?</h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            Enter the email address you used to register for A+ Studio and we will send a secure password reset link. The link expires in 30 minutes for your security. If you do not see the email in your inbox, check your spam folder. For further help, contact our support team at <a href="mailto:info@iprixmedia.com" className="text-indigo-400 hover:underline">info@iprixmedia.com</a> or via WhatsApp.
          </p>
        </div>
      </section>
    </PublicShell>
  );
}
