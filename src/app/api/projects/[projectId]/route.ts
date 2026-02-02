import { NextRequest, NextResponse } from "next/server";

import { sql } from "@/lib/db";
import { isUuid, rowToProjectDto } from "@/lib/taskManager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(status: number, error: string, details?: unknown) {
  return NextResponse.json({ error, details }, { status });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;

  if (!isUuid(projectId)) {
    return jsonError(400, "Invalid projectId");
  }

  const { rows } = await sql`
    SELECT id, title, description, created_at, updated_at
    FROM projects
    WHERE id = ${projectId}
    LIMIT 1
  `;

  const project = rows[0];
  if (!project) {
    return jsonError(404, "Project not found");
  }

  return NextResponse.json({ project: rowToProjectDto(project) });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;

  if (!isUuid(projectId)) {
    return jsonError(400, "Invalid projectId");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Invalid JSON body");
  }

  if (typeof body !== "object" || body === null) {
    return jsonError(400, "Body must be an object");
  }

  const hasTitle = Object.prototype.hasOwnProperty.call(body, "title");
  const hasDescription = Object.prototype.hasOwnProperty.call(body, "description");

  if (!hasTitle && !hasDescription) {
    return jsonError(400, "No updatable fields provided");
  }

  const title = (body as { title?: unknown }).title;
  const description = (body as { description?: unknown }).description;

  if (hasTitle) {
    if (typeof title !== "string" || title.trim().length === 0) {
      return jsonError(400, "title must be a non-empty string");
    }
  }

  if (hasDescription) {
    if (description != null && typeof description !== "string") {
      return jsonError(400, "description must be a string or null");
    }
  }

  let rows:
    | Array<Record<string, unknown>>
    | undefined;

  if (hasTitle && hasDescription) {
    ({ rows } = await sql`
      UPDATE projects
      SET title = ${String(title).trim()}, description = ${(description as string | null | undefined) ?? null}
      WHERE id = ${projectId}
      RETURNING id, title, description, created_at, updated_at
    `);
  } else if (hasTitle) {
    ({ rows } = await sql`
      UPDATE projects
      SET title = ${String(title).trim()}
      WHERE id = ${projectId}
      RETURNING id, title, description, created_at, updated_at
    `);
  } else {
    ({ rows } = await sql`
      UPDATE projects
      SET description = ${(description as string | null | undefined) ?? null}
      WHERE id = ${projectId}
      RETURNING id, title, description, created_at, updated_at
    `);
  }

  const project = rows?.[0];
  if (!project) {
    return jsonError(404, "Project not found");
  }

  return NextResponse.json({ project: rowToProjectDto(project) });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;

  if (!isUuid(projectId)) {
    return jsonError(400, "Invalid projectId");
  }

  const result = await sql`
    DELETE FROM projects
    WHERE id = ${projectId}
  `;

  if (result.rowCount === 0) {
    return jsonError(404, "Project not found");
  }

  return new NextResponse(null, { status: 204 });
}
