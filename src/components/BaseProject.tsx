import { Section, Ticks } from "@/components/Section";
import { site } from "@/config/site";
import { baseProject } from "@/content/assessment";

export function BaseProject() {
  return (
    <Section id="base" lede={baseProject.lede}>
      <div className="prose">
        <h3>Get it running</h3>
        <p className="sec-note">{baseProject.runNote}</p>
      </div>
      <pre>{baseProject.run}</pre>

      <div className="prose">
        <h3>What the starter already does</h3>
        <Ticks items={baseProject.included} />

        <h3>What it deliberately does not do</h3>
        <p className="sec-note">
          These are decisions, not oversights. Each one is somewhere a problem attaches.
        </p>
        <Ticks items={baseProject.omitted} />
      </div>

      <h3>The schema you inherit</h3>
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

      <h3>The API you inherit</h3>
      <p className="sec-note">{baseProject.apiNote}</p>
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
            {/* A path alone is not unique: GET and POST /lists are different rows. */}
            {baseProject.endpoints.map((row) => (
              <tr key={`${row.method} ${row.path}`}>
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

      <h3>How it is laid out</h3>
      <p className="sec-note">{baseProject.repoNote}</p>
      <pre>
        <b>{site.starterDir}</b>
        {"\n  migrations/          "}
        <span className="c">&mdash; numbered SQL, applied on boot</span>
        {"\n  src/\n    config.js          "}
        <span className="c">&mdash; every environment-dependent value, resolved once</span>
        {"\n    server.js          "}
        <span className="c">&mdash; entry point</span>
        {"\n    app.js             "}
        <span className="c">&mdash; routes &rarr; static files &rarr; 404</span>
        {"\n    domain/            "}
        <span className="c">&mdash; pure logic: no database, no HTTP </span>
        <b>&larr; Problem 1 belongs here</b>
        {"\n    db/\n      migrate.js       "}
        <span className="c">&mdash; the migration runner</span>
        {"\n      repositories/    "}
        <span className="c">&mdash; all SQL, one file per table</span>
        {"\n        access.js      "}
        <span className="c">&mdash; the single authorisation seam </span>
        <b>&larr; Problem 3</b>
        {"\n    http/              "}
        <span className="c">&mdash; router, middleware, responses, routes/</span>
        {"\n  public/              "}
        <span className="c">&mdash; framework-free web client </span>
        <b>&larr; Problem 2</b>
        {"\n  tests/               "}
        <span className="c">&mdash; domain.test.js (pure) and api.test.js (real HTTP)</span>
      </pre>

      <div className="prose">
        <p className="hint" style={{ marginTop: 18 }}>
          Two rules keep it navigable and are worth keeping: all SQL lives in{" "}
          <code>db/repositories/</code>, and <code>domain/</code> imports nothing from{" "}
          <code>http/</code> or <code>db/</code>.
        </p>
      </div>
    </Section>
  );
}
