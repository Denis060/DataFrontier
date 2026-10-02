"use client";

import { useEffect, useRef } from "react";

/**
 * Sanitized body HTML plus a "Copy" button on every code block. The HTML is
 * server-rendered as-is; buttons are added after hydration, so a reader
 * without JS still gets the code, just without the button.
 */
export function Prose({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const timers: number[] = [];

    // The sanitizer prefixes heading ids with "user-content-" (so article text
    // can't clobber page globals) but leaves the headings' self-links as
    // "#slug", so they pointed nowhere. Repoint them, and honour a shared
    // "#slug" link on arrival.
    const prefixed = (id: string) =>
      id && !document.getElementById(id) ? document.getElementById(`user-content-${id}`) : null;
    for (const a of Array.from(root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'))) {
      const id = decodeURIComponent(a.getAttribute("href")!.slice(1));
      const target = prefixed(id);
      if (target) a.setAttribute("href", `#${target.id}`);
    }
    prefixed(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView();

    for (const pre of Array.from(root.querySelectorAll("pre"))) {
      if (pre.parentElement?.classList.contains("code-block")) continue;
      // Wrap so the button stays put while the <pre> scrolls sideways.
      const wrap = document.createElement("div");
      wrap.className = "code-block";
      pre.replaceWith(wrap);
      wrap.appendChild(pre);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "code-copy";
      btn.textContent = "Copy";
      btn.setAttribute("aria-label", "Copy code to clipboard");
      btn.addEventListener("click", async () => {
        // The highlighter renders empty lines as a single space; strip those.
        const text = ((pre.querySelector("code") ?? pre).textContent ?? "").replace(/[ \t]+$/gm, "");
        const ok = await copyText(text);
        btn.textContent = ok ? "Copied" : "Press Ctrl+C";
        if (!ok) selectContents(pre);
        timers.push(window.setTimeout(() => (btn.textContent = "Copy"), 2000));
      });
      wrap.appendChild(btn);
    }

    return () => timers.forEach(clearTimeout);
  }, [html]);

  return <div ref={ref} className="article-prose" dangerouslySetInnerHTML={{ __html: html }} />;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard API is missing on insecure origins and some in-app browsers.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {}
    ta.remove();
    return ok;
  }
}

function selectContents(el: Element) {
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}
