import type { Metadata } from "next";
import { Shell } from "@/components/layout/shell";
import { EventCard, type EventRow } from "@/components/event-card";
import { getEvents } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Events | Everyday Data Science",
  description: "AI and data-science events worth your time, ours and the community's.",
};

export const revalidate = 300;

export default async function EventsPage() {
  const { upcoming, past } = await getEvents();

  return (
    <Shell>
      <header className="border-b border-border px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <div className="mx-auto w-full max-w-[1100px]">
          <h1 className="font-serif text-[clamp(30px,5vw,44px)] leading-[1.1] font-black tracking-[-1px]">
            Events
          </h1>
          <p className="mt-3 max-w-[620px] text-[15px] leading-relaxed text-muted">
            Conferences, meetups, and workshops in AI and data science, curated so you only see the
            ones worth attending.
          </p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1100px] px-5 py-12 sm:px-8 lg:px-12">
        <section>
          <h2 className="mb-6 font-mono text-[11px] uppercase tracking-[2px] text-gold">Upcoming</h2>
          {upcoming.length === 0 ? (
            <p className="rounded border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
              No upcoming events right now. Check back soon.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(upcoming as EventRow[]).map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          )}
        </section>

        {past.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-6 font-mono text-[11px] uppercase tracking-[2px] text-muted">Past</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(past as EventRow[]).map((e) => (
                <EventCard key={e.id} event={e} past />
              ))}
            </div>
          </section>
        )}
      </div>
    </Shell>
  );
}
