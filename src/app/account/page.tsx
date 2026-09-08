import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { signOutAction } from "@/app/login/actions";
import { countryName, developerTypeLabel } from "@/lib/options";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Your account",
  description: "The details we hold for you.",
};

export default async function AccountPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const registered = new Date(user.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const details = [
    { term: "Username", value: user.username },
    { term: "Email", value: user.email },
    { term: "Country", value: countryName(user.country) },
    { term: "Age", value: String(user.age) },
    { term: "Role", value: developerTypeLabel(user.developer_type) },
    { term: "Registered", value: registered },
  ];

  return (
    <AuthShell
      title={`Hello, ${user.username}`}
      lede="This is everything we hold for you. Tell us the day that suits you and we will send the brief that morning — the clock starts then."
      footer={
        <>
          Ready to read it? <Link href="/">Open the brief</Link>.
        </>
      }
    >
      <dl className="account-details">
        {details.map((row) => (
          <div key={row.term}>
            <dt>{row.term}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>

      <form action={signOutAction}>
        <button type="submit" className="auth-secondary">
          Sign out
        </button>
      </form>
    </AuthShell>
  );
}
