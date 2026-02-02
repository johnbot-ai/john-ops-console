import { NextRequest, NextResponse } from "next/server";

import { sql } from "@/lib/db";
import {
  isTaskPriority,
  isTaskStatus,
  isUuid,
  normalizeTags,
  rowToTaskDto,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from "@/lib/taskManager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(status: number, error: string, details?: unknown) {
  return NextResponse.json({ error, details }, { status });
}

function parseOptionalIsoDate(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== "string") {
    throw new Error("dueAt must be an ISO date string or null");
  }
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) {
    throw new Error("dueAt must be a valid date string");
  }
  return new Date(ms).toISOString();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  if (!isUuid(projectId)) {
    return jsonError(400, "Invalid projectId");
  }

  // Ensure project exists
  const project = await sql`SELECT id FROM projects WHERE id = ${projectId} LIMIT 1`;
  if (!project.rows[0]) {
    return jsonError(404, "Project not found");
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const priority = url.searchParams.get("priority");

  if (status && !isTaskStatus(status)) {
    return jsonError(400, "Invalid status", { allowed: TASK_STATUSES });
  }
  if (priority && !isTaskPriority(priority)) {
    return jsonError(400, "Invalid priority", { allowed: TASK_PRIORITIES });
  }

  let rows: Array<Record<string, unknown>>;

  if (status && priority) {
    ({ rows } = await sql`
      SELECT id, project_id, title, description, status, priority, due_at, tags, created_at, updated_at
      FROM tasks
      WHERE project_id = ${projectId} AND status = ${status} AND priority = ${priority}
      ORDER BY created_at DESC
    `);
  } else if (status) {
    ({ rows } = await sql`
      SELECT id, project_id, title, description, status, priority, due_at, tags, created_at, updated_at
      FROM tasks
      WHERE project_id = ${projectId} AND status = ${status}
      ORDER BY created_at DESC
    `);
  } else if (priority) {
    ({ rows } = await sql`
      SELECT id, project_id, title, description, status, priority, due_at, tags, created_at, updated_at
      FROM tasks
      WHERE project_id = ${projectId} AND priority = ${priority}
      ORDER BY created_at DESC
    `);
  } else {
    ({ rows } = await sql`
      SELECT id, project_id, title, description, status, priority, due_at, tags, created_at, updated_at
      FROM tasks
      WHERE project_id = ${projectId}
      ORDER BY created_at DESC
    `);
  }

  return NextResponse.json({ tasks: rows.map(rowToTaskDto) });
}

export async function POST(
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

  const title = (body as { title?: unknown }).title;
  const description = (body as { description?: unknown }).description;
  const status = (body as { status?: unknown }).status;
  const priority = (body as { priority?: unknown }).priority;
  const dueAt = (body as { dueAt?: unknown }).dueAt;
  const tagsInput = (body as { tags?: unknown }).tags;

  if (typeof title !== "string" || title.trim().length === 0) {
    return jsonError(400, "title is required");
  }

  if (description != null && typeof description !== "string") {
    return jsonError(400, "description must be a string");
  }

  const statusValue =
    typeof status === "string" && isTaskStatus(status) ? status : "inbox";
  if (status != null && (typeof status !== "string" || !isTaskStatus(status))) {
    return jsonError(400, "Invalid status", { allowed: TASK_STATUSES });
  }

  const priorityValue =
    typeof priority === "string" && isTaskPriority(priority) ? priority : "med";
  if (
    priority != null &&
    (typeof priority !== "string" || !isTaskPriority(priority))
  ) {
    return jsonError(400, "Invalid priority", { allowed: TASK_PRIORITIES });
  }

  let dueAtValue: string | null;
  try {
    dueAtValue = parseOptionalIsoDate(dueAt);
  } catch (e) {
    return jsonError(400, (e as Error).message);
  }

  let tags: string[];
  try {
    tags = normalizeTags(tagsInput);
  } catch (e) {
    return jsonError(400, (e as Error).message);
  }

  try {
    const result = await sql.query(
      "INSERT INTO tasks (project_id, title, description, status, priority, due_at, tags)\n       VALUES ($1, $2, $3, $4, $5, $6, $7)\n       RETURNING id, project_id, title, description, status, priority, due_at, tags, created_at, updated_at",
      [
        projectId,
        title.trim(),
        (description as string | null | undefined) ?? null,
        statusValue,
        priorityValue,
        dueAtValue,
        tags,
      ],
    );

    return NextResponse.json(
      { task: rowToTaskDto(result.rows[0]!) },
      { status: 201 },
    );
  } catch (e) {
    // Foreign key violation -> project not found
    const anyErr = e as { code?: string; message?: string };
    if (anyErr.code === "23503") {
      return jsonError(404, "Project not found");
    }
    console.error(e);
    return jsonError(500, "Failed to create task");
  }
}
