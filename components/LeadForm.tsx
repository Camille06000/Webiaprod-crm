"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Lead } from "@/lib/types";
import { COLUMNS } from "@/lib/columns";

type FormState = Partial<Lead>;

export default function LeadForm({ initial }: { initial?: Lead }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FormState>(
    initial ?? {
      entreprise: "",
      secteur: "",
      ville: "",
      quartier: "",
      email: "",
      telephone: "",
      site: "",
      note_google: undefined,
      nb_avis: undefined,
      top10_google: 0,
      visible_chatgpt: 0,
      email_pro_verifiable: 0,
      site_actif: 0,
      description_claire: 0,
      gbp_bien_rempli: 0,
      raison_fit: "",
      accroche: "",
      objet_email: "",
      gmail_draft_id: "",
      date_contact: "",
      offre_acceptee: "pas_encore",
      status: "nouveaux",
    }
  );

  function bind<K extends keyof FormState>(key: K) {
    return {
      value: (data[key] as string | number | undefined | null) ?? "",
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const v = e.target.type === "number" ? (e.target.value === "" ? undefined : Number(e.target.value)) : e.target.value;
        setData((d) => ({ ...d, [key]: v }));
      },
    };
  }

  function bindBool<K extends keyof FormState>(key: K) {
    return {
      checked: !!data[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setData((d) => ({ ...d, [key]: e.target.checked ? 1 : 0 })),
    };
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const url = initial ? `/api/leads/${initial.id}` : "/api/leads";
      const r = await fetch(url, {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(j.error ?? "Erreur");
        return;
      }
      const j = (await r.json()) as { lead: Lead };
      router.push(`/leads/${j.lead.id}`);
      router.refresh();
    });
  }

  async function onDelete() {
    if (!initial) return;
    if (!confirm("Supprimer ce lead ?")) return;
    await fetch(`/api/leads/${initial.id}`, { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4 max-w-3xl">
      {error && <div className="rounded bg-rose-100 border border-rose-300 text-rose-800 px-3 py-2 text-sm">{error}</div>}

      <Fieldset title="Entreprise">
        <Grid>
          <Field label="Nom entreprise *">
            <input className="input" required {...bind("entreprise")} />
          </Field>
          <Field label="Secteur">
            <input className="input" placeholder="Ex. plombier, restaurant…" {...bind("secteur")} />
          </Field>
          <Field label="Ville">
            <input className="input" {...bind("ville")} />
          </Field>
          <Field label="Quartier">
            <input className="input" {...bind("quartier")} />
          </Field>
        </Grid>
      </Fieldset>

      <Fieldset title="Contact">
        <Grid>
          <Field label="Email">
            <input type="email" className="input" {...bind("email")} />
          </Field>
          <Field label="Téléphone">
            <input className="input" {...bind("telephone")} />
          </Field>
          <Field label="Site web">
            <input className="input" placeholder="https://…" {...bind("site")} />
          </Field>
        </Grid>
      </Fieldset>

      <Fieldset title="Visibilité Google / IA">
        <Grid>
          <Field label="Note Google">
            <input type="number" step="0.1" min="0" max="5" className="input" {...bind("note_google")} />
          </Field>
          <Field label="Nb avis Google">
            <input type="number" min="0" className="input" {...bind("nb_avis")} />
          </Field>
        </Grid>
        <Checks>
          <Check label="Top 10 Google local" {...bindBool("top10_google")} />
          <Check label="Visible ChatGPT (secteur + ville)" {...bindBool("visible_chatgpt")} />
        </Checks>
      </Fieldset>

      <Fieldset title="Critères de scoring">
        <Checks>
          <Check label="Email pro vérifiable (+2)" {...bindBool("email_pro_verifiable")} />
          <Check label="Site web actif (+2)" {...bindBool("site_actif")} />
          <Check label="Description claire (+1)" {...bindBool("description_claire")} />
          <Check label="GBP bien rempli (+1)" {...bindBool("gbp_bien_rempli")} />
        </Checks>
        <p className="text-xs text-slate-500">
          Note Google ≥ 4 et ≥ 20 avis donnent +2. Top 10 Google local donne +3. Score &lt; 5 → Pas Fit automatique.
        </p>
      </Fieldset>

      <Fieldset title="Approche commerciale">
        <Grid>
          <Field label="Raison fit">
            <input className="input" {...bind("raison_fit")} />
          </Field>
          <Field label="Accroche utilisée">
            <input className="input" {...bind("accroche")} />
          </Field>
          <Field label="Objet email" full>
            <input className="input" {...bind("objet_email")} />
          </Field>
          <Field label="ID draft Gmail">
            <input className="input" {...bind("gmail_draft_id")} />
          </Field>
          <Field label="Date contact">
            <input type="date" className="input" {...bind("date_contact")} />
          </Field>
        </Grid>
      </Fieldset>

      <Fieldset title="Offre / closing">
        <Grid>
          <Field label="Statut">
            <select className="input" {...bind("status")}>
              {COLUMNS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Offre acceptée">
            <select className="input" {...bind("offre_acceptee")}>
              <option value="pas_encore">Pas encore</option>
              <option value="early_bird">Early Bird 500€</option>
            </select>
          </Field>
          <Field label="Date signature">
            <input type="date" className="input" {...bind("date_signature")} />
          </Field>
          <Field label="Montant encaissé (€)">
            <input type="number" step="0.01" className="input" {...bind("montant_encaisse")} />
          </Field>
        </Grid>
      </Fieldset>

      <div className="flex items-center gap-2">
        <button type="submit" disabled={pending} className="px-4 py-2 rounded bg-brand-600 text-white font-medium hover:bg-brand-700 disabled:opacity-50">
          {pending ? "Enregistrement…" : initial ? "Mettre à jour" : "Créer le lead"}
        </button>
        {initial && (
          <button type="button" onClick={onDelete} className="px-3 py-2 rounded border border-rose-300 text-rose-700 hover:bg-rose-50 text-sm">
            Supprimer
          </button>
        )}
      </div>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 6px 10px;
          font-size: 14px;
        }
        :global(.input:focus) {
          outline: none;
          border-color: #f97316;
          box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2);
        }
      `}</style>
    </form>
  );
}

function Fieldset({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-lg border bg-white p-4">
      <legend className="px-2 text-sm font-semibold text-slate-700">{title}</legend>
      <div className="space-y-3">{children}</div>
    </fieldset>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-xs text-slate-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Checks({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">{children}</div>;
}

function Check({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" className="h-4 w-4" {...props} />
      <span>{label}</span>
    </label>
  );
}
