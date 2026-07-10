"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { BrandIcon } from "@/components/brand-icons";
import { createClient } from "@/lib/supabase/client";
import type { OAuthProvider } from "@/lib/auth";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
      });
      setPending(false);
      if (error) return setError(error.message);
      // With email confirmation on, no session comes back — the user must
      // click the link. Saying "check your inbox" is the honest response.
      if (!data.session) return setNotice("Check your inbox to confirm your email.");
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

  const input =
    "w-full rounded border border-border bg-surface-1 px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-gold/40 focus:bg-surface-2";

  return (
    <div className="w-full max-w-[400px]">
      <h1 className="mb-2 font-serif text-[32px] leading-tight font-black tracking-[-0.8px]">
        {mode === "signin" ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mb-8 text-sm text-muted">
        {mode === "signin"
          ? "Sign in to comment, save articles, and access the newsroom."
          : "Join the Data Frontier to comment and follow the work."}
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
