"use client";

import { TaskDto, ProjectDto } from "@/lib/taskManager";

export type ApiError = { message: string; status?: number };

async function readJson<T>(res: Response): Promise<T> {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return (await res.json()) as T;
  // Fall back to text for debugging.
  const text = await res.text();
  throw { message: text || `Unexpected response (${res.status})`, status: res.status } as ApiError;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await (async () => {
      try {
        return (await readJson<unknown>(res)) as unknown;
      } catch {
        return null;
      }
    })();

    const msg =
      body && typeof body === "object" && ("error" in body || "message" in body)
        ? String((body as Record<string, unknown>).error ?? (body as Record<string, unknown>).message)
        : `Request failed (${res.status})`;

    throw {
      message: msg,
      status: res.status,
    } as ApiError;
  }
  return readJson<T>(res);
}

export async function listProjectsClient() {
  return api<{ projects: ProjectDto[] }>("/api/projects");
}

export async function listTasksClient() {
  return api<{ tasks: TaskDto[] }>("/api/tasks");
}

export async function getTaskClient(taskId: string) {
  return api<{ task: TaskDto }>(`/api/tasks/${taskId}`);
}

export async function patchTaskClient(taskId: string, patch: Partial<TaskDto>) {
  return api<{ task: TaskDto }>(`/api/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteTaskClient(taskId: string) {
  return api<{ ok: true }>(`/api/tasks/${taskId}`, { method: "DELETE" });
}
