# Full-Stack Take-Home — assessment site

The brief we send to full-stack candidates: one task-manager project, three graded
problems inside it, the hand-written-code rule, scoring, and GitHub submission steps.

Next.js 16 (App Router) + React 19 + TypeScript. Statically prerendered — it builds to
plain HTML and can be hosted anywhere.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm start          # serve the production build
```

## Before you send it to anyone

Everything you need to change is in [`src/config/site.ts`](src/config/site.ts):

| Field | Currently | What it is |
| --- | --- | --- |
| `company`, `role` | `Your Company`, `Full-Stack Developer` | Shown in the masthead crumb and metadata |
| `contactEmail` | `careers@example.com` | Appears in the rail, §05 and the footer |
| `reviewerHandle` | `@your-org-reviewer` | GitHub handle candidates invite to a private repo |
| `effort`, `window` | `10–14 hours`, `7 days from receipt` | Time budget, in the spec strip and §03 |
| `submissionTag` | `v1.0-submission` | Git tag we review |
| `acknowledgeWithin`, `reviewWithin`, `walkthroughMinutes` | 2 days / 5 days / 60 min | The turnaround promised in §05 |

The page is `noindex` by default (`metadata.robots` in
[`src/app/layout.tsx`](src/app/layout.tsx)) on the assumption you send the link directly
to candidates. Remove that if you want it indexed.

## Where things live

```
src/
  app/
    layout.tsx        fonts, metadata, no-flash theme script
    page.tsx          section order — the whole page assembly
    globals.css       the entire design system: tokens first, components after
  config/
    site.ts           placeholders + the § section list (single source of numbering)
  content/
    assessment.tsx    ALL candidate-facing copy, as typed JSX
  components/
    Section.tsx       numbered <section>, plus Ticks / Steps list primitives
    Masthead.tsx      crumbs, headline, deck, spec strip
    ContentsRail.tsx  sticky ToC with scroll-spy          (client)
    BaseProject.tsx   §01 — baseline, schema, endpoints, repo tree
    ProblemBrief.tsx  §02 — the three problems
    GroundRules.tsx   §03 — rule 0 and the rest
    Scoring.tsx       §04 — rubric
    Submission.tsx    §05 — steps + checklist
    Checklist.tsx     persistent pre-flight checklist      (client)
    Faq.tsx           §06
    SiteFooter.tsx
  lib/
    browserStore.ts   localStorage as an external store, with a memory fallback
```

**To change wording**, edit `src/content/assessment.tsx` — no component holds a sentence.
**To add or reorder a section**, add it to `sections` in `src/config/site.ts` (the rail,
the § numbers and the headings all read from that one list) and drop the component into
`src/app/page.tsx`.

## Design notes

- **Palette**: drafting/spec-sheet — grey-green paper, drafting blue for structure, one
  amber signal reserved for Rule 0 (the hand-written-code rule) so it is the only thing on
  the page shouting.
- **Type**: Archivo (headings, UI), Source Serif 4 (prose), IBM Plex Mono (labels, schema,
  endpoints). Self-hosted via `next/font` — no external font requests at runtime.
- **Themes**: light and dark are both defined at token level. The OS preference wins by
  default; the masthead toggle overrides it and persists per browser. An inline script in
  `layout.tsx` applies the stored choice before first paint.
- Only three components are client components: the theme toggle, the scroll-spy rail and
  the checklist. Everything else is server-rendered.
