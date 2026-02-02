export const dynamic = "force-dynamic";

import Link from "next/link";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { TaskRow } from "@/components/TaskRow";
import { listTodayTasks } from "@/lib/queries";

export default async function TodayPage() {
  const tasks = await listTodayTasks();

  return (
    <Shell
      title="Today"
      subtitle="Due in the next 24 hours (not done)."
      right={
        <Link href="/projects">
          <Button variant="ghost">Projects</Button>
        </Link>
      }
    >
      <div style={{ display: "grid", gap: 10 }}>
        {tasks.length === 0 ? <div className="muted">Nothing due soon.</div> : null}
        {tasks.map((t) => (
          <TaskRow key={t.id} task={t} />
        ))}
      </div>
    </Shell>
  );
}
