import { Checklist } from "@/components/Checklist";
import { Section, Steps, Ticks } from "@/components/Section";
import { submission } from "@/content/assessment";

export function Submission() {
  return (
    <Section id="submit" lede={submission.lede}>
      <div className="prose">
        <Steps items={submission.steps} />
      </div>

      <Checklist items={submission.checklist} />

      <div className="prose">
        <h3>After you send it</h3>
        <Ticks items={submission.afterwards} />
      </div>
    </Section>
  );
}
