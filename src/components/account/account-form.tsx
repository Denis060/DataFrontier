"use client";

import { useRef, useState, useTransition } from "react";
import { User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { saveProfile } from "@/app/account/actions";

export type AccountProfile = {
  full_name: string;
  title: string;
  bio: string;
  avatar_url: string;
  socials: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    website?: string;
    orcid?: string;
    youtube?: string;
    scholar?: string;
    researchgate?: string;
  };
};

const field =
  "w-full rounded border border-border bg-surface-1 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-gold/40 focus:bg-surface-2";
const label = "mb-1.5 block font-mono text-[10px] uppercase tracking-[1.5px] text-muted";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-border bg-bg2 p-5">
      <h2 className="mb-4 font-mono text-[11px] uppercase tracking-[2px] text-gold">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function AvatarField({ initial }: { initial: string }) {
  const [url, setUrl] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", "avatars");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) setErr(data.error || "Upload failed.");
      else setUrl(data.url);
    } catch {
      setErr("Upload failed.");
    }
    setBusy(false);
    e.target.value = "";
  }

  return (
    <div>
      <label className={label}>Avatar</label>
      <div className="flex items-center gap-4">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="Your avatar" className="size-16 rounded-full border border-border object-cover" />
        ) : (
          <span className="flex size-16 items-center justify-center rounded-full border border-dashed border-border text-muted">
            <User className="size-6" aria-hidden />
          </span>
        )}
        <div>
          <input id="avatar-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} className="hidden" />
          <label
            htmlFor="avatar-file"
            className="inline-block cursor-pointer rounded border border-border px-4 py-2 text-[13px] font-semibold transition-colors hover:border-border-strong hover:bg-surface-1"
          >
            {busy ? "Uploading…" : "Upload photo"}
          </label>
          <p className="mt-1 text-[11px] text-muted">JPG, PNG or WebP · up to 2 MB.</p>
        </div>
      </div>
      <input
        name="avatar_url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="…or paste an image URL"
        className={`${field} mt-3 font-mono text-[12px]`}
      />
      {err && <p className="mt-1 text-[12px] text-red">{err}</p>}
    </div>
  );
}

function Msg({ m }: { m: { ok: boolean; text: string } | null }) {
  if (!m) return null;
  return <span className={`text-[13px] ${m.ok ? "text-teal" : "text-red"}`}>{m.text}</span>;
}

export function AccountForm({ email, profile }: { email: string; profile: AccountProfile }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [savingProfile, startProfile] = useTransition();
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function onSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    const data = new FormData(formRef.current!);
    startProfile(async () => {
      const res = await saveProfile(data);
      setProfileMsg("error" in res ? { ok: false, text: res.error } : { ok: true, text: "Saved." });
    });
  }

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (password.length < 8) return setPwMsg({ ok: false, text: "Use at least 8 characters." });
    if (password !== confirm) return setPwMsg({ ok: false, text: "Those passwords don't match." });
    setSavingPw(true);
    const { error } = await createClient().auth.updateUser({ password });
    setSavingPw(false);
    if (error) return setPwMsg({ ok: false, text: error.message });
    setPassword("");
    setConfirm("");
    setPwMsg({ ok: true, text: "Password updated." });
  }

  const s = profile.socials ?? {};

  return (
    <div className="flex flex-col gap-5">
      <form ref={formRef} onSubmit={onSaveProfile} className="flex flex-col gap-5">
        <Card title="Profile">
          <div>
            <label className={label} htmlFor="full_name">Name</label>
            <input id="full_name" name="full_name" defaultValue={profile.full_name} className={field} />
            <p className="mt-1 text-[11px] text-muted">This is your byline on articles you write.</p>
          </div>
          <div>
            <label className={label} htmlFor="title">Title</label>
            <input id="title" name="title" defaultValue={profile.title} placeholder="e.g. Data Scientist & AI Researcher" className={field} />
          </div>
          <div>
            <label className={label} htmlFor="bio">Bio</label>
            <textarea id="bio" name="bio" rows={3} defaultValue={profile.bio} placeholder="A sentence or two about you, shown on your author page." className={`${field} resize-none`} />
          </div>
          <AvatarField initial={profile.avatar_url} />
        </Card>

        <Card title="Links">
          <div>
            <label className={label} htmlFor="linkedin">LinkedIn</label>
            <input id="linkedin" name="linkedin" defaultValue={s.linkedin ?? ""} placeholder="https://linkedin.com/in/…" className={`${field} font-mono text-[12px]`} />
          </div>
          <div>
            <label className={label} htmlFor="twitter">X / Twitter</label>
            <input id="twitter" name="twitter" defaultValue={s.twitter ?? ""} placeholder="https://x.com/…" className={`${field} font-mono text-[12px]`} />
          </div>
          <div>
            <label className={label} htmlFor="github">GitHub</label>
            <input id="github" name="github" defaultValue={s.github ?? ""} placeholder="https://github.com/…" className={`${field} font-mono text-[12px]`} />
          </div>
          <div>
            <label className={label} htmlFor="website">Website</label>
            <input id="website" name="website" defaultValue={s.website ?? ""} placeholder="https://…" className={`${field} font-mono text-[12px]`} />
          </div>
        </Card>

        <Card title="Research profiles">
          <p className="-mt-1 text-[11px] text-muted">
            These are strong credibility signals for search engines. Any you fill in are linked from your author page and its structured data.
          </p>
          <div>
            <label className={label} htmlFor="orcid">ORCID</label>
            <input id="orcid" name="orcid" defaultValue={s.orcid ?? ""} placeholder="https://orcid.org/0000-0000-0000-0000" className={`${field} font-mono text-[12px]`} />
          </div>
          <div>
            <label className={label} htmlFor="scholar">Google Scholar</label>
            <input id="scholar" name="scholar" defaultValue={s.scholar ?? ""} placeholder="https://scholar.google.com/citations?user=…" className={`${field} font-mono text-[12px]`} />
          </div>
          <div>
            <label className={label} htmlFor="researchgate">ResearchGate</label>
            <input id="researchgate" name="researchgate" defaultValue={s.researchgate ?? ""} placeholder="https://researchgate.net/profile/…" className={`${field} font-mono text-[12px]`} />
          </div>
          <div>
            <label className={label} htmlFor="youtube">YouTube</label>
            <input id="youtube" name="youtube" defaultValue={s.youtube ?? ""} placeholder="https://youtube.com/@…" className={`${field} font-mono text-[12px]`} />
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={savingProfile} className="rounded bg-gold px-5 py-2.5 text-[13px] font-bold text-on-accent hover:opacity-85 disabled:opacity-60">
            {savingProfile ? "Saving…" : "Save profile"}
          </button>
          <Msg m={profileMsg} />
        </div>
      </form>

      <form onSubmit={onChangePassword}>
        <Card title="Password">
          <p className="text-[13px] text-muted">
            Signed in as <span className="text-ink">{email}</span>.
          </p>
          <div>
            <label className={label} htmlFor="password">New password</label>
            <input id="password" type="password" autoComplete="new-password" minLength={8} placeholder="8+ characters" value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="confirm">Confirm new password</label>
            <input id="confirm" type="password" autoComplete="new-password" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} className={field} />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={savingPw || !password} className="rounded border border-border px-5 py-2.5 text-[13px] font-bold hover:border-border-strong hover:bg-surface-1 disabled:opacity-50">
              {savingPw ? "Updating…" : "Update password"}
            </button>
            <Msg m={pwMsg} />
          </div>
        </Card>
      </form>
    </div>
  );
}
