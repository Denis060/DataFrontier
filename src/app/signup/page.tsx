import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { Shell } from "@/components/layout/shell";
import { getCurrentProfile, getEnabledProviders, safeNext } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Create an account — The Data Frontier",
  robots: { index: false },
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [{ next }, profile, providers] = await Promise.all([
    searchParams,
    getCurrentProfile(),
    getEnabledProviders(),
  ]);

  const target = safeNext(next);
  if (profile) redirect(target);

  return (
    <Shell>
      <div className="flex min-h-[70vh] items-center justify-center px-5 py-16 sm:px-8">
        <AuthForm mode="signup" providers={providers} next={target} />
      </div>
    </Shell>
  );
}
