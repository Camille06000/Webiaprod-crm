"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import type { Lead } from "@/lib/types";

export default function LeadCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `lead-${lead.id}`,
    data: { type: "lead", lead },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const next = lead.date_prochaine_action;
  const overdue = next ? new Date(next) < new Date(new Date().toDateString()) : false;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg bg-white border shadow-sm p-3 select-none touch-none"
    >
      <div className="flex items-start justify-between gap-2">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing flex-1">
          <div className="font-semibold text-sm leading-tight">{lead.entreprise}</div>
          <div className="text-[11px] text-slate-500">
            {lead.secteur || "—"} · {lead.ville || "—"}
            {lead.quartier ? ` · ${lead.quartier}` : ""}
          </div>
        </div>
        <ScoreBadge score={lead.score} />
      </div>

      <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
        {lead.top10_google ? <Tag color="emerald">Top 10 local</Tag> : null}
        {lead.visible_chatgpt ? <Tag color="indigo">ChatGPT visible</Tag> : <Tag color="rose">ChatGPT invisible</Tag>}
        {lead.note_google != null && (
          <Tag color="amber">
            ★ {lead.note_google} ({lead.nb_avis ?? 0})
          </Tag>
        )}
        {lead.gmail_draft_id ? <Tag color="slate">Draft Gmail</Tag> : null}
      </div>

      {lead.objet_email && (
        <div className="mt-2 text-[11px] text-slate-600 line-clamp-2">
          <span className="font-medium">Objet :</span> {lead.objet_email}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between">
        <div className="text-[11px]">
          {next ? (
            <span className={overdue ? "text-rose-600 font-medium" : "text-slate-500"}>
              ⏰ {overdue ? "En retard" : "Prochaine"} : {next}
            </span>
          ) : (
            <span className="text-slate-400">Pas d&apos;action programmée</span>
          )}
        </div>
        <Link
          href={`/leads/${lead.id}`}
          className="text-[11px] text-brand-600 hover:underline"
        >
          Ouvrir →
        </Link>
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 8 ? "bg-emerald-600" : score >= 6 ? "bg-amber-500" : score >= 5 ? "bg-orange-500" : "bg-rose-500";
  return (
    <div className={`shrink-0 w-9 h-9 rounded-full text-white text-sm font-bold flex items-center justify-center ${color}`}>
      {score}
    </div>
  );
}

function Tag({ color, children }: { color: string; children: React.ReactNode }) {
  const map: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
    indigo: "bg-indigo-100 text-indigo-700 border-indigo-200",
    rose: "bg-rose-100 text-rose-700 border-rose-200",
    amber: "bg-amber-100 text-amber-800 border-amber-200",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return <span className={`px-1.5 py-0.5 rounded border ${map[color] ?? map.slate}`}>{children}</span>;
}
