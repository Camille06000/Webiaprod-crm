import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL manquant. Crée .env.local avec DATABASE_URL=... (Neon).");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

function computeScore(l) {
  let s = 0;
  if (l.email_pro_verifiable) s += 2;
  if (l.site_actif) s += 2;
  if ((l.note_google ?? 0) >= 4 && (l.nb_avis ?? 0) >= 20) s += 2;
  if (l.description_claire) s += 1;
  if (l.top10_google) s += 3;
  if (l.gbp_bien_rempli) s += 1;
  return Math.min(10, s);
}

function todayPlus(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function actionForStatus(status) {
  switch (status) {
    case "nouveaux": return { type: "valider_draft", date: todayPlus(0) };
    case "contactes": return { type: "relance_soft", date: todayPlus(3) };
    case "interesses": return { type: "relance_valeur", date: todayPlus(7) };
    case "demo": return { type: "closing", date: todayPlus(1) };
    default: return { type: null, date: null };
  }
}

await sql`
  CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    entreprise TEXT NOT NULL,
    secteur TEXT NOT NULL DEFAULT '',
    ville TEXT NOT NULL DEFAULT '',
    quartier TEXT, email TEXT, telephone TEXT, site TEXT,
    note_google REAL, nb_avis INTEGER,
    top10_google INTEGER NOT NULL DEFAULT 0,
    visible_chatgpt INTEGER NOT NULL DEFAULT 0,
    email_pro_verifiable INTEGER NOT NULL DEFAULT 0,
    site_actif INTEGER NOT NULL DEFAULT 0,
    description_claire INTEGER NOT NULL DEFAULT 0,
    gbp_bien_rempli INTEGER NOT NULL DEFAULT 0,
    score INTEGER NOT NULL DEFAULT 0,
    raison_fit TEXT, accroche TEXT, objet_email TEXT, gmail_draft_id TEXT,
    date_contact TEXT, date_derniere_action TEXT,
    date_prochaine_action TEXT, prochaine_action_type TEXT,
    offre_acceptee TEXT, date_signature TEXT, montant_encaisse REAL,
    status TEXT NOT NULL DEFAULT 'nouveaux',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;
await sql`CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`;
await sql`CREATE INDEX IF NOT EXISTS idx_leads_ville_secteur ON leads(ville, secteur)`;
await sql`DELETE FROM leads`;

const seeds = [
  {
    entreprise: "Boulangerie du Marché",
    secteur: "boulangerie", ville: "Lyon", quartier: "Croix-Rousse",
    email: "contact@boulangeriedumarche.fr", telephone: "04 78 12 34 56",
    site: "https://boulangeriedumarche.fr",
    note_google: 4.7, nb_avis: 312,
    top10_google: 1, visible_chatgpt: 0,
    email_pro_verifiable: 1, site_actif: 1, description_claire: 1, gbp_bien_rempli: 1,
    raison_fit: "Top 10 local mais invisible ChatGPT",
    accroche: "Vos concurrents apparaissent dans ChatGPT, pas vous.",
    objet_email: "Lyon · ChatGPT envoie ses clients chez vos concurrents",
    gmail_draft_id: "DRAFT-001", status: "nouveaux",
  },
  {
    entreprise: "Plomberie Express 69",
    secteur: "plombier", ville: "Lyon", quartier: "Part-Dieu",
    email: "info@plomberie-express69.fr", telephone: "04 72 00 00 01",
    site: "https://plomberie-express69.fr",
    note_google: 4.5, nb_avis: 87, top10_google: 1, visible_chatgpt: 0,
    email_pro_verifiable: 1, site_actif: 1, description_claire: 1, gbp_bien_rempli: 1,
    objet_email: "Plomberie Lyon · audit GEO offert", gmail_draft_id: "DRAFT-002",
    status: "contactes", date_contact: todayPlus(-4),
  },
  {
    entreprise: "Café des Artistes",
    secteur: "restaurant", ville: "Paris", quartier: "Montmartre",
    email: "bonjour@cafedesartistes.paris", telephone: "01 42 00 00 02",
    site: "https://cafedesartistes.paris",
    note_google: 4.8, nb_avis: 1245, top10_google: 1, visible_chatgpt: 1,
    email_pro_verifiable: 1, site_actif: 1, description_claire: 1, gbp_bien_rempli: 1,
    objet_email: "Référencement IA Paris · Early Bird 500€",
    status: "interesses", date_contact: todayPlus(-6),
  },
  {
    entreprise: "Coiffure Élégance",
    secteur: "coiffeur", ville: "Marseille", quartier: "Vieux-Port",
    email: "salon@elegance-marseille.fr", telephone: "04 91 00 00 03",
    site: "https://elegance-marseille.fr",
    note_google: 4.6, nb_avis: 198, top10_google: 1, visible_chatgpt: 0,
    email_pro_verifiable: 1, site_actif: 1, description_claire: 1, gbp_bien_rempli: 1,
    status: "demo", date_contact: todayPlus(-10),
  },
  {
    entreprise: "Garage Auto Sud",
    secteur: "garage", ville: "Marseille", quartier: "La Joliette",
    email: "contact@garage-autosud.fr", telephone: "04 91 00 00 04",
    site: "https://garage-autosud.fr",
    note_google: 4.4, nb_avis: 56, top10_google: 1, visible_chatgpt: 0,
    email_pro_verifiable: 1, site_actif: 1, description_claire: 1, gbp_bien_rempli: 1,
    status: "closes", offre_acceptee: "early_bird", montant_encaisse: 500, date_signature: todayPlus(-3),
  },
  {
    entreprise: "Pizzeria Bella",
    secteur: "restaurant", ville: "Nice", quartier: "Vieux Nice",
    email: "info@pizzeriabella.fr", telephone: "04 93 00 00 05",
    site: "https://pizzeriabella.fr",
    note_google: 4.6, nb_avis: 422, top10_google: 1, visible_chatgpt: 0,
    email_pro_verifiable: 1, site_actif: 1, description_claire: 1, gbp_bien_rempli: 1,
    status: "closes", offre_acceptee: "early_bird", montant_encaisse: 500, date_signature: todayPlus(-12),
  },
  {
    entreprise: "Auto-École Bordeaux",
    secteur: "auto-école", ville: "Bordeaux", quartier: "Centre",
    email: "contact@autoecole-bordeaux.fr", site: "https://autoecole-bordeaux.fr",
    note_google: 3.9, nb_avis: 12, top10_google: 0, visible_chatgpt: 0,
    email_pro_verifiable: 1, site_actif: 1, description_claire: 0, gbp_bien_rempli: 0,
    status: "pas_fit",
  },
  {
    entreprise: "Cabinet Dentaire Lille",
    secteur: "dentiste", ville: "Lille", quartier: "Vieux-Lille",
    email: "secretariat@dentaire-lille.fr", site: "https://dentaire-lille.fr",
    note_google: 4.9, nb_avis: 156, top10_google: 1, visible_chatgpt: 0,
    email_pro_verifiable: 1, site_actif: 1, description_claire: 1, gbp_bien_rempli: 1,
    status: "nouveaux",
  },
  {
    entreprise: "Hôtel Le Petit Lyon",
    secteur: "hôtel", ville: "Lyon", quartier: "Confluence",
    email: "resa@petitlyon.fr", telephone: "04 78 99 99 99",
    site: "https://petitlyon.fr",
    note_google: 4.6, nb_avis: 540, top10_google: 1, visible_chatgpt: 1,
    email_pro_verifiable: 1, site_actif: 1, description_claire: 1, gbp_bien_rempli: 1,
    status: "contactes", date_contact: todayPlus(-2),
  },
];

for (const s of seeds) {
  const score = computeScore(s);
  const next = actionForStatus(s.status);
  await sql`
    INSERT INTO leads (
      entreprise, secteur, ville, quartier, email, telephone, site,
      note_google, nb_avis,
      top10_google, visible_chatgpt, email_pro_verifiable, site_actif,
      description_claire, gbp_bien_rempli,
      score, raison_fit, accroche, objet_email, gmail_draft_id,
      date_contact, date_derniere_action, date_prochaine_action, prochaine_action_type,
      offre_acceptee, date_signature, montant_encaisse, status
    ) VALUES (
      ${s.entreprise}, ${s.secteur}, ${s.ville}, ${s.quartier ?? null},
      ${s.email ?? null}, ${s.telephone ?? null}, ${s.site ?? null},
      ${s.note_google ?? null}, ${s.nb_avis ?? null},
      ${s.top10_google ?? 0}, ${s.visible_chatgpt ?? 0},
      ${s.email_pro_verifiable ?? 0}, ${s.site_actif ?? 0},
      ${s.description_claire ?? 0}, ${s.gbp_bien_rempli ?? 0},
      ${score}, ${s.raison_fit ?? null}, ${s.accroche ?? null},
      ${s.objet_email ?? null}, ${s.gmail_draft_id ?? null},
      ${s.date_contact ?? null}, ${s.date_derniere_action ?? null},
      ${next.date}, ${next.type},
      ${s.offre_acceptee ?? null}, ${s.date_signature ?? null},
      ${s.montant_encaisse ?? null}, ${s.status}
    )
  `;
}

console.log(`Seed ok: ${seeds.length} leads insérés.`);
