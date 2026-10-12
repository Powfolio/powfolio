import { NextResponse } from "next/server";
import { loadSiteBrand } from "@/lib/site-brand";

export const runtime = "nodejs";

export async function GET() {
  const brand = await loadSiteBrand();
  return NextResponse.json(brand, { headers: { "Cache-Control": "public, max-age=30" } });
}
