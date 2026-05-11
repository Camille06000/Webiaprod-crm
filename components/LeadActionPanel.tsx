"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Lead } from "@/lib/types";
import { nextActionFor } from "@/lib/actions";

export default function LeadActionPanel({ lead }: { lead: Lead }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const plan = nextActionFor(lead.status);

  async function act(op: "done" | "skip") {
    setBusy(true);
    await fetch(`/api/leads/${lead.id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <section className="rounded-lg bg-white border p-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Action recommandée</div>
          <div className="font-semibold">{plan?.label ?? "Aucune action automatique pour ce statut"}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            Prochaine : {lead.date_prochaine_action ?? "—"} · Dernière : {lead.date_derniere_action ?? "—"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={busy || !plan}
            onClick={() => act("done")}
            className="px-3 py-1.5 rounded bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-50"
          >
            ✓ Action faite
          </button>
          <button
            disabled={busy}
            onClick={() => act("skip")}
            className="px-3 py-1.5 rounded border text-sm hover:bg-slate-50"
          >
            ⏭ Reporter +2j
          </button>
        </div>
      </div>
    </section>
  );
}
