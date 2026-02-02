export const dynamic = "force-dynamic";

import { Shell } from "@/components/Shell";
import { TaskEditor } from "@/components/TaskEditor";

export default async function TaskDetailPage(props: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await props.params;

  return (
    <Shell title="Task detail" subtitle={taskId}>
      <TaskEditor taskId={taskId} />
    </Shell>
  );
}
