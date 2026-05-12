import postgres from "postgres";

let _sql: ReturnType<typeof postgres> | null = null;
let _migrated = false;

export function getSql() {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL manquant. Configure-le dans .env.local (dev) ou dans les variables d'env du serveur (prod)."
    );
  }
  _sql = postgres(url, {
    prepare: false,
    ssl: url.includes("sslmode=require") ? "require" : (url.startsWith("postgres://localhost") || url.startsWith("postgres://127.0.0.1") ? false : "prefer"),
    max: 10,
    idle_timeout: 20,
  });
  return _sql;
}

export async function ensureSchema(): Promise<void> {
  if (_migrated) return;
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      entreprise TEXT NOT NULL,
      secteur TEXT NOT NULL DEFAULT '',
      ville TEXT NOT NULL DEFAULT '',
      quartier TEXT,
      email TEXT,
      telephone TEXT,
      site TEXT,
      note_google REAL,
      nb_avis INTEGER,
      top10_google INTEGER NOT NULL DEFAULT 0,
      visible_chatgpt INTEGER NOT NULL DEFAULT 0,
      email_pro_verifiable INTEGER NOT NULL DEFAULT 0,
      site_actif INTEGER NOT NULL DEFAULT 0,
      description_claire INTEGER NOT NULL DEFAULT 0,
      gbp_bien_rempli INTEGER NOT NULL DEFAULT 0,
      score INTEGER NOT NULL DEFAULT 0,
      raison_fit TEXT,
      accroche TEXT,
      objet_email TEXT,
      gmail_draft_id TEXT,
      date_contact TEXT,
      date_derniere_action TEXT,
      date_prochaine_action TEXT,
      prochaine_action_type TEXT,
      offre_acceptee TEXT,
      date_signature TEXT,
      montant_encaisse REAL,
      status TEXT NOT NULL DEFAULT 'nouveaux',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_leads_ville_secteur ON leads(ville, secteur)`;
  _migrated = true;
}
