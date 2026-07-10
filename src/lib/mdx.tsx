import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { AlertTriangle, Info, Lightbulb } from "lucide-react";

type Tone = "note" | "warning" | "tip";

const TONES: Record<Tone, { icon: typeof Info; ring: string; text: string }> = {
  note: { icon: Info, ring: "border-teal/30 bg-teal-dim", text: "text-teal" },
  warning: { icon: AlertTriangle, ring: "border-red/30 bg-red-dim", text: "text-red" },
  tip: { icon: Lightbulb, ring: "border-gold/30 bg-gold-dim", text: "text-gold" },
};

/** Authors write <Callout tone="warning">…</Callout> directly in the body. */
function Callout({ tone = "note", children }: { tone?: Tone; children: React.ReactNode }) {
  const { icon: Icon, ring, text } = TONES[tone] ?? TONES.note;
  return (
    <aside className={`my-6 flex gap-3 rounded-md border p-4 ${ring}`}>
      <Icon className={`mt-0.5 size-4 shrink-0 ${text}`} aria-hidden />
      <div className="[&>p:last-child]:mb-0 [&>p]:mb-2 text-[15px] leading-relaxed">
        {children}
      </div>
    </aside>
  );
}

/** A pull-quote for the wide callouts the design uses between sections. */
function Aside({ children }: { children: React.ReactNode }) {
  return (
    <p className="my-8 border-l-2 border-gold pl-5 font-serif text-xl leading-snug font-bold text-ink">
      {children}
    </p>
  );
}

const components = {
  Callout,
  Aside,
  a: (props: React.ComponentProps<"a">) => (
    <a
      {...props}
      className="text-gold underline decoration-gold/40 underline-offset-2 hover:decoration-gold"
      {...(props.href?.startsWith("http")
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
    />
  ),
};

/**
 * rehype-pretty-code ships both themes and toggles via a data attribute,
 * so highlighted code follows the site theme instead of pinning one.
 */
const options = {
  mdxOptions: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: "wrap" }],
      [
        rehypePrettyCode,
        {
          theme: { dark: "github-dark-dimmed", light: "github-light" },
          keepBackground: false,
        },
      ],
    ],
  },
} as const;

export async function ArticleBody({ source }: { source: string }) {
  return (
    <div className="article-prose">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <MDXRemote source={source} components={components} options={options as any} />
    </div>
  );
}
