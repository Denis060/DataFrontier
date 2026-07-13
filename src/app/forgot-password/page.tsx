import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Shell } from "@/components/layout/shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getCurrentProfile } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Reset your password | Everyday Data Science",
  robots: { index: false },
};

export default async function ForgotPasswordPage() {
  // Already signed in? There's nothing to reset — send them home.
  const profile = await getCurrentProfile();
  if (profile) redirect("/");

  return (
    <Shell>
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 py-16 sm:px-8">
        <ForgotPasswordForm />
      </div>
    </Shell>
  );
}
