"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Markdown } from "tiptap-markdown";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Quote,
} from "lucide-react";
import { useUpload } from "@/components/admin/use-upload";

/**
 * WYSIWYG editing over a Markdown string. Initialised from `initialMarkdown`
 * once; every change serialises back to Markdown via `onChange`. Markdown is
 * the single source of truth — this component never becomes it.
 *
 * StarterKit v3 bundles Link, so it isn't added separately (that warns about a
 * duplicate extension).
 */
export function RichEditor({
  initialMarkdown,
  onChange,
}: {
  initialMarkdown: string;
  onChange: (markdown: string) => void;
}) {
  const { upload, uploading } = useUpload();

  const editor = useEditor({
    immediatelyRender: false, // avoid SSR hydration mismatch
    extensions: [
      StarterKit.configure({ link: { openOnClick: false } }),
      Image,
      Markdown.configure({ html: false, transformPastedText: true }),
    ],
    content: initialMarkdown,
    editorProps: {
      attributes: { class: "article-prose min-h-[45vh] max-w-none outline-none" },
    },
    onUpdate: ({ editor }) => {
      const md = editor.storage as unknown as { markdown: { getMarkdown: () => string } };
      onChange(md.markdown.getMarkdown());
    },
  });

  if (!editor) {
    return <div className="min-h-[45vh] px-5 py-5 text-sm text-muted sm:px-8">Loading editor…</div>;
  }

  const btn = (active: boolean) =>
    `inline-flex size-8 items-center justify-center rounded transition-colors ${
      active ? "bg-gold-dim text-gold" : "text-muted hover:bg-surface-1 hover:text-ink"
    }`;

  async function pickImage(file: File | undefined) {
    if (!file) return;
    const url = await upload(file);
    if (url) editor!.chain().focus().setImage({ src: url }).run();
  }

  function toggleLink() {
    if (editor!.isActive("link")) {
      editor!.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt("Link URL");
    if (url) editor!.chain().focus().setLink({ href: url }).run();
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-4 py-1.5 sm:px-8">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive("bold"))} aria-label="Bold">
          <Bold className="size-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive("italic"))} aria-label="Italic">
          <Italic className="size-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-border" />
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive("heading", { level: 2 }))} aria-label="Heading 2">
          <Heading2 className="size-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn(editor.isActive("heading", { level: 3 }))} aria-label="Heading 3">
          <Heading3 className="size-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-border" />
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive("bulletList"))} aria-label="Bullet list">
          <List className="size-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive("orderedList"))} aria-label="Numbered list">
          <ListOrdered className="size-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn(editor.isActive("blockquote"))} aria-label="Quote">
          <Quote className="size-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={btn(editor.isActive("codeBlock"))} aria-label="Code block">
          <Code className="size-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-border" />
        <button type="button" onClick={toggleLink} className={btn(editor.isActive("link"))} aria-label="Link">
          <LinkIcon className="size-4" />
        </button>
        <label className={`${btn(false)} cursor-pointer`} aria-label="Insert image" title="Insert image">
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { pickImage(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
      </div>

      <EditorContent editor={editor} className="flex-1 px-5 py-5 sm:px-8" />
    </div>
  );
}
