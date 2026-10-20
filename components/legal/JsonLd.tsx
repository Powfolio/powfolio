import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { safeJsonForScript } from "@/lib/security/safe-json";

export default function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
      },
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
      },
    ],
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonForScript(data) }} />
  );
}
