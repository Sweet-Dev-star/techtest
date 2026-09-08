import Link from "next/link";
import { Section, Ticks } from "@/components/Section";
import { type Problem } from "@/content/assessment";
import { TRACKS, tracksIndexLede, trackFor } from "@/content/tracks";
import { developerTypeLabel } from "@/lib/options";
import type { User } from "@/lib/users";

/** One problem, as it appears on a track page. */
export function ProblemBrief({ problem }: { problem: Problem }) {
  return (
    <article className="problem" id={problem.id} aria-labelledby={`${problem.id}-title`}>
      <div className="p-head">
        <span className="p-tag">{problem.tag}</span>
        <span className="p-meta">{problem.meta}</span>
      </div>
      <h3 className="p-title" id={`${problem.id}-title`}>
        {problem.title}
      </h3>

      <div className="p-body">
        <div className="prose">
          {problem.intro.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
          <h4>Required behaviour</h4>
          <Ticks items={problem.requirements} />
        </div>

        <div>
          <div className="panel">
            <h4>What we read for</h4>
            <ul>
              {problem.readFor.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="panel done">
            <h4>Done when</h4>
            <ul>
              {problem.doneWhen.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * §02 adapts to who is reading.
 *
 * A signed-in candidate sees the three problems for the role they registered
 * with, expanded in place. Everyone else sees the index of all five tracks —
 * the work differs by role, the rules do not.
 */
export function Problems({ user }: { user?: User | null }) {
  const track = user ? trackFor(user.developer_type) : undefined;

  if (user && track) {
    return (
      <Section
        id="problems"
        lede={
          <>
            You registered as <b>{developerTypeLabel(user.developer_type)}</b>, so these are
            your three problems. Not your role? Check{" "}
            <Link href="/account">your account</Link>, or browse{" "}
            <Link href={`/tracks/${track.role}`}>this track on its own page</Link>.
          </>
        }
      >
        <p className="track-you eyebrow">Your track &middot; {track.label}</p>
        <div className="problems">
          {track.problems.map((problem) => (
            <ProblemBrief key={problem.id} problem={problem} />
          ))}
        </div>
      </Section>
    );
  }

  return (
    <Section id="problems" lede={tracksIndexLede}>
      <ul className="track-index">
        {TRACKS.map((track) => (
          <li key={track.role}>
            <Link href={`/tracks/${track.role}`}>
              <span className="track-index-role">{track.label}</span>
              <span className="track-index-focus">{track.focus}</span>
              <span className="track-index-go" aria-hidden="true">
                &rarr;
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
