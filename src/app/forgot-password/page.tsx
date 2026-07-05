import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Forgot Password" };
export default function ForgotPasswordPage() { return <AuthForm mode="forgot" />; }
