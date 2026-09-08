import { useState, type FormEvent } from "react";
import { api, ApiError } from "../api/client.ts";
import { authenticate } from "../state/app.ts";

/** Register / sign-in. The account model is intentionally simple; extend it. */
export function AuthPanel() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);

    try {
      if (mode === "register") {
        const { user } = await api.register({
          username: String(form.get("username")),
          email: String(form.get("email")),
          password: String(form.get("password")),
        });
        authenticate(user);
      } else {
        const { user } = await api.login({
          identifier: String(form.get("identifier")),
          password: String(form.get("password")),
        });
        authenticate(user);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const registering = mode === "register";

  return (
    <div className="auth">
      <h1>{registering ? "Create an account" : "Sign in"}</h1>
      <p className="sub">Task manager — baseline build.</p>
      {error ? <p className="error">{error}</p> : null}

      <form onSubmit={onSubmit}>
        {registering ? (
          <input name="username" placeholder="Username" autoComplete="username" required minLength={3} />
        ) : null}
        {registering ? (
          <input name="email" type="email" placeholder="you@example.com" autoComplete="email" required />
        ) : (
          <input name="identifier" placeholder="Email or username" autoComplete="username" required />
        )}
        <input
          name="password"
          type="password"
          placeholder="Password"
          autoComplete={registering ? "new-password" : "current-password"}
          required
          minLength={registering ? 10 : undefined}
        />
        <button className="primary" type="submit" disabled={busy}>
          {registering ? "Create account" : "Sign in"}
        </button>
      </form>

      <div className="row">
        <span className="sub">{registering ? "Already registered?" : "No account yet?"}</span>
        <button
          className="link"
          type="button"
          onClick={() => {
            setMode(registering ? "login" : "register");
            setError(null);
          }}
        >
          {registering ? "Sign in" : "Create one"}
        </button>
      </div>
    </div>
  );
}
