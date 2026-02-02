"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listTasksClient } from "@/lib/apiClient";
import { TaskDto } from "@/lib/taskManager";
import { tagsToString } from "@/lib/format";
import { errorMessage } from "@/lib/errors";
import { useToast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/Table";
import styles from "./TasksTable.module.css";

function matchesSearch(t: TaskDto, q: string) {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = `${t.title} ${t.description ?? ""} ${tagsToString(t.tags)}`.toLowerCase();
  return hay.includes(needle);
}

export function TasksTable(props: { initial?: TaskDto[] }) {
  const toast = useToast();
  const [loading, setLoading] = useState(!props.initial);
  const [tasks, setTasks] = useState<TaskDto[]>(props.initial ?? []);

  const [q, setQ] = useState("");
  const statusOptions = ["all", "inbox", "todo", "doing", "done"] as const;
  type StatusOpt = (typeof statusOptions)[number];

  const priorityOptions = ["all", "low", "med", "high"] as const;
  type PriorityOpt = (typeof priorityOptions)[number];

  const [status, setStatus] = useState<StatusOpt>("all");
  const [priority, setPriority] = useState<PriorityOpt>("all");

  useEffect(() => {
    if (props.initial) return;
    (async () => {
      try {
        setLoading(true);
        const res = await listTasksClient();
        setTasks(res.tasks);
      } catch (e: unknown) {
        toast.show({ kind: "error", title: "Failed to load tasks", message: errorMessage(e) });
      } finally {
        setLoading(false);
      }
    })();
  }, [props.initial, toast]);

  const filtered = useMemo(() => {
    return tasks
      .filter((t) => matchesSearch(t, q))
      .filter((t) => (status === "all" ? true : t.status === status))
      .filter((t) => (priority === "all" ? true : t.priority === priority));
  }, [tasks, q, status, priority]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <Field label="Search">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="title, description, tags" />
          </Field>
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

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Badge dot>Showing {filtered.length}</Badge>
          <Button variant="ghost" onClick={() => location.reload()}>Refresh</Button>
        </div>
      </div>

      <TableWrap>
        <Table>
          <thead>
            <Tr>
              <Th>Task</Th>
              <Th>Status</Th>
              <Th>Priority</Th>
              <Th>Due</Th>
              <Th>Tags</Th>
            </Tr>
          </thead>
          <tbody>
            {loading ? (
              <Tr>
                <Td mono={false}>Loading…</Td>
                <Td> </Td>
                <Td> </Td>
                <Td> </Td>
                <Td> </Td>
              </Tr>
            ) : null}

            {!loading && filtered.length === 0 ? (
              <Tr>
                <Td>Nothing found.</Td>
                <Td> </Td>
                <Td> </Td>
                <Td> </Td>
                <Td> </Td>
              </Tr>
            ) : null}

            {filtered.map((t) => (
              <Tr key={t.id}>
                <Td>
                  <Link className={styles.rowLink} href={`/tasks/${t.id}`}>
                    <div className={styles.title}>{t.title}</div>
                    {t.description ? <div className={styles.sub}>{t.description}</div> : null}
                  </Link>
                </Td>
                <Td>
                  <Badge variant={t.status === "doing" ? "accent" : t.status === "done" ? "success" : "default"}>{t.status}</Badge>
                </Td>
                <Td>{t.priority}</Td>
                <Td>{t.dueAt ? new Date(t.dueAt).toLocaleString() : <span className="muted">—</span>}</Td>
                <Td>
                  <div className={styles.tags}>
                    {(t.tags ?? []).slice(0, 4).map((tag) => (
                      <Badge key={tag}>{tag}</Badge>
                    ))}
                    {(t.tags ?? []).length > 4 ? <Badge>+{(t.tags ?? []).length - 4}</Badge> : null}
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>
    </div>
  );
}
