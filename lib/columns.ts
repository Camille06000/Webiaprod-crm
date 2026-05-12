export type ColumnId =
  | "nouveaux"
  | "contactes"
  | "interesses"
  | "demo"
  | "closes"
  | "pas_fit"
  | "concurrent"
  | "pas_interesse";

export interface ColumnDef {
  id: ColumnId;
  title: string;
  emoji: string;
  accent: string;
}

export const COLUMNS: ColumnDef[] = [
  { id: "nouveaux", title: "Nouveaux Leads", emoji: "📥", accent: "bg-slate-100 border-slate-300" },
  { id: "contactes", title: "Contactés", emoji: "✉️", accent: "bg-blue-50 border-blue-300" },
  { id: "interesses", title: "Intéressés", emoji: "💬", accent: "bg-amber-50 border-amber-300" },
  { id: "demo", title: "Démo bookée", emoji: "📅", accent: "bg-purple-50 border-purple-300" },
  { id: "closes", title: "Closés Early Bird", emoji: "🔥", accent: "bg-emerald-50 border-emerald-400" },
  { id: "pas_fit", title: "Pas Fit", emoji: "🚫", accent: "bg-zinc-100 border-zinc-300" },
  { id: "concurrent", title: "Concurrent signé", emoji: "⛔", accent: "bg-rose-50 border-rose-300" },
  { id: "pas_interesse", title: "Pas intéressé / NPAI", emoji: "🗑️", accent: "bg-gray-100 border-gray-300" },
];

export const COLUMN_IDS = COLUMNS.map((c) => c.id);

export function isColumnId(v: unknown): v is ColumnId {
  return typeof v === "string" && (COLUMN_IDS as string[]).includes(v);
}
