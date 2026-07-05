import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Reset Password" };
export default function ResetPasswordPage() { return <AuthForm mode="reset" />; }
