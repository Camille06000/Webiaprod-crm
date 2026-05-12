import { NextResponse } from "next/server";
import { closeOutZone, leadsInZone } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { ville, secteur } = await req.json();
  if (!ville || !secteur) {
    return NextResponse.json({ error: "ville et secteur requis" }, { status: 400 });
  }
  const { updated } = await closeOutZone(ville, secteur);
  return NextResponse.json({ updated, leads: await leadsInZone(ville, secteur) });
}
