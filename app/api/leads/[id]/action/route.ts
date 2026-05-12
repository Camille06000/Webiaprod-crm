import { NextResponse } from "next/server";
import { getLead, updateLead } from "@/lib/repo";
import { addDaysISO, recommendForLead, todayISO } from "@/lib/actions";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const id = Number(params.id);
  const lead = await getLead(id);
  if (!lead) return NextResponse.json({ error: "not found" }, { status: 404 });

  const op: "done" | "skip" = body?.op === "skip" ? "skip" : "done";

  if (op === "done") {
    const today = todayISO();
    const next = recommendForLead({ status: lead.status });
    const updated = await updateLead(id, {
      date_derniere_action: today,
      date_prochaine_action: next?.date ?? null,
      prochaine_action_type: next?.type ?? null,
    });
    return NextResponse.json({ lead: updated });
  }

  const newDate = addDaysISO(lead.date_prochaine_action ?? todayISO(), 2);
  const updated = await updateLead(id, { date_prochaine_action: newDate });
  return NextResponse.json({ lead: updated });
}
