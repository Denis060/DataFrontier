import Image from "next/image";

/**
 * An article cover cropped to 16:9. Renders nothing without a src, so cards
 * for articles that have no cover stay text-only instead of showing a gap.
 */
export function CoverImage({
  src,
  alt,
  sizes,
  priority = false,
  className = "",
}: {
  src: string | null | undefined;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  if (!src) return null;
  return (
    <div className={`relative aspect-[16/9] overflow-hidden rounded-md border border-border bg-bg2 ${className}`}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
    </div>
  );
}
