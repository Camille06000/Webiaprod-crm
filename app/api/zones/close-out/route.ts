import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { leadsInZone } from "@/lib/repo";

export const dynamic = "force-dynamic";

// Marks remaining contactes/interesses leads of a closed zone as "concurrent"
export async function POST(req: Request) {
  const { ville, secteur } = await req.json();
  if (!ville || !secteur) {
    return NextResponse.json({ error: "ville et secteur requis" }, { status: 400 });
  }
  const db = getDb();
  const info = db
    .prepare(
      `UPDATE leads
       SET status = 'concurrent',
           date_derniere_action = date('now'),
           updated_at = datetime('now')
       WHERE ville = ? AND secteur = ? AND status IN ('contactes','interesses','nouveaux')`
    )
    .run(ville, secteur);
  return NextResponse.json({ updated: info.changes, leads: leadsInZone(ville, secteur) });
}
