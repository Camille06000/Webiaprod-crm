import type { Lead } from "./types";
import type { ColumnId } from "./columns";

export interface NextActionPlan {
  type: string;
  label: string;
  dueInDays: number;
}

export function nextActionFor(status: ColumnId): NextActionPlan | null {
  switch (status) {
    case "nouveaux":
      return { type: "valider_draft", label: "Valider draft Gmail (J+0)", dueInDays: 0 };
    case "contactes":
      return { type: "relance_soft", label: "Relance soft « vos concurrents... » (J+3)", dueInDays: 3 };
    case "interesses":
      return { type: "relance_valeur", label: "Relance valeur — test ChatGPT live (J+7)", dueInDays: 7 };
    case "demo":
      return { type: "closing", label: "Closing post-démo", dueInDays: 1 };
    default:
      return null;
  }
}

export function autoArchiveAfterDays(status: ColumnId): number | null {
  if (status === "contactes" || status === "interesses") return 14;
  return null;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(iso: string | null | undefined, days: number): string {
  const d = iso ? new Date(iso) : new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / 86400000);
}

export function recommendOnSkip(currentDue: string | null | undefined): string {
  return addDaysISO(currentDue, 2);
}

export function recommendForLead(lead: Pick<Lead, "status">): { date: string; type: string; label: string } | null {
  const plan = nextActionFor(lead.status);
  if (!plan) return null;
  return {
    date: addDaysISO(todayISO(), plan.dueInDays),
    type: plan.type,
    label: plan.label,
  };
}
