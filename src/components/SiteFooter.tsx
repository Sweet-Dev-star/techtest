import { site } from "@/config/site";

export function SiteFooter() {
  return (
    <footer>
      <div className="foot-inner">
        <span>
          Full-Stack Take-Home &middot; {site.revision}
        </span>
        <span>
          Questions: <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
        </span>
        <span>
          Est. {site.effort} &middot; {site.window}
        </span>
      </div>
    </footer>
  );
}
