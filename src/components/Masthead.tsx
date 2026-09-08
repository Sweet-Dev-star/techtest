import Link from "next/link";
import { site } from "@/config/site";
import { deck, headline, specStrip } from "@/content/assessment";
import { deckFor, trackFor } from "@/content/tracks";
import { developerTypeLabel } from "@/lib/options";
import type { User } from "@/lib/users";

export function Masthead({ user }: { user?: User | null }) {
  // When a candidate is signed in, the header speaks to their role: the crumb
  // names it and the deck names their three problems, matching §02 below.
  const track = user ? trackFor(user.developer_type) : undefined;
  const roleLabel = user ? developerTypeLabel(user.developer_type) : site.role;
  const roleDeck = track ? deckFor(track.role) : deck;

  return (
    <header className="masthead">
      <div className="mast-inner">
        <div className="mast-top">
          <div className="mast-crumbs eyebrow">
            <span>Engineering&nbsp;&middot;&nbsp;Hiring</span>
            <span className="dot">/</span>
            <span>{roleLabel}</span>
            <span className="dot">/</span>
            <span>Take-home assessment&nbsp;&middot;&nbsp;{site.revision}</span>
          </div>

          {user ? (
            <nav className="mast-auth" aria-label="Account">
              <Link href="/account">{user.username}</Link>
            </nav>
          ) : (
            <nav className="mast-auth" aria-label="Account">
              <Link href="/login">Sign in</Link>
              <Link href="/register" className="primary">
                Register
              </Link>
            </nav>
          )}
        </div>

        <div className="mast-body">
          <h1>{headline}</h1>
          <p className="deck">{roleDeck}</p>
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
