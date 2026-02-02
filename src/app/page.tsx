export const dynamic = "force-dynamic";

import Link from "next/link";
import { Shell } from "@/components/Shell";
import { KpiCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { countTasksByStatus } from "@/lib/queries";

export default async function DashboardPage() {
  const counts = await countTasksByStatus();
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <Shell
      title="Dashboard"
      subtitle="Fast read on what matters right now."
      right={
        <Link href="/projects">
          <Button variant="primary">Open projects</Button>
        </Link>
      }
    >
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
          <KpiCard title="Total tasks" value={String(total)} hint="across all projects" />
          <KpiCard title="Doing" value={String(counts.doing ?? 0)} hint="in progress" />
          <KpiCard title="Overdue" value="0" hint="(coming soon)" />
        </div>

        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 14, background: "rgba(0,0,0,.35)" }}>
          <div style={{ fontSize: 14, color: "var(--muted)", marginBottom: 8 }}>Quick links</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/projects"><Button>Projects</Button></Link>
            <Link href="/api/projects"><Button variant="ghost">Projects API</Button></Link>
            <Link href="/api/health"><Button variant="ghost">Health check</Button></Link>
          </div>
        </div>
      </div>
    </Shell>
  );
}
