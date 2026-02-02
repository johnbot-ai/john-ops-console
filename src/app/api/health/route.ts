import { NextResponse } from "next/server";

import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const result = await sql`SELECT 1 as ok`;
  return NextResponse.json({ ok: result.rows[0]?.ok === 1 });
}
