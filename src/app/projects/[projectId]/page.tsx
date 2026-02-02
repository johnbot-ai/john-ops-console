export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { Shell } from "@/components/Shell";
import { Card, CardInner } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { TaskRow } from "@/components/TaskRow";
import { getProject, listTasksForProject } from "@/lib/queries";
import { sql } from "@/lib/db";

export default async function ProjectDetailPage(props: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await props.params;
  const project = await getProject(projectId);
  if (!project) return notFound();

  const tasks = await listTasksForProject(projectId);

  async function createTask(formData: FormData) {
    "use server";

    const title = String(formData.get("title") ?? "").trim();
    const status = String(formData.get("status") ?? "todo");
    const priority = String(formData.get("priority") ?? "med");

    if (!title) return;

    await sql`
      INSERT INTO tasks (project_id, title, status, priority)
      VALUES (${projectId}, ${title}, ${status}, ${priority})
    `;

    redirect(`/projects/${projectId}`);
  }

  async function moveTask(formData: FormData) {
    "use server";

    const taskId = String(formData.get("taskId") ?? "");
    const status = String(formData.get("status") ?? "");

    if (!taskId || !status) return;

    await sql`
      UPDATE tasks
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${taskId} AND project_id = ${projectId}
    `;

    redirect(`/projects/${projectId}`);
  }

  async function deleteTask(formData: FormData) {
    "use server";

    const taskId = String(formData.get("taskId") ?? "");
    if (!taskId) return;

    await sql`
      DELETE FROM tasks
      WHERE id = ${taskId} AND project_id = ${projectId}
    `;

    redirect(`/projects/${projectId}`);
  }

  return (
    <Shell title={project.title} subtitle={project.description || ""} right={<Button onClick={() => redirect("/projects")}>All projects</Button>}>
      <div style={{ display: "grid", gap: 12 }}>
        <Card>
          <CardInner>
            <form action={createTask} style={{ display: "grid", gap: 10, gridTemplateColumns: "2fr 1fr 1fr auto" }}>
              <Field label="New task">
                <Input name="title" placeholder="What are you doing?" />
              </Field>
              <Field label="Status">
                <Select name="status" defaultValue="todo">
                  <option value="inbox">inbox</option>
                  <option value="todo">todo</option>
                  <option value="doing">doing</option>
                  <option value="done">done</option>
                </Select>
              </Field>
              <Field label="Priority">
                <Select name="priority" defaultValue="med">
                  <option value="low">low</option>
                  <option value="med">med</option>
                  <option value="high">high</option>
                </Select>
              </Field>
              <div style={{ alignSelf: "end" }}>
                <Button type="submit" variant="primary">Add</Button>
              </div>
            </form>
          </CardInner>
        </Card>

        <div style={{ display: "grid", gap: 10 }}>
          {tasks.map((t) => (
            <div key={t.id}>
              <TaskRow task={t} />

              <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
                <form action={moveTask}>
                  <input type="hidden" name="taskId" value={t.id} />
                  <input type="hidden" name="status" value={t.status === "doing" ? "todo" : "doing"} />
                  <Button size="sm">{t.status === "doing" ? "To-do" : "Doing"}</Button>
                </form>

                <form action={moveTask}>
                  <input type="hidden" name="taskId" value={t.id} />
                  <input type="hidden" name="status" value={t.status === "done" ? "todo" : "done"} />
                  <Button size="sm" variant={t.status === "done" ? "ghost" : "primary"}>
                    {t.status === "done" ? "Reopen" : "Done"}
                  </Button>
                </form>

                <form action={deleteTask}>
                  <input type="hidden" name="taskId" value={t.id} />
                  <Button size="sm" variant="danger">Delete</Button>
                </form>
              </div>
            </div>
          ))}
          {tasks.length === 0 ? <div className="muted">No tasks yet.</div> : null}
        </div>
      </div>
    </Shell>
  );
}
