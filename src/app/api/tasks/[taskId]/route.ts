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
  _req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const { taskId } = await params;
  if (!isUuid(taskId)) {
    return jsonError(400, "Invalid taskId");
  }

  const { rows } = await sql`
    SELECT id, project_id, title, description, status, priority, due_at, tags, created_at, updated_at
    FROM tasks
    WHERE id = ${taskId}
    LIMIT 1
  `;

  const task = rows[0];
  if (!task) {
    return jsonError(404, "Task not found");
  }

  return NextResponse.json({ task: rowToTaskDto(task) });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const { taskId } = await params;
  if (!isUuid(taskId)) {
    return jsonError(400, "Invalid taskId");
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

  const updatableKeys = [
    "projectId",
    "title",
    "description",
    "status",
    "priority",
    "dueAt",
    "tags",
  ] as const;

  const hasAny = updatableKeys.some((k) =>
    Object.prototype.hasOwnProperty.call(body, k),
  );
  if (!hasAny) {
    return jsonError(400, "No updatable fields provided");
  }

  const current = await sql`
    SELECT id, project_id, title, description, status, priority, due_at, tags, created_at, updated_at
    FROM tasks
    WHERE id = ${taskId}
    LIMIT 1
  `;

  const currentTask = current.rows[0];
  if (!currentTask) {
    return jsonError(404, "Task not found");
  }

  const hasProjectId = Object.prototype.hasOwnProperty.call(body, "projectId");
  const hasTitle = Object.prototype.hasOwnProperty.call(body, "title");
  const hasDescription = Object.prototype.hasOwnProperty.call(body, "description");
  const hasStatus = Object.prototype.hasOwnProperty.call(body, "status");
  const hasPriority = Object.prototype.hasOwnProperty.call(body, "priority");
  const hasDueAt = Object.prototype.hasOwnProperty.call(body, "dueAt");
  const hasTags = Object.prototype.hasOwnProperty.call(body, "tags");

  const projectId = (body as { projectId?: unknown }).projectId;
  const title = (body as { title?: unknown }).title;
  const description = (body as { description?: unknown }).description;
  const status = (body as { status?: unknown }).status;
  const priority = (body as { priority?: unknown }).priority;
  const dueAt = (body as { dueAt?: unknown }).dueAt;
  const tagsInput = (body as { tags?: unknown }).tags;

  let nextProjectId: string;
  let nextTitle: string;
  let nextDescription: string | null;
  let nextStatus: string;
  let nextPriority: string;

  try {
    nextProjectId = hasProjectId
      ? (() => {
          if (typeof projectId !== "string" || !isUuid(projectId)) {
            throw new Error("projectId must be a UUID");
          }
          return projectId;
        })()
      : (currentTask.project_id as string);

    nextTitle = hasTitle
      ? (() => {
          if (typeof title !== "string" || title.trim().length === 0) {
            throw new Error("title must be a non-empty string");
          }
          return title.trim();
        })()
      : (currentTask.title as string);

    nextDescription = hasDescription
      ? (() => {
          if (description != null && typeof description !== "string") {
            throw new Error("description must be a string or null");
          }
          return (description as string | null) ?? null;
        })()
      : ((currentTask.description as string | null) ?? null);

    nextStatus = hasStatus
      ? (() => {
          if (typeof status !== "string" || !isTaskStatus(status)) {
            throw new Error(
              `status must be one of: ${TASK_STATUSES.join(", ")}`,
            );
          }
          return status;
        })()
      : (currentTask.status as string);

    nextPriority = hasPriority
      ? (() => {
          if (typeof priority !== "string" || !isTaskPriority(priority)) {
            throw new Error(
              `priority must be one of: ${TASK_PRIORITIES.join(", ")}`,
            );
          }
          return priority;
        })()
      : (currentTask.priority as string);
  } catch (e) {
    return jsonError(400, (e as Error).message);
  }

  let nextDueAt: string | null;
  try {
    nextDueAt = hasDueAt
      ? parseOptionalIsoDate(dueAt)
      : currentTask.due_at
        ? new Date(String(currentTask.due_at)).toISOString()
        : null;
  } catch (e) {
    return jsonError(400, (e as Error).message);
  }

  let nextTags: string[];
  try {
    if (hasTags) {
      // allow null to mean "clear"
      nextTags = tagsInput === null ? [] : normalizeTags(tagsInput);
    } else {
      nextTags = Array.isArray(currentTask.tags)
        ? (currentTask.tags as string[])
        : [];
    }
  } catch (e) {
    return jsonError(400, (e as Error).message);
  }

  try {
    const result = await sql.query(
      "UPDATE tasks\n       SET project_id = $1,\n           title = $2,\n           description = $3,\n           status = $4,\n           priority = $5,\n           due_at = $6,\n           tags = $7\n       WHERE id = $8\n       RETURNING id, project_id, title, description, status, priority, due_at, tags, created_at, updated_at",
      [
        nextProjectId,
        nextTitle,
        nextDescription,
        nextStatus,
        nextPriority,
        nextDueAt,
        nextTags,
        taskId,
      ],
    );

    const updated = result.rows[0];
    if (!updated) {
      return jsonError(404, "Task not found");
    }

    return NextResponse.json({ task: rowToTaskDto(updated) });
  } catch (e) {
    const anyErr = e as { code?: string };
    // Foreign key violation when moving to a non-existent project
    if (anyErr.code === "23503") {
      return jsonError(404, "Project not found");
    }
    console.error(e);
    return jsonError(500, "Failed to update task");
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const { taskId } = await params;
  if (!isUuid(taskId)) {
    return jsonError(400, "Invalid taskId");
  }

  const result = await sql`
    DELETE FROM tasks
    WHERE id = ${taskId}
  `;

  if (result.rowCount === 0) {
    return jsonError(404, "Task not found");
  }

  return new NextResponse(null, { status: 204 });
}
