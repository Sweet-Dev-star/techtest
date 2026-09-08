"use server";

import { redirect } from "next/navigation";
import { createSession } from "@/lib/session";
import { createUser, validateRegistration } from "@/lib/users";
import type { RegisterState } from "./state";

export async function registerAction(
  _previous: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const input = {
    username: String(formData.get("username") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    country: String(formData.get("country") ?? ""),
    age: String(formData.get("age") ?? ""),
    developerType: String(formData.get("developerType") ?? ""),
  };

  const values = {
    username: input.username,
    email: input.email,
    country: input.country,
    age: input.age,
    developerType: input.developerType,
  };

  const errors = validateRegistration(input);
  if (Object.keys(errors).length > 0) return { errors, values };

  const result = createUser(input);
  if ("errors" in result) return { errors: result.errors, values };

  await createSession(result.user.id);
  redirect("/account");
}
