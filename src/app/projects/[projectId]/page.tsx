export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { Shell } from "@/components/Shell";
import { Card, CardInner } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
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
            <Card key={t.id}>
              <CardInner>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 650 }}>{t.title}</div>
                    <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                      {t.status} • {t.priority}
                      {t.dueAt ? ` • due ${new Date(t.dueAt).toLocaleString()}` : ""}
                    </div>
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>updated {new Date(t.updatedAt).toLocaleString()}</div>
                </div>
              </CardInner>
            </Card>
          ))}
          {tasks.length === 0 ? <div className="muted">No tasks yet.</div> : null}
        </div>
      </div>
    </Shell>
  );
}
