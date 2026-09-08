import Link from "next/link";
import { site } from "@/config/site";
import { deck, headline, specStrip } from "@/content/assessment";

export function Masthead() {
  return (
    <header className="masthead">
      <div className="mast-inner">
        <div className="mast-top">
          <div className="mast-crumbs eyebrow">
            <span>Engineering&nbsp;&middot;&nbsp;Hiring</span>
            <span className="dot">/</span>
            <span>{site.role}</span>
            <span className="dot">/</span>
            <span>Take-home assessment&nbsp;&middot;&nbsp;{site.revision}</span>
          </div>

          <nav className="mast-auth" aria-label="Account">
            <Link href="/login">Sign in</Link>
            <Link href="/register" className="primary">
              Register
            </Link>
          </nav>
        </div>

        <div className="mast-body">
          <h1>{headline}</h1>
          <p className="deck">{deck}</p>
        </div>
      </div>

      <dl className="spec">
        {specStrip.map((item) => (
          <div key={item.term}>
            <dt>{item.term}</dt>
            <dd>
              {item.value}
              <small>{item.note}</small>
            </dd>
          </div>
        ))}
      </dl>
    </header>
  );
}
