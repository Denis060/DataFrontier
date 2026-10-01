const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

/** A writer's photo, or their initials on the brand gradient when there isn't one. */
export function AuthorAvatar({
  name,
  src,
  className = "size-14 text-lg",
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} className={`shrink-0 rounded-full border-2 border-gold/30 object-cover ${className}`} />
  ) : (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full border-2 border-gold/30 bg-linear-135 from-gold to-[#4A3000] font-serif font-black text-on-accent ${className}`}
    >
      {initials(name)}
    </span>
  );
}
