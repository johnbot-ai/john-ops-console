import { NextRequest, NextResponse } from "next/server";

import { sql } from "@/lib/db";
import { rowToProjectDto } from "@/lib/taskManager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(status: number, error: string, details?: unknown) {
  return NextResponse.json({ error, details }, { status });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const limitRaw = url.searchParams.get("limit");
  const offsetRaw = url.searchParams.get("offset");

  const limit = Math.min(
    Math.max(Number(limitRaw ?? 50) || 50, 1),
    200,
  );
  const offset = Math.max(Number(offsetRaw ?? 0) || 0, 0);

  const { rows } = await sql`
    SELECT id, title, description, created_at, updated_at
    FROM projects
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return NextResponse.json({ projects: rows.map(rowToProjectDto) });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Invalid JSON body");
  }

  if (typeof body !== "object" || body === null) {
    return jsonError(400, "Body must be an object");
  }

  const title = (body as { title?: unknown }).title;
  const description = (body as { description?: unknown }).description;

  if (typeof title !== "string" || title.trim().length === 0) {
    return jsonError(400, "title is required");
  }

  if (description != null && typeof description !== "string") {
    return jsonError(400, "description must be a string");
  }

  const { rows } = await sql`
    INSERT INTO projects (title, description)
    VALUES (${title.trim()}, ${description ?? null})
    RETURNING id, title, description, created_at, updated_at
  `;

  return NextResponse.json({ project: rowToProjectDto(rows[0]!) }, { status: 201 });
}
