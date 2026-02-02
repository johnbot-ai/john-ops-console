import styles from "./Button.module.css";

export type ButtonVariant = "default" | "primary" | "ghost" | "danger";
export type ButtonSize = "md" | "sm";

export function Button(props: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  const { children, onClick, type = "button", disabled, variant = "default", size = "md" } = props;
  const variantClass = (variant !== "default" ? styles[variant as keyof typeof styles] : "") ?? "";
  const cls = [
    styles.btn,
    variantClass,
    size === "sm" ? styles.sm : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={cls} type={type} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
