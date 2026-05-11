import ZonesView from "@/components/ZonesView";
import { listZones } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default function ZonesPage() {
  const zones = listZones();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Zones bloquées</h1>
      <p className="text-sm text-slate-600">
        Rareté géographique : 2-3 clients max par ville + secteur. Une zone se ferme automatiquement à <strong>3 signés</strong>.
      </p>
      <ZonesView initialZones={zones} />
    </div>
  );
}
