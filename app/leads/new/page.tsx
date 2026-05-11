import LeadForm from "@/components/LeadForm";

export const dynamic = "force-dynamic";

export default function NewLeadPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Nouveau lead</h1>
      <LeadForm />
    </div>
  );
}
