import styles from "./Input.module.css";

export function Field(props: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className={styles.field}>
      <div className={styles.label}>{props.label}</div>
      {props.children}
      {props.hint ? <div className={styles.hint}>{props.hint}</div> : null}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={[styles.input, props.className].filter(Boolean).join(" ")} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={[styles.textarea, props.className].filter(Boolean).join(" ")} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={[styles.select, props.className].filter(Boolean).join(" ")} />;
}
