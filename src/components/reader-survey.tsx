"use client";

import { useActionState, useState } from "react";
import { saveSurvey, type SurveyState } from "@/app/newsletter/confirmed/actions";
import { SURVEY } from "@/lib/free-offers";

/**
 * Three optional taps after confirming, so we know who reads (and can tell
 * sponsors). Every question can be skipped; so can the whole thing.
 */
export function ReaderSurvey({ token }: { token: string }) {
  const [state, action, pending] = useActionState<SurveyState, FormData>(saveSurvey, null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [skipped, setSkipped] = useState(false);

  if (skipped) return null;
  if (state?.ok) {
    return (
      <p className="rounded-lg border border-teal/30 bg-teal-dim px-4 py-3 text-[14px]">
        <span className="font-semibold">Thank you.</span> That helps us write for you.
      </p>
    );
  }

  return (
    <form action={action} className="rounded-lg border border-border bg-bg2 p-5 text-left sm:p-6">
      <input type="hidden" name="t" value={token} />
      <p className="font-serif text-lg font-black">Help us write for you</p>
      <p className="mt-1 text-[13px] text-muted">Three quick taps, all optional. We never share who you are.</p>

      <div className="mt-5 flex flex-col gap-5">
        {SURVEY.map((q) => (
          <fieldset key={q.key}>
            <legend className="mb-2 text-[14px] font-semibold">{q.question}</legend>
            <input type="hidden" name={q.key} value={answers[q.key] ?? ""} />
            <div className="flex flex-wrap gap-2">
              {q.options.map((o) => {
                const on = answers[q.key] === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setAnswers((a) => ({ ...a, [q.key]: on ? "" : o.value }))}
                    className={`rounded-full border px-3.5 py-2 text-[13px] transition-colors ${
                      on ? "border-gold bg-gold text-on-accent" : "border-border bg-bg hover:border-border-strong"
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending || Object.values(answers).every((v) => !v)}
          className="rounded bg-gold px-5 py-2.5 text-[13px] font-bold text-on-accent hover:opacity-85 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Send answers"}
        </button>
        <button type="button" onClick={() => setSkipped(true)} className="text-[13px] text-muted hover:text-ink">
          Skip
        </button>
        {state && !state.ok && <span className="text-[12px] text-red">Couldn&apos;t save. Try again.</span>}
      </div>
    </form>
  );
}
