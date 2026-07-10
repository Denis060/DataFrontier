"use client";

import { useState } from "react";
import { Check, Link2, Mail, Share2 } from "lucide-react";
import { BrandIcon } from "@/components/brand-icons";

type Props = { url: string; title: string; layout?: "row" | "column" };

const btn =
  "inline-flex size-9 items-center justify-center rounded border border-border text-muted transition-colors hover:border-border-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

export function ShareBar({ url, title, layout = "row" }: Props) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  // `navigator.share` only exists on some browsers, and only over HTTPS.
  // Checked in a ref callback so the server and first client render agree.
  const detect = (node: HTMLDivElement | null) => {
    if (node && typeof navigator !== "undefined" && "share" in navigator) {
      setCanNativeShare(true);
    }
  };

  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);

  const targets = [
    { key: "x", label: "Share on X", href: `https://x.com/intent/tweet?text=${t}&url=${u}` },
    {
      key: "linkedin",
      label: "Share on LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    },
    {
      key: "facebook",
      label: "Share on Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    },
    { key: "whatsapp", label: "Share on WhatsApp", href: `https://wa.me/?text=${t}%20${u}` },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure origin, permissions). Leave the icon alone
      // rather than claiming a copy that never happened.
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, url });
    } catch {
      // User dismissed the sheet — not an error worth surfacing.
    }
  }

  return (
    <div
      ref={detect}
      className={`flex gap-2 ${layout === "column" ? "flex-col" : "flex-wrap items-center"}`}
    >
      {targets.map((s) => (
        <a
          key={s.key}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.label}
          title={s.label}
          className={btn}
        >
          <BrandIcon name={s.key} className="size-4" />
        </a>
      ))}

      <a
        href={`mailto:?subject=${t}&body=${u}`}
        aria-label="Share by email"
        title="Share by email"
        className={btn}
      >
        <Mail className="size-4" aria-hidden />
      </a>

      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Link copied" : "Copy link"}
        title={copied ? "Link copied" : "Copy link"}
        className={`${btn} ${copied ? "border-teal/40 text-teal" : ""}`}
      >
        {copied ? <Check className="size-4" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
      </button>

      {canNativeShare && (
        <button
          type="button"
          onClick={nativeShare}
          aria-label="Share…"
          title="Share…"
          className={`${btn} sm:hidden`}
        >
          <Share2 className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
