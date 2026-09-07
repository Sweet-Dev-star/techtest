import { Section, Ticks } from "@/components/Section";
import { problems, problemsLede, type Problem } from "@/content/assessment";

function ProblemBrief({ problem }: { problem: Problem }) {
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

export function Problems() {
  return (
    <Section id="problems" lede={problemsLede}>
      <div className="problems">
        {problems.map((problem) => (
          <ProblemBrief key={problem.id} problem={problem} />
        ))}
      </div>
    </Section>
  );
}
