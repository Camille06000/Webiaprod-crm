import { NextResponse } from "next/server";
import { createLead, listLeads } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ leads: await listLeads() });
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body?.entreprise) {
    return NextResponse.json({ error: "entreprise requis" }, { status: 400 });
  }
  const lead = await createLead(body);
  return NextResponse.json({ lead }, { status: 201 });
}
