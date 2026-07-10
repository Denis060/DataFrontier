import Link from "next/link";
import { Calendar, MapPin, Video } from "lucide-react";
import { Pill } from "@/components/pill";

export type EventRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  host: string | null;
  location: string | null;
  is_online: boolean;
  starts_at: string;
  timezone: string | null;
  category: { name: string; slug: string; color: string | null } | null;
};

/** "Aug 1, 2026 · 14:00 UTC" */
function formatWhen(iso: string, tz: string | null) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} · ${time}${tz ? ` ${tz.split("/").pop()}` : ""}`;
}

export function EventCard({ event, past = false }: { event: EventRow; past?: boolean }) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className={`flex flex-col gap-3 rounded-md border border-border bg-bg2 p-5 transition-all hover:-translate-y-0.5 hover:border-gold/30 ${
        past ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        {event.category && <Pill color={event.category.color}>{event.category.name}</Pill>}
        <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[1px] text-muted">
          {event.is_online ? <Video className="size-3" /> : <MapPin className="size-3" />}
          {event.is_online ? "Online" : event.location}
        </span>
      </div>

      <p className="font-serif text-lg leading-[1.25] font-bold">{event.title}</p>
      {event.summary && <p className="text-[13px] leading-relaxed text-muted">{event.summary}</p>}

      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 font-mono text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="size-3.5" aria-hidden />
          {formatWhen(event.starts_at, event.timezone)}
        </span>
        {event.host && <span>· {event.host}</span>}
      </div>
    </Link>
  );
}
