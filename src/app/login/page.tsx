import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your candidate account.",
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Sign in"
      lede="Pick up where you left off."
      footer={
        <>
          No account yet? <Link href="/register">Register</Link>.
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
