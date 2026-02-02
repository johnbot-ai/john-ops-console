"use client";

import { useEffect } from "react";
import styles from "./Modal.module.css";

export function Modal(props: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
}) {
  const { open, onClose } = props;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onMouseDown={props.onClose}>
      <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.title}>{props.title}</div>
          <button className={styles.close} type="button" onClick={props.onClose} aria-label="Close">
            Close
          </button>
        </div>
        <div className={styles.body}>{props.children}</div>
        {props.footer ? <div className={styles.footer}>{props.footer}</div> : null}
      </div>
    </div>
  );
}
