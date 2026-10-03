"use client";

import { useState, useTransition } from "react";
import { setTrusted } from "@/app/admin/users/actions";

/**
 * A writer an admin trusts publishes their own cheat sheets without review.
 * Shown for authors only; editors and admins can publish anyway.
 */
export function TrustedToggle({ userId, trusted }: { userId: string; trusted: boolean }) {
  const [on, setOn] = useState(trusted);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Trusted: publishes cheat sheets without review"
        title="Trusted writers publish their own cheat sheets without review"
        disabled={pending}
        onClick={() => {
          const next = !on;
          setOn(next);
          setError(null);
          start(async () => {
            const res = await setTrusted(userId, next);
            if ("error" in res) {
              setOn(!next);
              setError(res.error);
            }
          });
        }}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50 ${on ? "bg-teal" : "bg-surface-2"}`}
      >
        <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
      </button>
      <span className={`text-[12px] ${on ? "font-semibold text-teal" : "text-muted"}`}>{on ? "Trusted" : "Reviewed"}</span>
      {error && <span className="text-[11px] text-red">{error}</span>}
    </span>
  );
}
