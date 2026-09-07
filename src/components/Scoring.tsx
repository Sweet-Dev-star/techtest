import { Section, Ticks } from "@/components/Section";
import { scoring } from "@/content/assessment";

export function Scoring() {
  return (
    <Section id="scoring" lede={scoring.lede}>
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th scope="col">Criterion</th>
              <th scope="col">What earns the marks</th>
              <th scope="col" className="w">
                Weight
              </th>
            </tr>
          </thead>
          <tbody>
            {scoring.rubric.map((row) => (
              <tr key={row.criterion}>
                <td className="k">{row.criterion}</td>
                <td>{row.detail}</td>
                <td className="w">{row.weight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="prose">
        <h3>What consistently separates candidates</h3>
        <Ticks items={scoring.separators} />
      </div>
    </Section>
  );
}
