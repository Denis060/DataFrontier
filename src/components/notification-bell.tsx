import Link from "next/link";
import { Bell } from "lucide-react";

/** Header bell linking to /notifications, badged with the unread count. */
export function NotificationBell({ unread }: { unread: number }) {
  return (
    <Link
      href="/notifications"
      aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
      className="relative inline-flex size-9 items-center justify-center rounded border border-border text-muted transition-colors hover:border-border-strong hover:text-ink"
    >
      <Bell className="size-4" aria-hidden />
      {unread > 0 && (
        <span className="absolute -top-1.5 -right-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-on-accent">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
