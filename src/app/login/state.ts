import type { FieldErrors } from "@/lib/users";

/** See the note in register/state.ts — "use server" modules export functions only. */
export type LoginState = {
  errors: FieldErrors;
  values: { identifier: string };
};

export const EMPTY_LOGIN_STATE: LoginState = { errors: {}, values: { identifier: "" } };
