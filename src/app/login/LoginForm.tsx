"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();

  const safeNextPath = useMemo(() => {
    return nextPath && nextPath.startsWith("/") ? nextPath : "/";
  }, [nextPath]);

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = (await res.json().catch(() => null)) as
        | { ok: boolean; error?: string }
        | null;

      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "Login failed");
        return;
      }

      router.replace(safeNextPath);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
      <label style={{ display: "grid", gap: 6 }}>
        <span>Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          style={{ padding: 10, fontSize: 16 }}
        />
      </label>

      {error ? (
        <div role="alert" style={{ color: "crimson" }}>{error}</div>
      ) : null}

      <button
        type="submit"
        disabled={loading || password.length === 0}
        style={{ padding: 10, fontSize: 16 }}
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
