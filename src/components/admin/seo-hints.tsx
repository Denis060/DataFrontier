"use client";

import { useEffect, useState } from "react";
import { clampTitle, DESCRIPTION_LIMIT, TITLE_LIMIT } from "@/lib/seo-title";

/** Live values of some uncontrolled fields in a form, by name. */
export function useFormFields(formRef: React.RefObject<HTMLFormElement | null>, names: string[]) {
  const key = names.join(",");
  const [values, setValues] = useState<Record<string, string>>({});
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const read = () => {
      const next: Record<string, string> = {};
      for (const n of key.split(",")) {
        const el = form.elements.namedItem(n) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
        next[n] = el?.value ?? "";
      }
      setValues(next);
    };
    read();
    form.addEventListener("input", read);
    form.addEventListener("change", read);
    return () => {
      form.removeEventListener("input", read);
      form.removeEventListener("change", read);
    };
  }, [formRef, key]);
  return values;
}

const tone = (over: boolean) => (over ? "text-gold" : "text-muted");

/** Under the SEO title: the count, and exactly what the browser tab will show. */
export function SeoTitleHint({ formRef }: { formRef: React.RefObject<HTMLFormElement | null> }) {
  const v = useFormFields(formRef, ["meta_title", "title"]);
  const own = (v.meta_title ?? "").trim();
  const base = own || (v.title ?? "").trim();
  if (!base) {
    return <p className="mt-1 mb-3 text-[10px] leading-snug text-muted">Shown in Google results. Leave blank to use the headline.</p>;
  }
  const shown = clampTitle(base);
  const cut = shown.length < base.length;
  return (
    <div className="mt-1 mb-3 text-[10px] leading-snug">
      <p className={tone(own.length > TITLE_LIMIT)}>
        {own ? `${own.length} / ${TITLE_LIMIT}` : "Using the headline."}
        {own.length > TITLE_LIMIT && " · Over the limit: Google will cut it."}
      </p>
      <p className="mt-0.5 text-muted">
        Tab and Google show: <span className={`font-medium ${cut ? "text-gold" : "text-ink"}`}>{shown}{cut && "…"}</span>
      </p>
      {cut && <p className="mt-0.5 text-gold">The end is cut off. Put the keyword first, or shorten it.</p>}
    </div>
  );
}

/** Under the meta description: the count against Google's ~155. */
export function SeoDescriptionHint({ formRef }: { formRef: React.RefObject<HTMLFormElement | null> }) {
  const v = useFormFields(formRef, ["meta_description", "excerpt"]);
  const own = (v.meta_description ?? "").trim();
  if (!own) {
    return (
      <p className="mt-1 text-[10px] leading-snug text-muted">
        {(v.excerpt ?? "").trim() ? "Blank: the excerpt is used." : "Blank: the excerpt is used (add one)."}
      </p>
    );
  }
  const over = own.length > DESCRIPTION_LIMIT;
  return (
    <p className={`mt-1 text-[10px] leading-snug ${tone(over)}`}>
      {own.length} / {DESCRIPTION_LIMIT}
      {over && " · Google will cut the end. Trim it."}
      {!over && own.length < 70 && " · Short. Aim for 120 to 155."}
    </p>
  );
}
