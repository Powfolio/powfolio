import { FAVICON_PNG_B64 } from "@/lib/brand-icon";

export const size = { width: 96, height: 96 };
export const contentType = "image/png";

export default function Icon() {
  const bytes = Uint8Array.from(atob(FAVICON_PNG_B64), (c) => c.charCodeAt(0));
  return new Response(bytes, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600, must-revalidate",
    },
  });
}
