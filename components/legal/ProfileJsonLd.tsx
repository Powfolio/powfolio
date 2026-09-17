import { SITE_NAME } from "@/lib/site";

export default function ProfileJsonLd({
  name,
  username,
  url,
  description,
  image,
}: {
  name: string;
  username: string;
  url: string;
  description?: string | null;
  image?: string | null;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `${name} | ${SITE_NAME}`,
    url,
    mainEntity: {
      "@type": "Person",
      name,
      alternateName: `@${username}`,
      url,
      ...(description ? { description } : {}),
      ...(image ? { image } : {}),
    },
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
