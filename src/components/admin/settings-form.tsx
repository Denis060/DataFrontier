"use client";

import { useRef, useState, useTransition } from "react";
import { saveSettings } from "@/app/admin/settings/actions";

export type Settings = {
  site_name: string | null;
  tagline: string | null;
  established_year: number | null;
  contact_email: string | null;
  default_meta_title: string | null;
  default_meta_description: string | null;
  newsletter_headline: string | null;
  newsletter_subtext: string | null;
  newsletter_show_stats: boolean | null;
  spotlight_headline: string | null;
  spotlight_body: string | null;
  spotlight_cta_url: string | null;
};

const field =
  "w-full rounded border border-border bg-surface-1 px-3 py-2.5 text-sm outline-none transition-colors focus:border-gold/40 focus:bg-surface-2";
const label = "mb-1.5 block font-mono text-[10px] uppercase tracking-[1.5px] text-muted";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-border bg-bg2 p-5">
      <h2 className="mb-4 font-mono text-[11px] uppercase tracking-[2px] text-gold">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Text({ name, label: l, defaultValue, type = "text", placeholder }: {
  name: string; label: string; defaultValue: string; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className={label} htmlFor={name}>{l}</label>
      <input id={name} name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} className={field} />
    </div>
  );
}

function Area({ name, label: l, defaultValue }: { name: string; label: string; defaultValue: string }) {
  return (
    <div>
      <label className={label} htmlFor={name}>{l}</label>
      <textarea id={name} name={name} rows={3} defaultValue={defaultValue} className={`${field} resize-none`} />
    </div>
  );
}

export function SettingsForm({ settings }: { settings: Settings }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [saving, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const s = settings;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const data = new FormData(formRef.current!);
    start(async () => {
      const res = await saveSettings(data);
      setMsg("error" in res ? { ok: false, text: res.error } : { ok: true, text: "Saved." });
    });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-5">
      <Section title="Identity">
        <Text name="site_name" label="Site name" defaultValue={s.site_name ?? ""} />
        <Text name="tagline" label="Tagline" defaultValue={s.tagline ?? ""} />
        <Text name="established_year" label="Established year" type="number" defaultValue={s.established_year?.toString() ?? ""} />
        <Text name="contact_email" label="Contact email" type="email" defaultValue={s.contact_email ?? ""} />
      </Section>

      <Section title="SEO defaults">
        <Text name="default_meta_title" label="Default meta title" defaultValue={s.default_meta_title ?? ""} />
        <Area name="default_meta_description" label="Default meta description" defaultValue={s.default_meta_description ?? ""} />
      </Section>

      <Section title="Newsletter band">
        <Text name="newsletter_headline" label="Headline" defaultValue={s.newsletter_headline ?? ""} />
        <Area name="newsletter_subtext" label="Subtext" defaultValue={s.newsletter_subtext ?? ""} />
        <label className="flex items-center gap-2.5 text-[13px]">
          <input type="checkbox" name="newsletter_show_stats" defaultChecked={!!s.newsletter_show_stats} className="size-4 accent-gold" />
          Show subscriber/issue stats on the newsletter band
        </label>
      </Section>

      <Section title="Homepage spotlight">
        <Text name="spotlight_headline" label="Headline" defaultValue={s.spotlight_headline ?? ""} />
        <Area name="spotlight_body" label="Body" defaultValue={s.spotlight_body ?? ""} />
        <Text name="spotlight_cta_url" label="CTA link" type="url" defaultValue={s.spotlight_cta_url ?? ""} />
      </Section>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="rounded bg-gold px-5 py-2.5 text-[13px] font-bold text-on-accent hover:opacity-85 disabled:opacity-60">
          {saving ? "Saving…" : "Save settings"}
        </button>
        {msg && <span className={`text-[13px] ${msg.ok ? "text-teal" : "text-red"}`}>{msg.text}</span>}
      </div>
    </form>
  );
}
