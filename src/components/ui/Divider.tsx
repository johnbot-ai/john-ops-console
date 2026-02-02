import styles from "./Divider.module.css";

export function Divider(props: { className?: string }) {
  return <div className={[styles.hr, props.className].filter(Boolean).join(" ")} />;
}
