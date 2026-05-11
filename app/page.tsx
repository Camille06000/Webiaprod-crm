import KanbanBoard from "@/components/KanbanBoard";
import EarlyBirdDashboard from "@/components/EarlyBirdDashboard";
import { listLeads, metrics } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const leads = listLeads();
  const m = metrics();
  return (
    <div className="space-y-4">
      <EarlyBirdDashboard initial={m} />
      <KanbanBoard initialLeads={leads} />
    </div>
  );
}
