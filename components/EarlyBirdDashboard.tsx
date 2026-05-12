"use client";
import { useEffect, useState } from "react";

interface Metrics {
  total: number;
  earlyBirdSignes: number;
  earlyBirdGoal: number;
  earlyBirdRestants: number;
  earlyBirdTermine: boolean;
  cashTotal: number;
  mrrEquivalent: number;
  demosEnCours: number;
  tauxContactDemo: number;
  tauxDemoClient: number;
}

export default function EarlyBirdDashboard({ initial }: { initial: Metrics }) {
  const [m, setM] = useState<Metrics>(initial);

  useEffect(() => {
    const t = setInterval(async () => {
      const r = await fetch("/api/metrics", { cache: "no-store" });
      if (r.ok) setM(await r.json());
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const progress = Math.min(100, Math.round((m.earlyBirdSignes / m.earlyBirdGoal) * 100));

  return (
    <section className="rounded-xl bg-white border shadow-sm p-4">
      {m.earlyBirdTermine && (
        <div className="mb-3 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 px-4 py-3 font-semibold">
          🎉 Early Bird terminé — basculer sur l&apos;offre publique 99€/mois (1 188€/an).
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Stat emoji="🔥" label="Early Bird signés" value={`${m.earlyBirdSignes}/${m.earlyBirdGoal}`} accent="text-orange-600" />
        <Stat emoji="💰" label="Cash encaissé" value={`${m.cashTotal.toLocaleString("fr-FR")} €`} accent="text-emerald-600" />
        <Stat emoji="📅" label="MRR équivalent" value={`${m.mrrEquivalent.toLocaleString("fr-FR")} €/mois`} accent="text-blue-600" />
        <Stat emoji="🎯" label="Démos en attente" value={`${m.demosEnCours}`} accent="text-purple-600" />
        <Stat emoji="📊" label="Contact → Démo" value={`${m.tauxContactDemo}%`} accent="text-slate-700" />
        <Stat emoji="📊" label="Démo → Client" value={`${m.tauxDemoClient}%`} accent="text-slate-700" />
      </div>
      <div className="mt-3">
        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="text-xs text-slate-500 mt-1">
          Progression Early Bird : {progress}% — encore {m.earlyBirdRestants} places.
        </div>
      </div>
    </section>
  );
}

function Stat({ emoji, label, value, accent }: { emoji: string; label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border bg-slate-50/60 px-3 py-2.5">
      <div className="text-xs text-slate-500 flex items-center gap-1">
        <span>{emoji}</span>
        <span>{label}</span>
      </div>
      <div className={`text-xl font-bold ${accent ?? ""}`}>{value}</div>
    </div>
  );
}
