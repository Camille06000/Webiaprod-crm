import { NextResponse } from "next/server";
import { listLeads, listZones, metrics } from "@/lib/repo";

export const dynamic = "force-dynamic";

// Protected daily endpoint, called by Vercel Cron at 09:00 Europe/Paris.
// Returns today's snapshot for the prospection orchestrator (Apify scrape,
// Gmail drafts, email recap) to consume. Requires header
// `Authorization: Bearer ${CRON_SECRET}` set as env on Vercel.
export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const [m, zones, leads] = await Promise.all([metrics(), listZones(), listLeads()]);

  // Pick the "active" zone = first OUVERT with the most contactes_en_cours,
  // fallback first OUVERT, fallback none.
  const ouvertes = zones.filter((z) => z.statut === "OUVERT");
  const zoneActive =
    ouvertes.sort((a, b) => b.contactes_en_cours - a.contactes_en_cours)[0] ?? null;

  const dueToday = new Date().toISOString().slice(0, 10);
  const aRelancer = leads.filter(
    (l) => l.date_prochaine_action && l.date_prochaine_action <= dueToday && !["closes", "pas_fit", "pas_interesse", "concurrent"].includes(l.status)
  );

  const top3 = leads
    .filter((l) => ["nouveaux", "contactes", "interesses"].includes(l.status))
    .slice(0, 3)
    .map((l) => ({ id: l.id, entreprise: l.entreprise, score: l.score, accroche: l.accroche }));

  return NextResponse.json({
    date: dueToday,
    metrics: m,
    zone_active: zoneActive,
    zones_fermees: zones.filter((z) => z.statut === "FERME"),
    leads_a_relancer: aRelancer.map((l) => ({
      id: l.id, entreprise: l.entreprise, status: l.status, ville: l.ville, secteur: l.secteur,
      score: l.score, date_prochaine_action: l.date_prochaine_action,
    })),
    top3,
  });
}
