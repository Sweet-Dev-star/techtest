import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { COUNTRIES, DEVELOPER_TYPES } from "@/lib/options";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "Register",
  description: "Create an account to receive the take-home brief.",
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create an account"
      lede="Register to receive the take-home brief. We use these details to send it at a time that suits you, and to know which role to read your submission against."
      footer={
        <>
          Already registered? <Link href="/login">Sign in</Link>.
        </>
      }
    >
      <RegisterForm
        countries={COUNTRIES.map((country) => ({ value: country.code, label: country.name }))}
        developerTypes={DEVELOPER_TYPES.map((type) => ({ value: type.value, label: type.label }))}
      />
    </AuthShell>
  );
}
