import { pngIconResponse } from "@/lib/brand-icon";

export const runtime = "edge";

export function GET() {
  return pngIconResponse();
}
