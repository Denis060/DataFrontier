import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/layout/shell";
import { SetPasswordForm } from "@/components/auth/set-password-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Set a new password | Everyday Data Science",
  robots: { index: false },
};

export default async function ResetPasswordPage() {
  // The recovery link runs through /auth/callback, which exchanges the code for
  // a session. If that session is here, the link was valid and we can let them
  // set a new password; if not, the link was bad or expired.
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();

  return (
    <Shell>
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 py-16 sm:px-8">
        {user ? (
          <SetPasswordForm />
        ) : (
          <div className="w-full max-w-[400px]">
            <h1 className="mb-2 font-serif text-[32px] leading-tight font-black tracking-[-0.8px]">
              This link has expired
            </h1>
            <p className="mb-8 text-sm text-muted">
              Password reset links can only be used once and expire after a short while.
            </p>
            <Link
              href="/forgot-password"
              className="inline-flex items-center justify-center rounded bg-gold px-4 py-3 text-sm font-bold text-on-accent transition-opacity hover:opacity-85"
            >
              Request a new link
            </Link>
          </div>
        )}
      </div>
    </Shell>
  );
}
