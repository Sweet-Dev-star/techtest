import { BaseProject } from "@/components/BaseProject";
import { ContentsRail } from "@/components/ContentsRail";
import { Faq } from "@/components/Faq";
import { GroundRules } from "@/components/GroundRules";
import { Masthead } from "@/components/Masthead";
import { Problems } from "@/components/ProblemBrief";
import { Scoring } from "@/components/Scoring";
import { SiteFooter } from "@/components/SiteFooter";
import { Submission } from "@/components/Submission";

export default function AssessmentPage() {
  return (
    <>
      <a className="skip-link" href="#base">
        Skip to the brief
      </a>

      <Masthead />

      <div className="shell">
        <ContentsRail />
        <main>
          <BaseProject />
          <Problems />
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
