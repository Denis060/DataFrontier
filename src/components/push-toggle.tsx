"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { savePushSubscription, removePushSubscription } from "@/app/actions/push";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function PushToggle() {
  const [supported, setSupported] = useState(true);
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const ok = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && !!VAPID;
    setSupported(ok);
    if (!ok) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setOn(!!sub))
      .catch(() => {});
  }, []);

  async function enable() {
    setBusy(true);
    setMsg(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setMsg("Notifications are blocked in your browser settings.");
        setBusy(false);
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID!) as BufferSource,
      });
      const res = await savePushSubscription(JSON.parse(JSON.stringify(sub)));
      if (res.ok) {
        setOn(true);
        setMsg("You'll get a notification when a new post lands.");
      } else setMsg("Could not enable notifications. Try again.");
    } catch {
      setMsg("Could not enable notifications.");
    }
    setBusy(false);
  }

  async function disable() {
    setBusy(true);
    setMsg(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setOn(false);
      setMsg("Notifications turned off.");
    } catch {
      setMsg("Could not turn off notifications.");
    }
    setBusy(false);
  }

  if (!supported) {
    return <p className="text-[13px] text-muted">Your browser doesn&apos;t support push notifications.</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={on ? disable : enable}
        disabled={busy}
        className={`inline-flex items-center gap-2 rounded border px-4 py-2.5 text-[13px] font-semibold transition-colors disabled:opacity-60 ${
          on ? "border-gold/40 bg-gold-dim text-gold" : "border-border hover:border-border-strong hover:bg-surface-1"
        }`}
      >
        {on ? <Bell className="size-4" aria-hidden /> : <BellOff className="size-4" aria-hidden />}
        {busy ? "…" : on ? "Notifications on" : "Notify me of new posts"}
      </button>
      {msg && <span className="text-[12px] text-muted">{msg}</span>}
    </div>
  );
}
