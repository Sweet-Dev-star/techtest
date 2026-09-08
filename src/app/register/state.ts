import type { FieldErrors } from "@/lib/users";

/**
 * Kept out of actions.ts on purpose: a "use server" module may only export
 * async functions, so constants and types live beside it rather than in it.
 */
export type RegisterState = {
  errors: FieldErrors;
  /** Echoed back so a rejected form does not lose what was typed — never the password. */
  values: {
    username: string;
    email: string;
    country: string;
    age: string;
    developerType: string;
  };
};

export const EMPTY_REGISTER_STATE: RegisterState = {
  errors: {},
  values: { username: "", email: "", country: "", age: "", developerType: "" },
};
