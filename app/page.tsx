import KanbanBoard from "@/components/KanbanBoard";
import EarlyBirdDashboard from "@/components/EarlyBirdDashboard";
import { listLeads, metrics } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [leads, m] = await Promise.all([listLeads(), metrics()]);
  return (
    <div className="space-y-4">
      <EarlyBirdDashboard initial={m} />
      <KanbanBoard initialLeads={leads} />
    </div>
  );
}
