export const dynamic = "force-dynamic";

import { Shell } from "@/components/Shell";
import { TasksTable } from "@/components/TasksTable";

export default function TasksPage() {
  return (
    <Shell title="Tasks" subtitle="All tasks across all projects.">
      <TasksTable />
    </Shell>
  );
}
