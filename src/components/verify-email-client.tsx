"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const missingVerificationParams = !token || !email;

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    missingVerificationParams ? "error" : "loading",
  );
  const [message, setMessage] = useState(
    missingVerificationParams
      ? "Missing verification token or email address in URL."
      : "Verifying your email address...",
  );

  useEffect(() => {
    if (missingVerificationParams) return;

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setStatus("success");
          setMessage("Email verified successfully! Redirecting to dashboard...");
          setTimeout(() => {
            router.push("/dashboard");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed. Invalid or expired token.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("An error occurred during verification.");
      });
  }, [token, email, missingVerificationParams, router]);

  return (
    <div className="mx-auto max-w-md w-full border border-neutral-200 bg-white rounded-2xl p-8 shadow-sm text-center">
      {status === "loading" && (
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-10 w-10 text-neutral-900 animate-spin" />
          <h2 className="text-xl font-bold text-neutral-900">Verifying Email</h2>
          <p className="text-sm text-neutral-500 font-semibold">{message}</p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center justify-center space-y-4">
          <CheckCircle2 className="h-12 w-12 text-neutral-900" />
          <h2 className="text-xl font-bold text-neutral-900">Account Verified!</h2>
          <p className="text-sm text-neutral-500 font-semibold">{message}</p>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center justify-center space-y-4">
          <XCircle className="h-12 w-12 text-neutral-900" />
          <h2 className="text-xl font-bold text-neutral-900">Verification Failed</h2>
          <p className="text-sm text-neutral-500 font-semibold mb-4">{message}</p>
          <button
            onClick={() => router.push("/login")}
            className="w-full rounded-xl bg-neutral-950 px-4 py-3 text-xs font-bold text-white hover:bg-neutral-850 transition-all cursor-pointer"
          >
            Go to Login
          </button>
        </div>
      )}
    </div>
  );
}

export function VerifyEmailClient() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-md w-full border border-neutral-200 bg-white rounded-2xl p-8 shadow-sm text-center flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-neutral-900 animate-spin" />
        <h2 className="text-xl font-bold text-neutral-900">Loading</h2>
        <p className="text-sm text-neutral-500 font-semibold">Preparing verification environment...</p>
      </div>
    }>
      <VerifyEmailInner />
    </Suspense>
  );
}
