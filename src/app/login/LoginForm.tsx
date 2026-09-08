"use client";

import { useActionState } from "react";
import { Field } from "@/components/AuthShell";
import { loginAction } from "./actions";
import { EMPTY_LOGIN_STATE } from "./state";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, EMPTY_LOGIN_STATE);
  const { errors, values } = state;

  return (
    <form action={formAction} noValidate>
      {errors.form ? (
        <p className="form-error" role="alert">
          {errors.form}
        </p>
      ) : null}

      <Field name="identifier" label="Email or username">
        <input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          defaultValue={values.identifier}
        />
      </Field>

      <Field name="password" label="Password">
        <input id="password" name="password" type="password" autoComplete="current-password" />
      </Field>

      <button type="submit" className="auth-submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
