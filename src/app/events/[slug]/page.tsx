import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, MapPin, Video } from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { Pill } from "@/components/pill";
import { ArticleBody } from "@/components/article/article-body";
import { getEvent } from "@/lib/queries";

type Props = { params: Promise<{ slug: string }> };

const fmt = (iso: string, tz: string | null) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })} · ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}${
    tz ? ` ${tz}` : ""
  }`;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return { title: "Not found" };
  return { title: `${event.title}`, description: event.summary ?? undefined };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  const isPast = new Date(event.starts_at) < new Date();

  return (
    <Shell>
      <article className="mx-auto w-full max-w-[760px] px-5 py-12 sm:px-8 lg:py-16">
        <Link href="/events" className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
          <ArrowLeft className="size-3.5" /> All events
        </Link>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          {event.category && <Pill color={event.category.color}>{event.category.name}</Pill>}
          {isPast && (
            <span className="rounded-[3px] bg-surface-1 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[1.5px] text-muted">
              Past event
            </span>
          )}
        </div>

        <h1 className="font-serif text-[clamp(28px,5vw,44px)] leading-[1.1] font-black tracking-[-1px]">
          {event.title}
        </h1>

        <div className="mt-6 flex flex-col gap-2.5 rounded-md border border-border bg-bg2 p-5">
          <p className="flex items-center gap-2.5 text-sm">
            <Calendar className="size-4 shrink-0 text-gold" aria-hidden />
            {fmt(event.starts_at, event.timezone)}
          </p>
          <p className="flex items-center gap-2.5 text-sm">
            {event.is_online ? (
              <Video className="size-4 shrink-0 text-gold" aria-hidden />
            ) : (
              <MapPin className="size-4 shrink-0 text-gold" aria-hidden />
            )}
            {event.is_online ? "Online" : event.location}
            {event.host && <span className="text-muted">· hosted by {event.host}</span>}
          </p>
          {event.register_url && !isPast && (
            <a
              href={event.register_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex w-fit items-center gap-2 rounded bg-gold px-5 py-2.5 text-[13px] font-bold text-on-accent transition-opacity hover:opacity-85"
            >
              Register →
            </a>
          )}
        </div>

        {event.description && (
          <div className="mt-8">
            <ArticleBody source={event.description} />
          </div>
        )}
      </article>
    </Shell>
  );
}
