/**
 * Everything you need to change before sending this brief to a candidate.
 * Nothing else in the project hard-codes these values.
 */
export const site = {
  company: "Your Company",
  role: "Full-Stack Developer",
  revision: "rev 2026.1",

  /** Where candidates send their repository link. */
  contactEmail: "careers@example.com",
  /** GitHub handle candidates invite to a private repo. */
  reviewerHandle: "@your-org-reviewer",
  /** Subject line we ask candidates to use. */
  emailSubject: "Full-Stack Take-Home — Your Name",

  /** The starter candidates build on. It sits at the root of its own repo. */
  starterRepo: "https://github.com/Trust-cpu/temple_test",
  /** The directory a clone creates — used for the cd line and the layout tree. */
  starterDir: "temple_test/",
  starterRuntime: "Node 24+",

  /**
   * Hard deadline, not a target. The clock starts when the brief is sent and
   * does not pause; `window` keeps the " from receipt" suffix because §03
   * strips it when quoting the duration on its own.
   */
  effort: "8 hours",
  window: "8 hours from receipt",
  /** Git tag we review. */
  submissionTag: "v1.0-submission",

  /** Review turnaround promised in §05. */
  acknowledgeWithin: "2 working days",
  reviewWithin: "5 working days",
  walkthroughMinutes: 60,
} as const;

export const sections = [
  { id: "base", sig: "§01", title: "The base project" },
  { id: "problems", sig: "§02", title: "The three problems" },
  { id: "rules", sig: "§03", title: "Ground rules" },
  { id: "scoring", sig: "§04", title: "How we score it" },
  { id: "submit", sig: "§05", title: "Submitting" },
  { id: "faq", sig: "§06", title: "Questions" },
] as const;

export type SectionId = (typeof sections)[number]["id"];

export function sectionOf(id: SectionId) {
  const found = sections.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown section: ${id}`);
  return found;
}
