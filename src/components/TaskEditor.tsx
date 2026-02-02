"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TaskDto } from "@/lib/taskManager";
import { parseTags, tagsToString } from "@/lib/format";
import { deleteTaskClient, getTaskClient, patchTaskClient } from "@/lib/apiClient";
import { errorMessage } from "@/lib/errors";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardInner } from "@/components/ui/Card";
import { Divider } from "@/components/ui/Divider";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import styles from "./TaskEditor.module.css";

function toLocalDateTimeValue(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // Convert to YYYY-MM-DDTHH:mm in local time.
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TaskEditor(props: { taskId: string; initial?: TaskDto }) {
  const toast = useToast();

  const [loading, setLoading] = useState(!props.initial);
  const [task, setTask] = useState<TaskDto | null>(props.initial ?? null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const statusOptions = ["inbox", "todo", "doing", "done"] as const;
  type StatusOpt = (typeof statusOptions)[number];

  const priorityOptions = ["low", "med", "high"] as const;
  type PriorityOpt = (typeof priorityOptions)[number];

  const [status, setStatus] = useState<StatusOpt>("todo");
  const [priority, setPriority] = useState<PriorityOpt>("med");
  const [tagsRaw, setTagsRaw] = useState("");
  const [dueAtLocal, setDueAtLocal] = useState("");

  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (props.initial) {
      setTask(props.initial);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const res = await getTaskClient(props.taskId);
        setTask(res.task);
      } catch (e: unknown) {
        toast.show({ kind: "error", title: "Failed to load task", message: errorMessage(e) });
      } finally {
        setLoading(false);
      }
    })();
  }, [props.initial, props.taskId, toast]);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title ?? "");
    setDescription(task.description ?? "");
    setStatus(task.status);
    setPriority(task.priority);
    setTagsRaw(tagsToString(task.tags));
    setDueAtLocal(toLocalDateTimeValue(task.dueAt));
  }, [task]);

  const dirty = useMemo(() => {
    if (!task) return false;
    const nextTags = parseTags(tagsRaw);
    const nextDueAt = dueAtLocal ? new Date(dueAtLocal).toISOString() : null;
    return (
      title !== task.title ||
      description !== (task.description ?? "") ||
      status !== task.status ||
      priority !== task.priority ||
      JSON.stringify(nextTags) !== JSON.stringify(task.tags ?? []) ||
      (task.dueAt ?? null) !== nextDueAt
    );
  }, [task, title, description, status, priority, tagsRaw, dueAtLocal]);

  async function save() {
    if (!task) return;
    try {
      setSaving(true);
      const patch: Partial<TaskDto> = {
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        tags: parseTags(tagsRaw),
        dueAt: dueAtLocal ? new Date(dueAtLocal).toISOString() : null,
      };
      const res = await patchTaskClient(task.id, patch);
      setTask(res.task);
      toast.show({ kind: "success", title: "Saved" });
    } catch (e: unknown) {
      toast.show({ kind: "error", title: "Save failed", message: errorMessage(e) });
    } finally {
      setSaving(false);
    }
  }

  async function doDelete() {
    if (!task) return;
    try {
      setSaving(true);
      await deleteTaskClient(task.id);
      toast.show({ kind: "success", title: "Deleted" });
      location.href = "/tasks";
    } catch (e: unknown) {
      toast.show({ kind: "error", title: "Delete failed", message: errorMessage(e) });
    } finally {
      setSaving(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className={styles.headerRow}>
        <div>
          <div className={styles.title}>Task</div>
          <div className="muted">Edit fields, then save. Basic but fast.</div>
        </div>
        <div className={styles.actions}>
          <Link href="/tasks">
            <Button variant="ghost">Back to tasks</Button>
          </Link>
          <Button variant="primary" onClick={save} disabled={!dirty || saving || loading}>
            {saving ? "Saving…" : dirty ? "Save" : "Saved"}
          </Button>
        </div>
      </div>

      {loading ? <div className="muted">Loading…</div> : null}
      {!loading && !task ? <div className="muted">Task not found.</div> : null}

      {task ? (
        <div className={styles.grid}>
          <Card>
            <CardInner>
              <div style={{ display: "grid", gap: 12 }}>
                <Field label="Title">
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" />
                </Field>

                <Field label="Description" hint="Optional">
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Notes…" />
                </Field>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Field label="Status">
                    <Select
                      value={status}
                      onChange={(e) => {
                        const v = e.target.value;
                        if ((statusOptions as readonly string[]).includes(v)) setStatus(v as StatusOpt);
                      }}
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Priority">
                    <Select
                      value={priority}
                      onChange={(e) => {
                        const v = e.target.value;
                        if ((priorityOptions as readonly string[]).includes(v)) setPriority(v as PriorityOpt);
                      }}
                    >
                      {priorityOptions.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Field label="Tags" hint="Comma-separated">
                    <Input value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} placeholder="ops, urgent" />
                  </Field>
                  <Field label="Due">
                    <Input value={dueAtLocal} onChange={(e) => setDueAtLocal(e.target.value)} type="datetime-local" />
                  </Field>
                </div>

                <Divider />

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Badge variant={status === "doing" ? "accent" : status === "done" ? "success" : "default"}>
                    {status}
                  </Badge>
                  <Badge>{priority}</Badge>
                  {(parseTags(tagsRaw) ?? []).slice(0, 6).map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                </div>
              </div>
            </CardInner>
          </Card>

          <div style={{ display: "grid", gap: 12 }}>
            <Card>
              <CardInner>
                <div className={styles.kv}>
                  <div className={styles.k}>Task ID</div>
                  <div style={{ wordBreak: "break-all" }}>{task.id}</div>
                  <div className={styles.k}>Project ID</div>
                  <div style={{ wordBreak: "break-all" }}>{task.projectId}</div>
                  <div className={styles.k}>Updated</div>
                  <div>{new Date(task.updatedAt).toLocaleString()}</div>
                  <div className={styles.k}>Created</div>
                  <div>{new Date(task.createdAt).toLocaleString()}</div>
                </div>
              </CardInner>
            </Card>

            <div className={styles.dangerZone}>
              <div className={styles.dangerHeader}>Danger zone</div>
              <div className={styles.dangerBody}>
                <div className="muted" style={{ marginBottom: 10 }}>
                  Deleting a task is permanent.
                </div>
                <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                  Delete task
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <Modal
        open={confirmDelete}
        title="Delete task?"
        onClose={() => setConfirmDelete(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={doDelete}>
              Delete
            </Button>
          </>
        }
      >
        <div className="muted">This can’t be undone.</div>
      </Modal>
    </div>
  );
}
