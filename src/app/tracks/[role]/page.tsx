import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProblemBrief } from "@/components/ProblemBrief";
import { site } from "@/config/site";
import { TRACKS, trackFor } from "@/content/tracks";

type Params = { role: string };

export function generateStaticParams(): Params[] {
  return TRACKS.map((track) => ({ role: track.role }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const track = trackFor((await params).role);
  if (!track) return { title: "Track not found" };

  return {
    title: `${track.label} track`,
    description: track.focus,
  };
}

export default async function TrackPage({ params }: { params: Promise<Params> }) {
  const track = trackFor((await params).role);
  if (!track) notFound();

  return (
    <div className="track-page">
      <header className="track-head">
        <Link href="/" className="auth-crumb eyebrow">
          <span>Take-home assessment</span>
          <span className="dot">/</span>
          <span>{site.revision}</span>
        </Link>
        <p className="eyebrow track-role">{track.label}</p>
        <h1>{track.focus}</h1>
        <p className="track-lede">{track.lede}</p>
      </header>

      <dl className="spec track-spec">
        <div>
          <dt>Time limit</dt>
          <dd>
            {site.effort}
            <small>from receipt &mdash; hard stop</small>
          </dd>
        </div>
        <div>
          <dt>Starting point</dt>
          <dd>
            Baseline provided
            <small>{site.starterRuntime} &middot; port allowed</small>
          </dd>
        </div>
        <div>
          <dt>Expected</dt>
          <dd>
            One problem, finished
            <small>not three, half-built</small>
          </dd>
        </div>
      </dl>

      <main className="track-main">
        <div className="problems">
          {track.problems.map((problem) => (
            <ProblemBrief key={problem.id} problem={problem} />
          ))}
        </div>

        <p className="hint track-foot">
          The ground rules, scoring and submission steps are the same for every track &mdash;
          they live in <Link href="/#rules">&sect;03</Link>, <Link href="/#scoring">&sect;04</Link>{" "}
          and <Link href="/#submit">&sect;05</Link> of the brief.
        </p>
      </main>
    </div>
  );
}
