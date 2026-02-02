export const dynamic = "force-dynamic";

import Link from "next/link";
import { Shell } from "@/components/Shell";
import { Card, CardInner } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { listProjects } from "@/lib/queries";

export default async function ProjectsPage() {
  const projects = await listProjects();

  return (
    <Shell title="Projects" subtitle="Where tasks live.">
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/projects/new">
            <Button variant="primary">New project</Button>
          </Link>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {projects.length === 0 ? (
            <div className="muted">No projects yet. Create one.</div>
          ) : null}
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card>
                <CardInner>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 650 }}>{p.title}</div>
                      {p.description ? <div className="muted" style={{ marginTop: 4 }}>{p.description}</div> : null}
                    </div>
                    <div className="muted" style={{ fontSize: 13 }}>updated {new Date(p.updatedAt).toLocaleString()}</div>
                  </div>
                </CardInner>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </Shell>
  );
}
