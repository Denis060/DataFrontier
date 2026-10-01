"use client";

import { useActionState } from "react";
import { resendConfirmation, type ResendState } from "@/app/actions/subscribe";

/**
 * What a reader sees right after subscribing. Half of sign-ups were never
 * confirmed, so this says exactly where the email went, who it's from, where
 * it may have landed, and offers a resend.
 */
export function SubscribeSuccess({ email, compact = false }: { email?: string; compact?: boolean }) {
  const [state, action, pending] = useActionState<ResendState, FormData>(resendConfirmation, null);

  return (
    <div className="rounded border border-teal/30 bg-teal-dim px-4 py-3.5 text-[13px] leading-relaxed">
      <p className={`font-serif font-black text-ink ${compact ? "text-base" : "text-lg"}`}>
        One more step: check your inbox
      </p>
      <p className="mt-1 text-muted">
        We sent a confirmation link
        {email ? (
          <>
            {" "}to <strong className="font-semibold text-ink">{email}</strong>
          </>
        ) : null}{" "}
        from <strong className="font-semibold text-ink">Everyday Data Science</strong>. Click it and
        you&apos;re in.
      </p>
      <p className="mt-1 text-muted">Not there in a minute? Check your Promotions or Spam folder.</p>

      {email && (
        <form action={action} className="mt-2.5 flex flex-wrap items-center gap-3">
          <input type="hidden" name="email" value={email} />
          {state ? (
            <span className="text-teal" aria-live="polite">
              {state.message}
            </span>
          ) : (
            <button
              type="submit"
              disabled={pending}
              className="font-semibold text-teal underline-offset-2 hover:underline disabled:opacity-60"
            >
              {pending ? "Sending…" : "Resend the email"}
            </button>
          )}
        </form>
      )}
    </div>
  );
}
