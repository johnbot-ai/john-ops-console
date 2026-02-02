"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Shell.module.css";

export function Shell(props: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => (pathname === href ? styles.active : "");

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandTitle}>John Ops Console</div>
          <div className={styles.brandSub}>Projects • Tasks • Automation</div>
        </div>

        <nav className={styles.nav}>
          <Link className={isActive("/")} href={"/"}>Dashboard</Link>
          <Link className={isActive("/projects")} href={"/projects"}>Projects</Link>
          <Link className={isActive("/today")} href={"/today"}>Today</Link>
        </nav>

        <div style={{ marginTop: 18, color: "var(--muted-2)", fontSize: 12 }}>
          Tip: keep tasks small; the app will nag you.
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <div className={styles.h1}>{props.title}</div>
            {props.subtitle ? <div className={styles.hint}>{props.subtitle}</div> : null}
          </div>
          {props.right ? <div>{props.right}</div> : null}
        </div>

        {props.children}
      </main>
    </div>
  );
}
