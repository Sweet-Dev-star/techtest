import Link from "next/link";
import { Section, Ticks } from "@/components/Section";
import { type Problem } from "@/content/assessment";
import { TRACKS, tracksIndexLede } from "@/content/tracks";

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
 * §02 on the brief is an index of the five tracks rather than one set of
 * problems — the work differs by role, the rules do not.
 */
export function Problems() {
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
