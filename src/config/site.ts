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

  /** The starter candidates build on. */
  starterRepo: "https://github.com/Sweet-Dev-star/techtest",
  starterDir: "basic/",
  starterRuntime: "Node 24+",

  /**
   * Time budget shown in the spec strip and the ground rules.
   * The baseline is provided, so this is the budget for the three problems.
   */
  effort: "10–14 hours",
  window: "7 days from receipt",
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
