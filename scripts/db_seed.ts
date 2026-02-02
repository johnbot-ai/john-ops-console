import { sql } from "@vercel/postgres";

type SeedProject = {
  title: string;
  description?: string;
};

type SeedTask = {
  title: string;
  description?: string;
  status?: "inbox" | "todo" | "doing" | "done";
  priority?: "low" | "med" | "high";
  dueAt?: string | null;
  tags?: string[];
};

async function getOrCreateProject(input: SeedProject) {
  const existing = await sql`
    SELECT id, title
    FROM projects
    WHERE title = ${input.title}
    LIMIT 1
  `;

  if (existing.rows[0]) return existing.rows[0] as { id: string; title: string };

  const created = await sql`
    INSERT INTO projects (title, description)
    VALUES (${input.title}, ${input.description ?? null})
    RETURNING id, title
  `;

  return created.rows[0] as { id: string; title: string };
}

async function getOrCreateTask(projectId: string, input: SeedTask) {
  const existing = await sql`
    SELECT id, title
    FROM tasks
    WHERE project_id = ${projectId} AND title = ${input.title}
    LIMIT 1
  `;

  if (existing.rows[0]) return existing.rows[0] as { id: string; title: string };

  const dueAt = input.dueAt ?? null;
  const tags = input.tags ?? [];

  const created = await sql.query(
    "INSERT INTO tasks (project_id, title, description, status, priority, due_at, tags)\n     VALUES ($1, $2, $3, $4, $5, $6, $7)\n     RETURNING id, title",
    [
      projectId,
      input.title,
      input.description ?? null,
      input.status ?? "inbox",
      input.priority ?? "med",
      dueAt,
      tags,
    ],
  );

  return created.rows[0] as { id: string; title: string };
}

async function main() {
  if (!process.env.POSTGRES_URL) {
    // @vercel/postgres uses POSTGRES_URL by default.
    throw new Error(
      "Missing POSTGRES_URL. Set it in your environment before running db:seed.",
    );
  }

  const demo = await getOrCreateProject({
    title: "Demo Project",
    description: "Seeded project for local testing",
  });

  await getOrCreateTask(demo.id, {
    title: "Inbox item",
    status: "inbox",
    priority: "low",
    tags: ["seed", "demo"],
  });

  await getOrCreateTask(demo.id, {
    title: "First TODO",
    status: "todo",
    priority: "med",
    dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["demo"],
  });

  console.log(`Seed complete. Project: ${demo.title} (${demo.id})`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
