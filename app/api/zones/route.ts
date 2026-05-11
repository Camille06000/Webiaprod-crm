import { NextResponse } from "next/server";
import { leadsInZone, listZones } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ville = url.searchParams.get("ville");
  const secteur = url.searchParams.get("secteur");
  if (ville && secteur) {
    return NextResponse.json({ leads: leadsInZone(ville, secteur) });
  }
  return NextResponse.json({ zones: listZones() });
}
