import { Section } from "@/components/Section";
import { faq } from "@/content/assessment";

export function Faq() {
  return (
    <Section id="faq">
      <div className="faq">
        {faq.map((entry, i) => (
          <details key={entry.q} open={i === 0}>
            <summary>{entry.q}</summary>
            <div className="answer">{entry.a}</div>
          </details>
        ))}
      </div>
    </Section>
  );
}
