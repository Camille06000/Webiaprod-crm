import { NextResponse } from "next/server";
import { metrics } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(metrics());
}
