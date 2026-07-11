"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const input =
  "w-full rounded border border-border bg-surface-1 px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-gold/40 focus:bg-surface-2";

export function SetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("Those passwords don't match.");
    setPending(true);
    setError(null);

    const db = createClient();
    const { error } = await db.auth.updateUser({ password });
    setPending(false);
    if (error) return setError(error.message);
    setDone(true);
    router.refresh();
  }

  if (done) {
    return (
      <div className="w-full max-w-[400px]">
        <p className="rounded border border-teal/30 bg-teal-dim px-5 py-6 text-sm text-teal">
          Your password has been updated and you&apos;re signed in.
        </p>
        <p className="mt-6 text-[13px]">
          <Link href="/" className="text-gold hover:underline">
            Go to Everyday Data Science →
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[400px]">
      <h1 className="mb-2 font-serif text-[32px] leading-tight font-black tracking-[-0.8px]">
        Set a new password
      </h1>
      <p className="mb-8 text-sm text-muted">Choose a new password for your account.</p>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label htmlFor="password" className="sr-only">
          New password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="New password (8+ characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={input}
        />
        <label htmlFor="confirm" className="sr-only">
          Confirm new password
        </label>
        <input
          id="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={input}
        />
        <button
          type="submit"
          disabled={pending}
          className="mt-1 inline-flex items-center justify-center gap-2 rounded bg-gold px-4 py-3 text-sm font-bold text-on-accent transition-opacity hover:opacity-85 disabled:opacity-60"
        >
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Update password
        </button>
      </form>

      <p className="mt-4 min-h-5 text-[13px]" aria-live="polite">
        {error && <span className="text-red">{error}</span>}
      </p>
    </div>
  );
}
