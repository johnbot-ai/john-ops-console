export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { Shell } from "@/components/Shell";
import { Card, CardInner } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { sql } from "@/lib/db";

export default function NewProjectPage() {
  async function create(formData: FormData) {
    "use server";

    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (!title) {
      return;
    }

    const { rows } = await sql`
      INSERT INTO projects (title, description)
      VALUES (${title}, ${description || null})
      RETURNING id
    `;

    redirect(`/projects/${rows[0].id}`);
  }

  return (
    <Shell title="New project" subtitle="Keep it small, name it clearly.">
      <Card>
        <CardInner>
          <form action={create} style={{ display: "grid", gap: 12, maxWidth: 620 }}>
            <Field label="Title">
              <Input name="title" placeholder="e.g. John Ops Console" required />
            </Field>
            <Field label="Description" hint="Optional. One sentence is enough.">
              <Textarea name="description" placeholder="What is this project for?" />
            </Field>
            <div style={{ display: "flex", gap: 10 }}>
              <Button type="submit" variant="primary">Create</Button>
              <Button variant="ghost" onClick={() => history.back()}>Cancel</Button>
            </div>
          </form>
        </CardInner>
      </Card>
    </Shell>
  );
}
