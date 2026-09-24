import { icoIconResponse } from "@/lib/brand-icon";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export function GET() {
  return icoIconResponse();
}
