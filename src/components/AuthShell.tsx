import Link from "next/link";
import type { ReactNode } from "react";
import { site } from "@/config/site";

/**
 * The frame shared by the sign-in, registration and account pages: the same
 * masthead crumb as the brief, a title, and a single bordered card.
 */
export function AuthShell({
  title,
  lede,
  children,
  footer,
}: {
  title: string;
  lede: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="auth-shell">
      <header className="auth-head">
        <Link href="/" className="auth-crumb eyebrow">
          <span>Engineering&nbsp;&middot;&nbsp;Hiring</span>
          <span className="dot">/</span>
          <span>{site.role}</span>
        </Link>
        <h1>{title}</h1>
        <p className="auth-lede">{lede}</p>
      </header>

      <div className="auth-card">{children}</div>

      {footer ? <p className="auth-alt">{footer}</p> : null}
    </div>
  );
}

/** One labelled control plus its error, wired up for screen readers. */
export function Field({
  name,
  label,
  hint,
  error,
  children,
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className={`field${error ? " field-invalid" : ""}`}>
      <label htmlFor={name}>{label}</label>
      {children}
      {error ? (
        <p className="field-error" id={`${name}-error`} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="field-hint" id={`${name}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
