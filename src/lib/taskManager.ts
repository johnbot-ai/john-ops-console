export const TASK_STATUSES = ["inbox", "todo", "doing", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "med", "high"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export type ProjectDto = {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskDto = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export function isUuid(value: string): boolean {
  // RFC 4122 UUID (v1-v5)
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function isTaskStatus(value: string): value is TaskStatus {
  return (TASK_STATUSES as readonly string[]).includes(value);
}

export function isTaskPriority(value: string): value is TaskPriority {
  return (TASK_PRIORITIES as readonly string[]).includes(value);
}

export function normalizeTags(input: unknown): string[] {
  if (input == null) return [];
  if (!Array.isArray(input)) {
    throw new Error("tags must be an array of strings");
  }
  const tags = input
    .map((t) => (typeof t === "string" ? t.trim() : ""))
    .filter((t) => t.length > 0);

  // de-dupe while preserving order
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const t of tags) {
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(t);
  }

  return unique;
}

export function rowToProjectDto(row: Record<string, unknown>): ProjectDto {
  return {
    id: String(row.id),
    title: String(row.title),
    description: (row.description as string | null) ?? null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export function rowToTaskDto(row: Record<string, unknown>): TaskDto {
  const tags = Array.isArray(row.tags) ? (row.tags as string[]) : [];

  return {
    id: String(row.id),
    projectId: String(row.project_id),
    title: String(row.title),
    description: (row.description as string | null) ?? null,
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    dueAt: row.due_at ? new Date(String(row.due_at)).toISOString() : null,
    tags,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}
