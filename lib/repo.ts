import { ensureSchema, getSql } from "./db";
import type { Lead, LeadInput } from "./types";
import { computeScore, shouldBePasFit } from "./scoring";
import { recommendForLead } from "./actions";
import type { ColumnId } from "./columns";

const BOOL_FIELDS = [
  "top10_google",
  "visible_chatgpt",
  "email_pro_verifiable",
  "site_actif",
  "description_claire",
  "gbp_bien_rempli",
] as const;

function coerce(input: LeadInput) {
  const out: Record<string, unknown> = { ...input };
  for (const f of BOOL_FIELDS) {
    if (out[f] !== undefined) out[f] = out[f] ? 1 : 0;
  }
  return out;
}

function row(r: Record<string, unknown>): Lead {
  return r as unknown as Lead;
}

export async function listLeads(): Promise<Lead[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`SELECT * FROM leads ORDER BY score DESC, updated_at DESC`;
  return (rows as Record<string, unknown>[]).map(row);
}

export async function getLead(id: number): Promise<Lead | undefined> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`SELECT * FROM leads WHERE id = ${id}`;
  const arr = rows as Record<string, unknown>[];
  return arr.length ? row(arr[0]) : undefined;
}

export async function createLead(input: LeadInput): Promise<Lead> {
  await ensureSchema();
  const sql = getSql();
  const data = coerce(input);
  const score = computeScore({ ...input });
  let status: ColumnId = (data.status as ColumnId) ?? "nouveaux";
  if (shouldBePasFit(score)) status = "pas_fit";

  const next = recommendForLead({ status });
  // postgres.js infère les types des params depuis le premier appel ; on relâche pour les valeurs nullable hétérogènes.
  const v = (k: string): string | number | null => {
    const x = (data as Record<string, unknown>)[k];
    return (x ?? null) as string | number | null;
  };

  const rows = await sql`
    INSERT INTO leads (
      entreprise, secteur, ville, quartier, email, telephone, site,
      note_google, nb_avis,
      top10_google, visible_chatgpt, email_pro_verifiable, site_actif,
      description_claire, gbp_bien_rempli,
      score, raison_fit, accroche, objet_email, gmail_draft_id,
      date_contact, date_derniere_action, date_prochaine_action, prochaine_action_type,
      offre_acceptee, date_signature, montant_encaisse, status
    ) VALUES (
      ${v("entreprise") ?? ""}, ${v("secteur") ?? ""}, ${v("ville") ?? ""}, ${v("quartier")},
      ${v("email")}, ${v("telephone")}, ${v("site")},
      ${v("note_google")}, ${v("nb_avis")},
      ${(data as Record<string, number>)["top10_google"] ?? 0},
      ${(data as Record<string, number>)["visible_chatgpt"] ?? 0},
      ${(data as Record<string, number>)["email_pro_verifiable"] ?? 0},
      ${(data as Record<string, number>)["site_actif"] ?? 0},
      ${(data as Record<string, number>)["description_claire"] ?? 0},
      ${(data as Record<string, number>)["gbp_bien_rempli"] ?? 0},
      ${score}, ${v("raison_fit")}, ${v("accroche")}, ${v("objet_email")}, ${v("gmail_draft_id")},
      ${v("date_contact")}, ${v("date_derniere_action")},
      ${next?.date ?? v("date_prochaine_action")},
      ${next?.type ?? v("prochaine_action_type")},
      ${v("offre_acceptee")}, ${v("date_signature")}, ${v("montant_encaisse")},
      ${status}
    )
    RETURNING *
  `;
  return row((rows as Record<string, unknown>[])[0]);
}

export async function updateLead(id: number, patch: LeadInput): Promise<Lead | undefined> {
  await ensureSchema();
  const sql = getSql();
  const existing = await getLead(id);
  if (!existing) return undefined;
  const data = coerce(patch);

  const merged: Partial<Lead> = { ...existing, ...(data as Partial<Lead>) };
  const newScore = computeScore(merged);

  let newStatus: ColumnId = (data.status as ColumnId) ?? existing.status;
  if (!("status" in patch)) {
    if (shouldBePasFit(newScore) && existing.status === "nouveaux") {
      newStatus = "pas_fit";
    }
  }

  let nextDate: string | null = existing.date_prochaine_action;
  let nextType: string | null = existing.prochaine_action_type;
  if (newStatus !== existing.status) {
    const r = recommendForLead({ status: newStatus });
    nextDate = r?.date ?? null;
    nextType = r?.type ?? null;
  }
  if ("date_prochaine_action" in patch) nextDate = (patch as Record<string, string | null>).date_prochaine_action ?? null;
  if ("prochaine_action_type" in patch) nextType = (patch as Record<string, string | null>).prochaine_action_type ?? null;

  const pick = <K extends keyof Lead>(k: K, fallback: Lead[K]): string | number | null => {
    const x = k in data ? (data as Record<string, unknown>)[k as string] : fallback;
    return (x ?? null) as string | number | null;
  };

  const rows = await sql`
    UPDATE leads SET
      entreprise = ${pick("entreprise", existing.entreprise)},
      secteur = ${pick("secteur", existing.secteur)},
      ville = ${pick("ville", existing.ville)},
      quartier = ${pick("quartier", existing.quartier)},
      email = ${pick("email", existing.email)},
      telephone = ${pick("telephone", existing.telephone)},
      site = ${pick("site", existing.site)},
      note_google = ${pick("note_google", existing.note_google)},
      nb_avis = ${pick("nb_avis", existing.nb_avis)},
      top10_google = ${pick("top10_google", existing.top10_google)},
      visible_chatgpt = ${pick("visible_chatgpt", existing.visible_chatgpt)},
      email_pro_verifiable = ${pick("email_pro_verifiable", existing.email_pro_verifiable)},
      site_actif = ${pick("site_actif", existing.site_actif)},
      description_claire = ${pick("description_claire", existing.description_claire)},
      gbp_bien_rempli = ${pick("gbp_bien_rempli", existing.gbp_bien_rempli)},
      raison_fit = ${pick("raison_fit", existing.raison_fit)},
      accroche = ${pick("accroche", existing.accroche)},
      objet_email = ${pick("objet_email", existing.objet_email)},
      gmail_draft_id = ${pick("gmail_draft_id", existing.gmail_draft_id)},
      date_contact = ${pick("date_contact", existing.date_contact)},
      date_derniere_action = ${pick("date_derniere_action", existing.date_derniere_action)},
      date_prochaine_action = ${nextDate},
      prochaine_action_type = ${nextType},
      offre_acceptee = ${pick("offre_acceptee", existing.offre_acceptee)},
      date_signature = ${pick("date_signature", existing.date_signature)},
      montant_encaisse = ${pick("montant_encaisse", existing.montant_encaisse)},
      status = ${newStatus},
      score = ${newScore},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  const arr = rows as Record<string, unknown>[];
  return arr.length ? row(arr[0]) : undefined;
}

export async function moveLead(id: number, status: ColumnId): Promise<Lead | undefined> {
  const existing = await getLead(id);
  if (!existing) return undefined;
  const today = new Date().toISOString().slice(0, 10);
  const patch: LeadInput = { status, date_derniere_action: today };
  if (status === "closes") {
    patch.offre_acceptee = "early_bird";
    patch.montant_encaisse = 500;
    patch.date_signature = today;
  }
  return updateLead(id, patch);
}

export async function deleteLead(id: number): Promise<boolean> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`DELETE FROM leads WHERE id = ${id} RETURNING id`;
  return (rows as unknown[]).length > 0;
}

export interface ZoneRow {
  ville: string;
  secteur: string;
  signes: number;
  demos_en_cours: number;
  contactes_en_cours: number;
  total: number;
  statut: "OUVERT" | "FERME";
}

export async function listZones(): Promise<ZoneRow[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT ville, secteur,
      SUM(CASE WHEN status = 'closes' THEN 1 ELSE 0 END)::int AS signes,
      SUM(CASE WHEN status = 'demo' THEN 1 ELSE 0 END)::int AS demos_en_cours,
      SUM(CASE WHEN status IN ('contactes','interesses') THEN 1 ELSE 0 END)::int AS contactes_en_cours,
      COUNT(*)::int AS total
    FROM leads
    WHERE ville <> '' AND secteur <> ''
    GROUP BY ville, secteur
    ORDER BY signes DESC, ville ASC, secteur ASC
  `) as Array<Omit<ZoneRow, "statut">>;
  return rows.map((r) => ({ ...r, statut: r.signes >= 3 ? "FERME" : "OUVERT" }));
}

export async function leadsInZone(ville: string, secteur: string): Promise<Lead[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`SELECT * FROM leads WHERE ville = ${ville} AND secteur = ${secteur} ORDER BY score DESC`;
  return (rows as Record<string, unknown>[]).map(row);
}

export async function closeOutZone(ville: string, secteur: string): Promise<{ updated: number }> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    UPDATE leads
    SET status = 'concurrent',
        date_derniere_action = to_char(NOW(), 'YYYY-MM-DD'),
        updated_at = NOW()
    WHERE ville = ${ville} AND secteur = ${secteur}
      AND status IN ('contactes','interesses','nouveaux')
    RETURNING id
  `;
  return { updated: (rows as unknown[]).length };
}

export async function metrics() {
  await ensureSchema();
  const sql = getSql();
  const [{ n: total }] = (await sql`SELECT COUNT(*)::int AS n FROM leads`) as Array<{ n: number }>;
  const [{ n: earlyBirdSignes }] = (await sql`SELECT COUNT(*)::int AS n FROM leads WHERE status = 'closes'`) as Array<{ n: number }>;
  const [{ n: demosEnCours }] = (await sql`SELECT COUNT(*)::int AS n FROM leads WHERE status = 'demo'`) as Array<{ n: number }>;
  const [{ n: contactes }] = (await sql`SELECT COUNT(*)::int AS n FROM leads WHERE status IN ('contactes','interesses','demo','closes')`) as Array<{ n: number }>;
  const [{ n: demosBookeesTotal }] = (await sql`SELECT COUNT(*)::int AS n FROM leads WHERE status IN ('demo','closes')`) as Array<{ n: number }>;
  const [{ total: cashTotal }] = (await sql`SELECT COALESCE(SUM(montant_encaisse),0)::float AS total FROM leads WHERE status = 'closes'`) as Array<{ total: number }>;

  const tauxContactDemo = contactes > 0 ? Math.round((demosBookeesTotal / contactes) * 100) : 0;
  const tauxDemoClient = demosBookeesTotal > 0 ? Math.round((earlyBirdSignes / demosBookeesTotal) * 100) : 0;

  const earlyBirdGoal = 50;
  return {
    total,
    earlyBirdSignes,
    earlyBirdGoal,
    earlyBirdRestants: Math.max(0, earlyBirdGoal - earlyBirdSignes),
    earlyBirdTermine: earlyBirdSignes >= earlyBirdGoal,
    cashTotal,
    mrrEquivalent: Math.round(earlyBirdSignes * 41.67 * 100) / 100,
    demosEnCours,
    tauxContactDemo,
    tauxDemoClient,
  };
}
