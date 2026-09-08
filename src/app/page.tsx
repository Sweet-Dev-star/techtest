import { BaseProject } from "@/components/BaseProject";
import { ContentsRail } from "@/components/ContentsRail";
import { Faq } from "@/components/Faq";
import { GroundRules } from "@/components/GroundRules";
import { Masthead } from "@/components/Masthead";
import { Problems } from "@/components/ProblemBrief";
import { Scoring } from "@/components/Scoring";
import { SiteFooter } from "@/components/SiteFooter";
import { Submission } from "@/components/Submission";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";

// The brief is for signed-in candidates only. A visitor without a session is
// sent to the login window rather than shown the problems. Reading the cookie
// also makes this page render per-request rather than static.
export default async function AssessmentPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

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
