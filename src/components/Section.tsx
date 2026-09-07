import type { ReactNode } from "react";
import { sectionOf, type SectionId } from "@/config/site";

/**
 * A numbered section of the brief. The § signature and the heading both come
 * from `sections` in the site config, so the rail and the page can never drift.
 */
export function Section({
  id,
  lede,
  children,
}: {
  id: SectionId;
  lede?: ReactNode;
  children: ReactNode;
}) {
  const { sig, title } = sectionOf(id);

  return (
    <section id={id} aria-labelledby={`${id}-heading`}>
      <div className="sec-head">
        <span className="sig" aria-hidden="true">
          {sig}
        </span>
        <h2 id={`${id}-heading`}>{title}</h2>
      </div>
      {lede ? <p className="sec-lede">{lede}</p> : null}
      {children}
    </section>
  );
}

/** Square-bulleted requirement list. */
export function Ticks({ items }: { items: ReactNode[] }) {
  return (
    <ul className="ticks">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

/** Numbered instruction list. */
export function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="steps">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ol>
  );
}
