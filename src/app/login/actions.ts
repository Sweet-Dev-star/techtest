"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession } from "@/lib/session";
import { authenticate } from "@/lib/users";
import type { LoginState } from "./state";

export async function loginAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const identifier = String(formData.get("identifier") ?? "");
  const password = String(formData.get("password") ?? "");
  const values = { identifier };

  if (!identifier.trim() || !password) {
    return { errors: { form: "Enter your details to sign in." }, values };
  }

  const user = authenticate(identifier, password);

  // One message for a wrong password and for an account that does not exist:
  // the form must not become a way to discover who has registered.
  if (!user) {
    return { errors: { form: "Those details do not match an account." }, values };
  }

  await createSession(user.id);
  redirect("/account");
}

export async function signOutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
