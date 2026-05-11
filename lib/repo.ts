import { getDb } from "./db";
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

const FIELDS = [
  "entreprise",
  "secteur",
  "ville",
  "quartier",
  "email",
  "telephone",
  "site",
  "note_google",
  "nb_avis",
  "top10_google",
  "visible_chatgpt",
  "email_pro_verifiable",
  "site_actif",
  "description_claire",
  "gbp_bien_rempli",
  "raison_fit",
  "accroche",
  "objet_email",
  "gmail_draft_id",
  "date_contact",
  "date_derniere_action",
  "date_prochaine_action",
  "prochaine_action_type",
  "offre_acceptee",
  "date_signature",
  "montant_encaisse",
  "status",
] as const;

function coerce(input: LeadInput) {
  const out: Record<string, unknown> = { ...input };
  for (const f of BOOL_FIELDS) {
    if (out[f] !== undefined) out[f] = out[f] ? 1 : 0;
  }
  return out;
}

export function listLeads(): Lead[] {
  return getDb().prepare("SELECT * FROM leads ORDER BY score DESC, updated_at DESC").all() as Lead[];
}

export function getLead(id: number): Lead | undefined {
  return getDb().prepare("SELECT * FROM leads WHERE id = ?").get(id) as Lead | undefined;
}

export function createLead(input: LeadInput): Lead {
  const db = getDb();
  const data = coerce(input);
  const score = computeScore({ ...input });
  let status: ColumnId = (data.status as ColumnId) ?? "nouveaux";
  if (shouldBePasFit(score)) status = "pas_fit";

  const next = recommendForLead({ status });

  const cols = [...FIELDS, "score"];
  const vals = cols.map((c) => {
    if (c === "score") return score;
    if (c === "status") return status;
    if (c === "date_prochaine_action" && next) return next.date;
    if (c === "prochaine_action_type" && next) return next.type;
    return (data as Record<string, unknown>)[c] ?? null;
  });

  const placeholders = cols.map(() => "?").join(", ");
  const sql = `INSERT INTO leads (${cols.join(", ")}) VALUES (${placeholders})`;
  const info = db.prepare(sql).run(...vals);
  return getLead(Number(info.lastInsertRowid))!;
}

export function updateLead(id: number, patch: LeadInput): Lead | undefined {
  const db = getDb();
  const existing = getLead(id);
  if (!existing) return undefined;
  const data = coerce(patch);

  const merged: Partial<Lead> = { ...existing, ...(data as Partial<Lead>) };
  const newScore = computeScore(merged);

  // Recompute pas_fit only when relevant inputs changed and status not explicitly set
  let newStatus: ColumnId = (data.status as ColumnId) ?? existing.status;
  if (!("status" in patch)) {
    if (shouldBePasFit(newScore) && existing.status === "nouveaux") {
      newStatus = "pas_fit";
    }
  }

  // If status changed, recompute next action
  let next: { date: string; type: string } | null = null;
  if (newStatus !== existing.status) {
    const r = recommendForLead({ status: newStatus });
    next = r ? { date: r.date, type: r.type } : null;
  }

  const updatable = FIELDS.filter((f) => f in data || f === "status");
  if (next) {
    updatable.push("date_prochaine_action", "prochaine_action_type");
  }

  const setClauses: string[] = [];
  const vals: unknown[] = [];
  for (const f of updatable) {
    setClauses.push(`${f} = ?`);
    if (f === "status") vals.push(newStatus);
    else if (f === "date_prochaine_action" && next) vals.push(next.date);
    else if (f === "prochaine_action_type" && next) vals.push(next.type);
    else vals.push((data as Record<string, unknown>)[f] ?? null);
  }
  setClauses.push("score = ?");
  vals.push(newScore);
  setClauses.push("updated_at = datetime('now')");

  vals.push(id);
  db.prepare(`UPDATE leads SET ${setClauses.join(", ")} WHERE id = ?`).run(...vals);
  return getLead(id);
}

export function moveLead(id: number, status: ColumnId): Lead | undefined {
  const existing = getLead(id);
  if (!existing) return undefined;
  const patch: LeadInput = { status, date_derniere_action: new Date().toISOString().slice(0, 10) };
  if (status === "closes") {
    patch.offre_acceptee = "early_bird";
    patch.montant_encaisse = 500;
    patch.date_signature = new Date().toISOString().slice(0, 10);
  }
  return updateLead(id, patch);
}

export function deleteLead(id: number): boolean {
  const info = getDb().prepare("DELETE FROM leads WHERE id = ?").run(id);
  return info.changes > 0;
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

export function listZones(): ZoneRow[] {
  const rows = getDb()
    .prepare(
      `SELECT ville, secteur,
        SUM(CASE WHEN status = 'closes' THEN 1 ELSE 0 END) AS signes,
        SUM(CASE WHEN status = 'demo' THEN 1 ELSE 0 END) AS demos_en_cours,
        SUM(CASE WHEN status IN ('contactes','interesses') THEN 1 ELSE 0 END) AS contactes_en_cours,
        COUNT(*) AS total
       FROM leads
       WHERE ville <> '' AND secteur <> ''
       GROUP BY ville, secteur
       ORDER BY signes DESC, ville ASC, secteur ASC`
    )
    .all() as Array<Omit<ZoneRow, "statut">>;
  return rows.map((r) => ({
    ...r,
    statut: r.signes >= 3 ? "FERME" : "OUVERT",
  }));
}

export function leadsInZone(ville: string, secteur: string): Lead[] {
  return getDb()
    .prepare("SELECT * FROM leads WHERE ville = ? AND secteur = ? ORDER BY score DESC")
    .all(ville, secteur) as Lead[];
}

export function metrics() {
  const db = getDb();
  const total = (db.prepare("SELECT COUNT(*) AS n FROM leads").get() as { n: number }).n;
  const earlyBirdSignes = (db.prepare("SELECT COUNT(*) AS n FROM leads WHERE status = 'closes'").get() as { n: number }).n;
  const demosEnCours = (db.prepare("SELECT COUNT(*) AS n FROM leads WHERE status = 'demo'").get() as { n: number }).n;
  const contactes = (db.prepare("SELECT COUNT(*) AS n FROM leads WHERE status IN ('contactes','interesses','demo','closes')").get() as { n: number }).n;
  const demosBookeesTotal = (db.prepare("SELECT COUNT(*) AS n FROM leads WHERE status IN ('demo','closes')").get() as { n: number }).n;
  const cashTotalRow = db.prepare("SELECT COALESCE(SUM(montant_encaisse),0) AS total FROM leads WHERE status = 'closes'").get() as { total: number };

  const tauxContactDemo = contactes > 0 ? Math.round((demosBookeesTotal / contactes) * 100) : 0;
  const tauxDemoClient = demosBookeesTotal > 0 ? Math.round((earlyBirdSignes / demosBookeesTotal) * 100) : 0;

  const earlyBirdGoal = 50;
  return {
    total,
    earlyBirdSignes,
    earlyBirdGoal,
    earlyBirdRestants: Math.max(0, earlyBirdGoal - earlyBirdSignes),
    earlyBirdTermine: earlyBirdSignes >= earlyBirdGoal,
    cashTotal: cashTotalRow.total,
    mrrEquivalent: Math.round(earlyBirdSignes * 41.67 * 100) / 100,
    demosEnCours,
    tauxContactDemo,
    tauxDemoClient,
  };
}
