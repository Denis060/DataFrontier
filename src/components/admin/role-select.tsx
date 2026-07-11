"use client";

import { useState, useTransition } from "react";
import { setUserRole } from "@/app/admin/users/actions";

const ROLES = ["reader", "author", "editor", "admin"] as const;

export function RoleSelect({
  userId,
  role,
  disabled,
}: {
  userId: string;
  role: string;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(role);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onChange(next: string) {
    const prev = value;
    setValue(next);
    setError(null);
    start(async () => {
      const res = await setUserRole(userId, next);
      if ("error" in res) {
        setValue(prev);
        setError(res.error);
      }
    });
  }

  if (disabled) {
    return (
      <span className="rounded border border-border px-2.5 py-1 text-[12px] text-muted">
        {role} · you
      </span>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <select
        value={value}
        disabled={pending}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border border-border bg-surface-1 px-2 py-1 text-[12px] outline-none focus:border-gold/40 disabled:opacity-50"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      {error && <span className="text-[11px] text-red">{error}</span>}
    </span>
  );
}
