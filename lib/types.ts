import type { ColumnId } from "./columns";

export interface Lead {
  id: number;
  entreprise: string;
  secteur: string;
  ville: string;
  quartier: string | null;
  email: string | null;
  telephone: string | null;
  site: string | null;
  note_google: number | null;
  nb_avis: number | null;
  top10_google: 0 | 1;
  visible_chatgpt: 0 | 1;
  email_pro_verifiable: 0 | 1;
  site_actif: 0 | 1;
  description_claire: 0 | 1;
  gbp_bien_rempli: 0 | 1;
  score: number;
  raison_fit: string | null;
  accroche: string | null;
  objet_email: string | null;
  gmail_draft_id: string | null;
  date_contact: string | null;
  date_derniere_action: string | null;
  date_prochaine_action: string | null;
  prochaine_action_type: string | null;
  offre_acceptee: "early_bird" | "pas_encore" | null;
  date_signature: string | null;
  montant_encaisse: number | null;
  status: ColumnId;
  created_at: string;
  updated_at: string;
}

export type LeadInput = Partial<Omit<Lead, "id" | "score" | "created_at" | "updated_at">>;
