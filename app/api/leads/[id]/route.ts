import { NextResponse } from "next/server";
import { deleteLead, getLead, updateLead } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const lead = await getLead(Number(params.id));
  if (!lead) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ lead });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const lead = await updateLead(Number(params.id), body);
  if (!lead) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ lead });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const ok = await deleteLead(Number(params.id));
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
