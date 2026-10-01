"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { BrandIcon } from "@/components/brand-icons";
import { createClient } from "@/lib/supabase/client";
import type { OAuthProvider } from "@/lib/auth";
import { useDraftKind } from "@/lib/write-draft";

type Mode = "signin" | "signup";

const LABEL: Record<OAuthProvider, string> = { google: "Google", github: "GitHub" };

export function AuthForm({
  mode,
  providers,
  next,
}: {
  mode: Mode;
  providers: OAuthProvider[];
  next: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Set once sign-up succeeds but the email still needs confirming.
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resend, setResend] = useState<"idle" | "sending" | "sent" | string>("idle");
  // Arriving from the pitch form: say why the account is needed, and that the
  // pitch is safe (write-form parks it in localStorage).
  const forPitch = next === "/write";
  // "Republish my post" vs "Pitch a new piece", read from the parked draft.
  const draftKind = useDraftKind();
  const republish = forPitch && draftKind === "republish";
  const thing = republish ? "republish request" : "pitch";
  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);

    const db = createClient();

    if (mode === "signup") {
      const { data, error } = await db.auth.signUp({
        email,
        password,
        options: {
          // The handle_new_user trigger reads full_name from here; without it
          // the name falls back to the email prefix.
          // `pitch` switches the confirmation email to its pitch wording
          // (see scripts/apply-auth-emails.mjs).
          data: {
            full_name: name.trim(),
            ...(forPitch ? { pitch: true } : {}),
            ...(republish ? { republish: true } : {}),
          },
          emailRedirectTo: redirectTo(),
        },
      });
      setPending(false);
      if (error) return setError(error.message);
      // With email confirmation on, no session comes back — the user must
      // click the link. Saying "check your inbox" is the honest response.
      if (!data.session) return setSentTo(email.trim());
    } else {
      const { error } = await db.auth.signInWithPassword({ email, password });
      setPending(false);
      if (error) return setError(error.message);
    }

    // The browser client wrote the session cookie; refresh so the server sees it.
    router.replace(next);
    router.refresh();
  }

  async function oauth(provider: OAuthProvider) {
    setPending(true);
    setError(null);
    const db = createClient();
    const { error } = await db.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setPending(false);
      setError(error.message);
    }
  }

  async function resendConfirmation() {
    if (!sentTo) return;
    setResend("sending");
    const { error } = await createClient().auth.resend({
      type: "signup",
      email: sentTo,
      options: { emailRedirectTo: redirectTo() },
    });
    // Supabase rate-limits resends; show its message rather than pretend.
    setResend(error ? error.message : "sent");
  }

  if (sentTo) {
    return (
      <div className="w-full max-w-[440px]" aria-live="polite">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[2px] text-teal">One more step</p>
        <h1 className="mb-3 font-serif text-[32px] leading-tight font-black tracking-[-0.8px]">
          Check your inbox
        </h1>
        <p className="text-[15px] leading-relaxed text-muted">
          We sent a confirmation link to <strong className="font-semibold text-ink">{sentTo}</strong>{" "}
          from <strong className="font-semibold text-ink">Everyday Data Science</strong>. Click it to
          activate your account.
        </p>
        {forPitch && (
          <p className="mt-4 rounded-md border border-gold/30 bg-gold-dim px-4 py-3 text-[13px] leading-relaxed">
            <strong className="font-semibold">Your {thing} is saved.</strong> The link brings you back to
            the Write for us page with everything you typed, ready to send.
          </p>
        )}
        <p className="mt-4 text-[13px] text-muted">
          Not there in a minute? Check your Spam or Promotions folder.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
          {resend === "sent" ? (
            <span className="text-teal">Sent again. It can take a minute.</span>
          ) : (
            <button
              type="button"
              onClick={resendConfirmation}
              disabled={resend === "sending"}
              className="font-semibold text-gold hover:underline disabled:opacity-60"
            >
              {resend === "sending" ? "Sending…" : "Resend the email"}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setSentTo(null);
              setResend("idle");
            }}
            className="text-muted hover:text-ink"
          >
            Wrong address? Start again
          </button>
        </div>
        {resend !== "idle" && resend !== "sending" && resend !== "sent" && (
          <p className="mt-2 text-[12px] text-red">{resend}</p>
        )}
      </div>
    );
  }

  const input =
    "w-full rounded border border-border bg-surface-1 px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-gold/40 focus:bg-surface-2";

  return (
    <div className="w-full max-w-[400px]">
      <h1 className="mb-2 font-serif text-[32px] leading-tight font-black tracking-[-0.8px]">
        {mode === "signin"
          ? forPitch
            ? republish
              ? "Sign in to republish your post"
              : "Sign in to send your pitch"
            : "Welcome back"
          : forPitch
            ? republish
              ? "Create your account to republish your post"
              : "Create your account to send your pitch"
            : "Create your account"}
      </h1>
      <p className="mb-8 text-sm text-muted">
        {forPitch
          ? mode === "signin"
            ? "You'll go straight back to the Write for us page. Anything you typed in this browser is still there."
            : `It's free and takes a minute. Your ${thing} is saved and will be waiting when you get back.`
          : mode === "signin"
            ? "Sign in to comment, save articles, and access the newsroom."
            : "Join Everyday Data Science to comment and follow the work."}
      </p>

      {providers.length > 0 && (
        <>
          <div className="flex flex-col gap-2.5">
            {providers.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => oauth(p)}
                disabled={pending}
                className="inline-flex items-center justify-center gap-2.5 rounded border border-border px-4 py-3 text-sm font-medium transition-colors hover:border-border-strong hover:bg-surface-1 disabled:opacity-60"
              >
                <BrandIcon name={p} className="size-4" />
                Continue with {LABEL[p]}
              </button>
            ))}
          </div>
          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="font-mono text-[10px] uppercase tracking-[2px] text-muted">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        {mode === "signup" && (
          <>
            <label htmlFor="name" className="sr-only">
              Full name
            </label>
            <input
              id="name"
              type="text"
              required
              autoComplete="name"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={input}
            />
          </>
        )}

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

        <label htmlFor="password" className="sr-only">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          placeholder={mode === "signin" ? "Password" : "Password (8+ characters)"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={input}
        />

        {mode === "signin" && (
          <div className="-mt-1 flex justify-end">
            <Link href="/forgot-password" className="text-[12px] text-muted hover:text-gold">
              Forgot password?
            </Link>
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-1 inline-flex items-center justify-center gap-2 rounded bg-gold px-4 py-3 text-sm font-bold text-on-accent transition-opacity hover:opacity-85 disabled:opacity-60"
        >
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="mt-4 min-h-5 text-[13px]" aria-live="polite">
        {error && <span className="text-red">{error}</span>}
        {notice && <span className="text-teal">{notice}</span>}
      </p>

      <p className="mt-6 text-[13px] text-muted">
        {mode === "signin" ? (
          <>
            No account?{" "}
            <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-gold hover:underline">
              Create one
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-gold hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
