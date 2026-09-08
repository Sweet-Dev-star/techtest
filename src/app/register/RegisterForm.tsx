"use client";

import { useActionState } from "react";
import { Field } from "@/components/AuthShell";
import { MAX_AGE, MIN_AGE, MIN_PASSWORD_LENGTH } from "@/lib/options";
import { registerAction } from "./actions";
import { EMPTY_REGISTER_STATE } from "./state";

type Option = { value: string; label: string };

export function RegisterForm({
  countries,
  developerTypes,
}: {
  countries: Option[];
  developerTypes: Option[];
}) {
  const [state, formAction, pending] = useActionState(registerAction, EMPTY_REGISTER_STATE);
  const { errors, values } = state;

  return (
    <form action={formAction} noValidate>
      {errors.form ? (
        <p className="form-error" role="alert">
          {errors.form}
        </p>
      ) : null}

      <Field name="username" label="Username" error={errors.username} hint="How we will address you.">
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          defaultValue={values.username}
          aria-invalid={Boolean(errors.username)}
          aria-describedby={errors.username ? "username-error" : "username-hint"}
        />
      </Field>

      <Field name="email" label="Email" error={errors.email} hint="Where we send the brief.">
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={values.email}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : "email-hint"}
        />
      </Field>

      <Field
        name="password"
        label="Password"
        error={errors.password}
        hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
      >
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "password-error" : "password-hint"}
        />
      </Field>

      <div className="field-row">
        <Field name="country" label="Country" error={errors.country}>
          <select
            id="country"
            name="country"
            defaultValue={values.country}
            aria-invalid={Boolean(errors.country)}
            aria-describedby={errors.country ? "country-error" : undefined}
          >
            <option value="">Select a country</option>
            {countries.map((country) => (
              <option key={country.value} value={country.value}>
                {country.label}
              </option>
            ))}
          </select>
        </Field>

        <Field name="age" label="Age" error={errors.age}>
          <input
            id="age"
            name="age"
            type="number"
            inputMode="numeric"
            min={MIN_AGE}
            max={MAX_AGE}
            defaultValue={values.age}
            aria-invalid={Boolean(errors.age)}
            aria-describedby={errors.age ? "age-error" : undefined}
          />
        </Field>
      </div>

      <Field
        name="developerType"
        label="Developer type"
        error={errors.developerType}
        hint="Pick the one closest to the work you want."
      >
        <select
          id="developerType"
          name="developerType"
          defaultValue={values.developerType}
          aria-invalid={Boolean(errors.developerType)}
          aria-describedby={errors.developerType ? "developerType-error" : "developerType-hint"}
        >
          <option value="">Select a role</option>
          {developerTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </Field>

      <button type="submit" className="auth-submit" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
