"use client";

import { useEffect, useState } from "react";
import { sections, site } from "@/config/site";

/**
 * Sticky table of contents. Highlights the section currently under the reader,
 * using the same `sections` list the page headings are built from.
 */
export function ContentsRail() {
  const [active, setActive] = useState<string>(sections[0].id);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const targets = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);

    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: "-12% 0px -72% 0px" },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="rail" aria-label="Contents">
      <p className="eyebrow">Contents</p>
      <ol>
        {sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className={s.id === active ? "on" : undefined}
              aria-current={s.id === active ? "location" : undefined}
            >
              <span className="num" aria-hidden="true">
                {s.sig}
              </span>
              <span>{s.title}</span>
            </a>
          </li>
        ))}
      </ol>
      <p className="rail-note">
        Questions about the brief itself are welcome and cost you nothing.
        <br />
        <br />
        <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
      </p>
    </nav>
  );
}
