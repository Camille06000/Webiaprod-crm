import type { Lead } from "./types";

export function computeScore(l: Partial<Lead>): number {
  let s = 0;
  if (l.email_pro_verifiable) s += 2;
  if (l.site_actif) s += 2;
  if ((l.note_google ?? 0) >= 4 && (l.nb_avis ?? 0) >= 20) s += 2;
  if (l.description_claire) s += 1;
  if (l.top10_google) s += 3;
  if (l.gbp_bien_rempli) s += 1;
  return Math.min(10, s);
}

export function shouldBePasFit(score: number): boolean {
  return score < 5;
}
