"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Lead } from "@/lib/types";
import { nextActionFor } from "@/lib/actions";

export default function LeadActionPanel({ lead }: { lead: Lead }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [draftBusy, setDraftBusy] = useState(false);
  const [draftMsg, setDraftMsg] = useState<string | null>(null);
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

  async function createDraft() {
    setDraftBusy(true);
    setDraftMsg(null);
    try {
      const r = await fetch(`/api/leads/${lead.id}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await r.json();
      if (!r.ok) {
        setDraftMsg(`❌ ${data.error}${data.details ? " — " + data.details : ""}`);
      } else {
        setDraftMsg(`✅ Draft créé (id ${data.draft_id})`);
        router.refresh();
      }
    } catch (err) {
      setDraftMsg(`❌ ${(err as Error).message}`);
    } finally {
      setDraftBusy(false);
    }
  }

  return (
    <section className="rounded-lg bg-white border p-4 space-y-3">
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

      <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Draft Gmail</div>
          {lead.gmail_draft_id ? (
            <div className="text-sm">
              Draft existant :{" "}
              <a
                href="https://mail.google.com/mail/u/0/#drafts"
                target="_blank"
                rel="noreferrer"
                className="font-mono text-brand-600 hover:underline"
              >
                {lead.gmail_draft_id}
              </a>
            </div>
          ) : (
            <div className="text-sm text-slate-500">Pas encore de draft</div>
          )}
          {draftMsg && <div className="text-xs mt-1">{draftMsg}</div>}
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={draftBusy || !lead.email}
            onClick={createDraft}
            className="px-3 py-1.5 rounded bg-brand-600 text-white text-sm hover:bg-brand-700 disabled:opacity-50"
            title={lead.email ? "Crée un draft Gmail à partir des champs du lead" : "Lead sans email"}
          >
            {draftBusy ? "Création..." : lead.gmail_draft_id ? "Recréer draft Gmail" : "✉️ Créer draft Gmail"}
          </button>
          {lead.gmail_draft_id && (
            <a
              href="https://mail.google.com/mail/u/0/#drafts"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded border text-sm hover:bg-slate-50"
            >
              Ouvrir Gmail
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
