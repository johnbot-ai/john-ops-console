import styles from "./Badge.module.css";

export type BadgeVariant = "default" | "accent" | "danger" | "success";

export function Badge(props: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}) {
  const v = props.variant ?? "default";
  const cls = [styles.badge, v !== "default" ? styles[v as keyof typeof styles] : "", props.className]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={cls}>
      {props.dot ? <span className={styles.dot} /> : null}
      {props.children}
    </span>
  );
}
