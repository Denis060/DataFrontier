"use client";

import { useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { sendIssue } from "@/app/admin/newsletter/actions";

export function SendIssueButton({
  issueId,
  disabled,
}: {
  issueId: string;
  disabled: boolean;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function send() {
    if (!confirm("Send this issue to all confirmed subscribers?")) return;
    setMsg(null);
    start(async () => {
      const res = await sendIssue(issueId);
      setMsg("error" in res ? { ok: false, text: res.error } : { ok: true, text: `Sent to ${res.sent}.` });
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={send}
        disabled={pending || disabled}
        className="inline-flex items-center gap-1.5 rounded bg-gold px-3 py-1.5 text-[12px] font-bold text-on-accent hover:opacity-85 disabled:opacity-50"
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
        Send
      </button>
      {msg && <span className={`text-[12px] ${msg.ok ? "text-teal" : "text-red"}`}>{msg.text}</span>}
    </div>
  );
}
