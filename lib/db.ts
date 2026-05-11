import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "crm.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  _db = db;
  return db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    CREATE INDEX IF NOT EXISTS idx_leads_ville_secteur ON leads(ville, secteur);
  `);
}
