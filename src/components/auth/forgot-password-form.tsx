"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const input =
  "w-full rounded border border-border bg-surface-1 px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-gold/40 focus:bg-surface-2";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const db = createClient();
    const { error } = await db.auth.resetPasswordForEmail(email, {
      // Lands on the PKCE callback, which exchanges the code for a session and
      // forwards to /reset-password where the new password is set.
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setPending(false);
    if (error) return setError(error.message);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="w-full max-w-[400px]">
        <p className="rounded border border-teal/30 bg-teal-dim px-5 py-6 text-sm text-teal">
          If an account exists for <strong>{email}</strong>, we&apos;ve sent a link to reset your
          password. Check your inbox (and spam).
        </p>
        <p className="mt-6 text-[13px] text-muted">
          <Link href="/login" className="text-gold hover:underline">
            ← Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[400px]">
      <h1 className="mb-2 font-serif text-[32px] leading-tight font-black tracking-[-0.8px]">
        Reset your password
      </h1>
      <p className="mb-8 text-sm text-muted">
        Enter the email for your account and we&apos;ll send a link to set a new password.
      </p>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label htmlFor="email" className="sr-only">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={input}
        />
        <button
          type="submit"
          disabled={pending}
          className="mt-1 inline-flex items-center justify-center gap-2 rounded bg-gold px-4 py-3 text-sm font-bold text-on-accent transition-opacity hover:opacity-85 disabled:opacity-60"
        >
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Send reset link
        </button>
      </form>

      <p className="mt-4 min-h-5 text-[13px]" aria-live="polite">
        {error && <span className="text-red">{error}</span>}
      </p>

      <p className="mt-6 text-[13px] text-muted">
        <Link href="/login" className="text-gold hover:underline">
          ← Back to sign in
        </Link>
      </p>
    </div>
  );
}
