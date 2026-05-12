"use client";
import { useEffect, useMemo, useState } from "react";
import type { Lead } from "@/lib/types";

interface Zone {
  ville: string;
  secteur: string;
  signes: number;
  demos_en_cours: number;
  contactes_en_cours: number;
  total: number;
  statut: "OUVERT" | "FERME";
}

export default function ZonesView({ initialZones }: { initialZones: Zone[] }) {
  const [zones, setZones] = useState<Zone[]>(initialZones);
  const [filter, setFilter] = useState("");
  const [statutFilter, setStatutFilter] = useState<"all" | "OUVERT" | "FERME">("all");
  const [selected, setSelected] = useState<Zone | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, []);

  async function refresh() {
    const r = await fetch("/api/zones", { cache: "no-store" });
    if (r.ok) {
      const data = (await r.json()) as { zones: Zone[] };
      setZones(data.zones);
      if (selected) {
        const z = data.zones.find((z) => z.ville === selected.ville && z.secteur === selected.secteur);
        if (z) setSelected(z);
      }
    }
  }

  async function openZone(z: Zone) {
    setSelected(z);
    setLoading(true);
    const r = await fetch(`/api/zones?ville=${encodeURIComponent(z.ville)}&secteur=${encodeURIComponent(z.secteur)}`, {
      cache: "no-store",
    });
    if (r.ok) {
      const data = (await r.json()) as { leads: Lead[] };
      setLeads(data.leads);
    }
    setLoading(false);
  }

  async function closeOut(z: Zone) {
    if (!confirm(`Marquer tous les leads restants (${z.ville} · ${z.secteur}) comme "Concurrent signé" ?`)) return;
    await fetch("/api/zones/close-out", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ville: z.ville, secteur: z.secteur }),
    });
    await refresh();
    await openZone(z);
  }

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return zones.filter((z) => {
      if (statutFilter !== "all" && z.statut !== statutFilter) return false;
      if (!q) return true;
      return z.ville.toLowerCase().includes(q) || z.secteur.toLowerCase().includes(q);
    });
  }, [zones, filter, statutFilter]);

  const fermees = zones.filter((z) => z.statut === "FERME").length;

  return (
    <div className="space-y-4">
      {fermees > 0 && (
        <div className="rounded-lg bg-rose-100 border border-rose-300 text-rose-900 px-4 py-3">
          ⛔ <strong>{fermees}</strong> zone{fermees > 1 ? "s" : ""} fermée{fermees > 1 ? "s" : ""}. Closes vite les
          prospects en cours sur ces zones avant qu&apos;ils basculent &quot;Concurrent signé&quot;.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrer par ville ou secteur…"
          className="px-3 py-1.5 rounded border bg-white text-sm w-full sm:w-72"
        />
        <select
          value={statutFilter}
          onChange={(e) => setStatutFilter(e.target.value as "all" | "OUVERT" | "FERME")}
          className="px-3 py-1.5 rounded border bg-white text-sm"
        >
          <option value="all">Toutes</option>
          <option value="OUVERT">Ouvertes</option>
          <option value="FERME">Fermées</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-3 py-2">Ville</th>
                <th className="text-left px-3 py-2">Secteur</th>
                <th className="text-right px-3 py-2">Signés</th>
                <th className="text-right px-3 py-2">Démos</th>
                <th className="text-right px-3 py-2">En cours</th>
                <th className="text-center px-3 py-2">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                    Aucune zone — ajoute des leads pour voir les zones.
                  </td>
                </tr>
              ) : (
                filtered.map((z) => (
                  <tr
                    key={`${z.ville}-${z.secteur}`}
                    className={`cursor-pointer border-t hover:bg-slate-50 ${
                      selected?.ville === z.ville && selected?.secteur === z.secteur ? "bg-amber-50" : ""
                    }`}
                    onClick={() => openZone(z)}
                  >
                    <td className="px-3 py-2 font-medium">{z.ville}</td>
                    <td className="px-3 py-2">{z.secteur}</td>
                    <td className="px-3 py-2 text-right">
                      <span className={z.signes >= 3 ? "text-rose-600 font-bold" : "font-semibold"}>{z.signes}</span>
                      <span className="text-slate-400">/3</span>
                    </td>
                    <td className="px-3 py-2 text-right">{z.demos_en_cours}</td>
                    <td className="px-3 py-2 text-right">{z.contactes_en_cours}</td>
                    <td className="px-3 py-2 text-center">
                      {z.statut === "FERME" ? (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-rose-100 border border-rose-300 text-rose-700 text-xs font-bold">FERMÉ</span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 text-xs font-bold">OUVERT</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <aside className="rounded-lg border bg-white p-3">
          {!selected ? (
            <div className="text-sm text-slate-500">Sélectionne une zone pour voir le détail.</div>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="text-xs text-slate-500">Zone</div>
                <div className="font-semibold">
                  {selected.ville} · {selected.secteur}
                </div>
                <div className="text-xs mt-1">
                  {selected.statut === "FERME" ? (
                    <span className="text-rose-700 font-bold">FERMÉ — 3 signés atteints</span>
                  ) : (
                    <span className="text-emerald-700 font-bold">
                      OUVERT — {3 - selected.signes} place{3 - selected.signes > 1 ? "s" : ""} restante{3 - selected.signes > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              {selected.statut === "FERME" && (
                <div className="rounded bg-rose-50 border border-rose-300 p-2 text-xs">
                  <div className="font-semibold text-rose-700 mb-1">Action recommandée</div>
                  <div className="text-rose-700">Notifie les prospects en cours pour closing express, sinon marque-les Concurrent signé.</div>
                  <button
                    onClick={() => closeOut(selected)}
                    className="mt-2 w-full px-3 py-1.5 rounded bg-rose-600 text-white text-xs font-medium hover:bg-rose-700"
                  >
                    Marquer leads restants &quot;Concurrent signé&quot;
                  </button>
                </div>
              )}

              <div>
                <div className="text-xs font-semibold text-slate-600 mb-1">
                  Prospects à closer vite ({leads.filter((l) => ["contactes", "interesses", "demo"].includes(l.status)).length})
                </div>
                {loading ? (
                  <div className="text-xs text-slate-400">Chargement…</div>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {leads
                      .filter((l) => ["contactes", "interesses", "demo"].includes(l.status))
                      .map((l) => (
                        <li key={l.id} className="flex items-center justify-between gap-2 border rounded px-2 py-1">
                          <a href={`/leads/${l.id}`} className="hover:underline truncate">
                            {l.entreprise}
                          </a>
                          <span className="text-[10px] text-slate-500 shrink-0">{l.status}</span>
                        </li>
                      ))}
                    {leads.filter((l) => ["contactes", "interesses", "demo"].includes(l.status)).length === 0 && (
                      <li className="text-xs text-slate-400 italic">Aucun lead à risque sur cette zone.</li>
                    )}
                  </ul>
                )}
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-600 mb-1">Tous les leads ({leads.length})</div>
                <ul className="space-y-1 text-xs max-h-60 overflow-y-auto">
                  {leads.map((l) => (
                    <li key={l.id} className="flex items-center justify-between gap-2">
                      <a href={`/leads/${l.id}`} className="hover:underline truncate">
                        {l.entreprise}
                      </a>
                      <span className="text-[10px] text-slate-500 shrink-0">{l.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
