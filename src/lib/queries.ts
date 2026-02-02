import { sql } from "./db";
import { ProjectDto, rowToProjectDto, rowToTaskDto, TaskDto } from "./taskManager";

export async function listProjects(limit = 50, offset = 0): Promise<ProjectDto[]> {
  const { rows } = await sql`
    SELECT id, title, description, created_at, updated_at
    FROM projects
    ORDER BY updated_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  return rows.map(rowToProjectDto);
}

export async function getProject(projectId: string): Promise<ProjectDto | null> {
  const { rows } = await sql`
    SELECT id, title, description, created_at, updated_at
    FROM projects
    WHERE id = ${projectId}
    LIMIT 1
  `;
  return rows[0] ? rowToProjectDto(rows[0]) : null;
}

export async function listTasksForProject(projectId: string, limit = 100): Promise<TaskDto[]> {
  const { rows } = await sql`
    SELECT id, project_id, title, description, status, priority, due_at, tags, created_at, updated_at
    FROM tasks
    WHERE project_id = ${projectId}
    ORDER BY
      CASE status
        WHEN 'doing' THEN 0
        WHEN 'todo' THEN 1
        WHEN 'inbox' THEN 2
        WHEN 'done' THEN 3
        ELSE 9
      END,
      due_at NULLS LAST,
      updated_at DESC
    LIMIT ${limit}
  `;
  return rows.map(rowToTaskDto);
}

export async function countTasksByStatus(): Promise<Record<string, number>> {
  const { rows } = await sql`
    SELECT status, COUNT(*)::int as count
    FROM tasks
    GROUP BY status
  `;
  const out: Record<string, number> = { inbox: 0, todo: 0, doing: 0, done: 0 };
  for (const r of rows as unknown as Array<{ status: string; count: number }>) {
    out[String(r.status)] = Number(r.count) || 0;
  }
  return out;
}

export async function listTodayTasks(limit = 100): Promise<TaskDto[]> {
  const { rows } = await sql`
    SELECT id, project_id, title, description, status, priority, due_at, tags, created_at, updated_at
    FROM tasks
    WHERE status != 'done'
      AND due_at IS NOT NULL
      AND due_at <= (NOW() + interval '24 hours')
    ORDER BY due_at ASC
    LIMIT ${limit}
  `;
  return rows.map(rowToTaskDto);
}
