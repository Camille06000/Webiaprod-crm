import LeadForm from "@/components/LeadForm";
import LeadActionPanel from "@/components/LeadActionPanel";
import { getLead } from "@/lib/repo";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const lead = getLead(Number(params.id));
  if (!lead) notFound();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/" className="text-brand-600 hover:underline">← Retour au Kanban</Link>
      </div>
      <h1 className="text-xl font-bold">
        {lead.entreprise}{" "}
        <span className="text-slate-400 text-base font-normal">
          ({lead.secteur} · {lead.ville})
        </span>
      </h1>

      <LeadActionPanel lead={lead} />
      <LeadForm initial={lead} />
    </div>
  );
}
