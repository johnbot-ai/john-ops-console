import styles from "./Card.module.css";

export function Card(props: { children: React.ReactNode; className?: string }) {
  return <div className={[styles.card, props.className].filter(Boolean).join(" ")}>{props.children}</div>;
}

export function CardInner(props: { children: React.ReactNode }) {
  return <div className={styles.inner}>{props.children}</div>;
}

export function KpiCard(props: { title: string; value: string; hint?: string }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>{props.title}</div>
          <div className={styles.kpi}>{props.value}</div>
        </div>
        {props.hint ? <div className="muted">{props.hint}</div> : null}
      </div>
    </div>
  );
}
