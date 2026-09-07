import { Section, Ticks } from "@/components/Section";
import { baseProject } from "@/content/assessment";

export function BaseProject() {
  return (
    <Section id="base" lede={baseProject.lede}>
      <div className="prose">
        <h3>Baseline behaviour</h3>
        <Ticks items={baseProject.baseline} />
      </div>

      <h3>Starting schema</h3>
      <p className="sec-note">{baseProject.schemaNote}</p>
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th scope="col">Table</th>
              <th scope="col">Columns</th>
              <th scope="col">Notes</th>
            </tr>
          </thead>
          <tbody>
            {baseProject.schema.map((row) => (
              <tr key={row.table}>
                <td className="k">{row.table}</td>
                <td className="k">{row.columns}</td>
                <td>{row.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>Starting endpoints</h3>
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th scope="col">Method</th>
              <th scope="col">Path</th>
              <th scope="col">Does</th>
            </tr>
          </thead>
          <tbody>
            {baseProject.endpoints.map((row) => (
              <tr key={row.path}>
                <td className="k">
                  <span className="verb">{row.method}</span>
                </td>
                <td className="k">{row.path}</td>
                <td>{row.does}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>Repository shape</h3>
      <p className="sec-note">{baseProject.repoNote}</p>
      <pre>
        <b>task-manager/</b>
        {"\n  README.md          "}
        <span className="c">&mdash; run it in one command</span>
        {"\n  DECISIONS.md       "}
        <span className="c">&mdash; what you chose, what you rejected, what you&rsquo;d fix</span>
        {"\n  .env.example       "}
        <span className="c">&mdash; every variable, no real secrets</span>
        {"\n  docker-compose.yml "}
        <span className="c">&mdash; optional, but reviewers love it</span>
        {"\n  "}
        <b>server/</b>
        {"\n    src/domain/      "}
        <span className="c">
          &mdash; recurrence rules, permission checks: no framework imports
        </span>
        {"\n    src/http/        "}
        <span className="c">&mdash; routes, validation, serialisation</span>
        {"\n    src/db/          "}
        <span className="c">&mdash; migrations, queries</span>
        {"\n    tests/\n  "}
        <b>client/</b>
        {"\n    src/features/    "}
        <span className="c">&mdash; tasks, lists, sharing</span>
        {"\n    src/sync/        "}
        <span className="c">&mdash; the offline queue from Problem 2</span>
        {"\n    tests/"}
      </pre>
    </Section>
  );
}
