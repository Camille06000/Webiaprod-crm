import { NextResponse } from "next/server";
import { scrapeGoogleMaps, scrapeGoogleMapsRaw } from "@/lib/apify";
import { createLead, listLeads } from "@/lib/repo";

export const dynamic = "force-dynamic";
// Apify peut prendre 2-4 minutes pour un gros scrape.
export const maxDuration = 300;

interface Body {
  ville?: string;
  secteur?: string;
  maxResults?: number;
  dryRun?: boolean;
  raw?: boolean;
}

export async function POST(req: Request) {
  // Auth basique : exige le CRON_SECRET en Bearer (même secret que le cron quotidien)
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "json invalide" }, { status: 400 });
  }

  const ville = body.ville?.trim();
  const secteur = body.secteur?.trim();
  if (!ville || !secteur) {
    return NextResponse.json({ error: "ville et secteur requis" }, { status: 400 });
  }

  const maxResults = Math.min(Math.max(1, body.maxResults ?? 50), 200);

  // Mode debug : renvoie la structure brute Apify d'un seul lead pour inspection.
  if (body.raw) {
    try {
      const raw = await scrapeGoogleMapsRaw({ ville, secteur, maxResults: Math.min(maxResults, 3) });
      return NextResponse.json({
        count: raw.length,
        first_keys: raw[0] ? Object.keys(raw[0]) : [],
        first: raw[0] ?? null,
      });
    } catch (err) {
      return NextResponse.json({ error: "apify failure", details: (err as Error).message }, { status: 502 });
    }
  }

  let scraped;
  try {
    scraped = await scrapeGoogleMaps({ ville, secteur, maxResults });
  } catch (err) {
    return NextResponse.json(
      { error: "apify failure", details: (err as Error).message },
      { status: 502 }
    );
  }

  if (body.dryRun) {
    return NextResponse.json({ scraped: scraped.length, sample: scraped.slice(0, 5) });
  }

  // Dédup contre la base : email OR site OR (entreprise+ville+secteur)
  const existing = await listLeads();
  const seenEmails = new Set(existing.map((l) => l.email?.toLowerCase()).filter(Boolean));
  const seenSites = new Set(existing.map((l) => l.site?.toLowerCase()).filter(Boolean));
  const seenNames = new Set(
    existing.map((l) => `${l.entreprise.toLowerCase()}|${l.ville.toLowerCase()}|${l.secteur.toLowerCase()}`)
  );

  let created = 0;
  let skippedNoEmail = 0;
  let skippedDuplicate = 0;
  const insertedSamples: Array<{ entreprise: string; score: number; status: string }> = [];

  for (const s of scraped) {
    if (!s.entreprise) continue;
    if (!s.email) {
      skippedNoEmail++;
      continue;
    }
    const emailKey = s.email.toLowerCase();
    const siteKey = s.site?.toLowerCase() ?? null;
    const nameKey = `${s.entreprise.toLowerCase()}|${ville.toLowerCase()}|${secteur.toLowerCase()}`;

    if (seenEmails.has(emailKey)) { skippedDuplicate++; continue; }
    if (siteKey && seenSites.has(siteKey)) { skippedDuplicate++; continue; }
    if (seenNames.has(nameKey)) { skippedDuplicate++; continue; }

    // Heuristique scoring auto (les bool seront vrais si l'info Apify est présente)
    const isEmailPro = /^[^@]+@[^@]+\.[a-z]{2,}$/i.test(s.email) && !/gmail|yahoo|hotmail|outlook/i.test(s.email);
    const siteActif = !!s.site;
    const descClaire = !!s.description && s.description.length > 30;
    const gbpRempli = !!(s.note_google && s.nb_avis && s.telephone && s.description);

    const lead = await createLead({
      entreprise: s.entreprise,
      secteur,
      ville,
      quartier: s.quartier,
      email: s.email,
      telephone: s.telephone,
      site: s.site,
      note_google: s.note_google,
      nb_avis: s.nb_avis,
      email_pro_verifiable: isEmailPro ? 1 : 0,
      site_actif: siteActif ? 1 : 0,
      description_claire: descClaire ? 1 : 0,
      gbp_bien_rempli: gbpRempli ? 1 : 0,
      // top10_google et visible_chatgpt sont à valider à la main (pas scrappables fiables)
      top10_google: 0,
      visible_chatgpt: 0,
      raison_fit: s.description?.slice(0, 200) ?? null,
    });

    seenEmails.add(emailKey);
    if (siteKey) seenSites.add(siteKey);
    seenNames.add(nameKey);

    created++;
    if (insertedSamples.length < 5) {
      insertedSamples.push({ entreprise: lead.entreprise, score: lead.score, status: lead.status });
    }
  }

  return NextResponse.json({
    ok: true,
    ville,
    secteur,
    scraped: scraped.length,
    created,
    skipped_no_email: skippedNoEmail,
    skipped_duplicate: skippedDuplicate,
    samples: insertedSamples,
  });
}
