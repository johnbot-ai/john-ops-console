import styles from "./Table.module.css";

export function TableWrap(props: { children: React.ReactNode; className?: string }) {
  return <div className={[styles.tableWrap, props.className].filter(Boolean).join(" ")}>{props.children}</div>;
}

export function Table(props: { children: React.ReactNode }) {
  return <table className={styles.table}>{props.children}</table>;
}

export function Th(props: { children: React.ReactNode; right?: boolean }) {
  return <th className={[styles.th, props.right ? styles.right : ""].filter(Boolean).join(" ")}>{props.children}</th>;
}

export function Td(props: { children: React.ReactNode; mono?: boolean; right?: boolean }) {
  return (
    <td className={[styles.td, props.mono ? styles.mono : "", props.right ? styles.right : ""].filter(Boolean).join(" ")}>
      {props.children}
    </td>
  );
}

export function Tr(props: { children: React.ReactNode }) {
  return <tr className={styles.tr}>{props.children}</tr>;
}
