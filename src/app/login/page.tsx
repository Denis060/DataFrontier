import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { Shell } from "@/components/layout/shell";
import { getCurrentProfile, getEnabledProviders, safeNext } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const [{ next, error }, profile, providers] = await Promise.all([
    searchParams,
    getCurrentProfile(),
    getEnabledProviders(),
  ]);

  const target = safeNext(next);
  if (profile) redirect(target);

  return (
    <Shell>
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 py-16 sm:px-8">
        {/* The OAuth callback reports failures by redirecting here. */}
        {error && (
          <p className="mb-6 w-full max-w-[400px] rounded border border-red/30 bg-red-dim px-4 py-3 text-[13px] text-red">
            {error}
          </p>
        )}
        <AuthForm mode="signin" providers={providers} next={target} />
      </div>
    </Shell>
  );
}
