"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import styles from "./Toast.module.css";

type ToastKind = "info" | "success" | "error";

type ToastItem = {
  id: string;
  kind: ToastKind;
  title: string;
  message?: string;
};

type ToastApi = {
  show: (t: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider(props: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((xs) => xs.filter((x) => x.id !== id));
  }, []);

  const show = useCallback((t: Omit<ToastItem, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const item: ToastItem = { id, ...t };
    setItems((xs) => [item, ...xs].slice(0, 4));
    window.setTimeout(() => dismiss(id), 3800);
  }, [dismiss]);

  const api = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {props.children}
      <div className={styles.wrap} aria-live="polite" aria-relevant="additions removals">
        {items.map((t) => (
          <div key={t.id} className={styles.toast}>
            <div className={[styles.icon, t.kind === "success" ? styles.ok : "", t.kind === "error" ? styles.bad : ""].filter(Boolean).join(" ")}>
              {t.kind === "success" ? "✓" : t.kind === "error" ? "!" : "i"}
            </div>
            <div>
              <div className={styles.title}>{t.title}</div>
              {t.message ? <div className={styles.msg}>{t.message}</div> : null}
            </div>
            <button className={styles.close} onClick={() => dismiss(t.id)} type="button">
              Close
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
