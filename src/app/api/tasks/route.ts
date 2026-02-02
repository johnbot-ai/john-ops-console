import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { rowToTaskDto } from "@/lib/taskManager";

export async function GET() {
  const { rows } = await sql`
    SELECT id, project_id, title, description, status, priority, due_at, tags, created_at, updated_at
    FROM tasks
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
    LIMIT 200
  `;

  return NextResponse.json({ tasks: rows.map(rowToTaskDto) });
}
