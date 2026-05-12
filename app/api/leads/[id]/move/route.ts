import { NextResponse } from "next/server";
import { moveLead } from "@/lib/repo";
import { isColumnId } from "@/lib/columns";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  if (!isColumnId(body?.status)) {
    return NextResponse.json({ error: "status invalide" }, { status: 400 });
  }
  const lead = await moveLead(Number(params.id), body.status);
  if (!lead) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ lead });
}
