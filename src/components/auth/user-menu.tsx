"use client";

import Link from "next/link";
import { Bookmark, LogOut, PenLine, Rss, Settings, User } from "lucide-react";
import type { Role } from "@/lib/auth";

export type SessionProfile = {
  full_name: string;
  slug: string | null;
  role: Role;
  email: string | null;
  avatar_url?: string | null;
} | null;

const STAFF: Role[] = ["admin", "editor", "author"];

const initials = (name: string) =>
  name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export function UserMenu({ profile }: { profile: SessionProfile }) {
  if (!profile) {
    return (
      <Link
        href="/login"
        className="text-[13px] font-medium tracking-[0.3px] text-muted transition-colors hover:text-ink"
      >
        Sign in
      </Link>
    );
  }

  const isStaff = STAFF.includes(profile.role);

  return (
    // <details> gives an accessible dropdown that closes on Escape and on
    // outside click, with no state or event listeners of our own.
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={profile.full_name}
            className="size-8 rounded-full border border-border object-cover"
          />
        ) : (
          <span className="flex size-8 items-center justify-center rounded-full bg-linear-135 from-gold to-[#8B6914] font-serif text-[11px] font-bold text-on-accent">
            {initials(profile.full_name)}
          </span>
        )}
      </summary>

      <div className="absolute right-0 z-50 mt-2 w-56 rounded-md border border-border bg-bg2 p-1.5 shadow-xl">
        <div className="border-b border-border px-3 py-2.5">
          <p className="truncate text-[13px] font-semibold">{profile.full_name}</p>
          <p className="truncate text-[11px] text-muted">{profile.email}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[1.5px] text-gold">
            {profile.role}
          </p>
        </div>

        {isStaff && (
          <Link
            href="/admin"
            className="flex items-center gap-2.5 rounded px-3 py-2.5 text-[13px] text-muted transition-colors hover:bg-surface-1 hover:text-ink"
          >
            <PenLine className="size-4" aria-hidden />
            Newsroom
          </Link>
        )}

        <Link
          href="/following"
          className="flex items-center gap-2.5 rounded px-3 py-2.5 text-[13px] text-muted transition-colors hover:bg-surface-1 hover:text-ink"
        >
          <Rss className="size-4" aria-hidden />
          Your feed
        </Link>

        <Link
          href="/library"
          className="flex items-center gap-2.5 rounded px-3 py-2.5 text-[13px] text-muted transition-colors hover:bg-surface-1 hover:text-ink"
        >
          <Bookmark className="size-4" aria-hidden />
          Library
        </Link>

        {profile.slug && (
          <Link
            href={`/author/${profile.slug}`}
            className="flex items-center gap-2.5 rounded px-3 py-2.5 text-[13px] text-muted transition-colors hover:bg-surface-1 hover:text-ink"
          >
            <User className="size-4" aria-hidden />
            My profile
          </Link>
        )}

        <Link
          href="/account"
          className="flex items-center gap-2.5 rounded px-3 py-2.5 text-[13px] text-muted transition-colors hover:bg-surface-1 hover:text-ink"
        >
          <Settings className="size-4" aria-hidden />
          Account settings
        </Link>

        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded px-3 py-2.5 text-left text-[13px] text-muted transition-colors hover:bg-surface-1 hover:text-ink"
          >
            <LogOut className="size-4" aria-hidden />
            Sign out
          </button>
        </form>
      </div>
    </details>
  );
}
