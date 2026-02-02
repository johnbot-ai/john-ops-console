import { TaskDto } from "@/lib/taskManager";
import { Card, CardInner } from "@/components/ui/Card";
import styles from "./TaskRow.module.css";

function statusClass(status: TaskDto["status"]) {
  if (status === "doing") return `${styles.pill} ${styles.pillDoing}`;
  if (status === "done") return `${styles.pill} ${styles.pillDone}`;
  if (status === "todo") return `${styles.pill} ${styles.pillTodo}`;
  return styles.pill;
}

export function TaskRow(props: { task: TaskDto }) {
  const t = props.task;

  return (
    <Card>
      <CardInner>
        <div className={styles.row}>
          <div className={styles.left}>
            <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
              <div className={styles.title} title={t.title}>
                {t.title}
              </div>
              <div className={styles.meta}>
                <span className={statusClass(t.status)}>{t.status}</span>
                <span style={{ marginLeft: 10 }}>{t.priority}</span>
                {t.dueAt ? (
                  <span style={{ marginLeft: 10 }}>due {new Date(t.dueAt).toLocaleString()}</span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </CardInner>
    </Card>
  );
}
