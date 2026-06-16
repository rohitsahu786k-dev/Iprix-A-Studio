import { clearSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function POST() {
  await clearSession();
  redirect("/");
}

export async function GET() {
  await clearSession();
  redirect("/");
}

