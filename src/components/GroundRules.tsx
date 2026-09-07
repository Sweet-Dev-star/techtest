import { Section, Steps } from "@/components/Section";
import { groundRules } from "@/content/assessment";

export function GroundRules() {
  const { ruleZero } = groundRules;

  return (
    <Section id="rules" lede={groundRules.lede}>
      <aside className="rule0" aria-labelledby="rule-zero-title">
        <p className="eyebrow">{ruleZero.eyebrow}</p>
        <h3 id="rule-zero-title">{ruleZero.title}</h3>
        {ruleZero.body.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}

        <div className="split">
          <div className="allowed">
            <h4>Fine to use</h4>
            <ul>
              {ruleZero.allowed.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="forbidden">
            <h4>Not for this assessment</h4>
            <ul>
              {ruleZero.forbidden.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <p>{ruleZero.enforcement}</p>
      </aside>

      <div className="prose">
        <h3>The rest</h3>
        <Steps items={groundRules.rest} />
      </div>
    </Section>
  );
}
