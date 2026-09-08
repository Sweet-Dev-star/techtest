import { BaseProject } from "@/components/BaseProject";
import { ContentsRail } from "@/components/ContentsRail";
import { Faq } from "@/components/Faq";
import { GroundRules } from "@/components/GroundRules";
import { Masthead } from "@/components/Masthead";
import { Problems } from "@/components/ProblemBrief";
import { Scoring } from "@/components/Scoring";
import { SiteFooter } from "@/components/SiteFooter";
import { Submission } from "@/components/Submission";
import { currentUser } from "@/lib/session";

// Reads the session cookie, so the page renders per-request rather than static.
export default async function AssessmentPage() {
  const user = await currentUser();

  return (
    <>
      <a className="skip-link" href="#base">
        Skip to the brief
      </a>

      <Masthead user={user} />

      <div className="shell">
        <ContentsRail />
        <main>
          <BaseProject />
          <Problems user={user} />
          <GroundRules />
          <Scoring />
          <Submission />
          <Faq />
        </main>
      </div>

      <SiteFooter />
    </>
  );
}
