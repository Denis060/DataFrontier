import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
}

export const RichTextEditor: React.FC<EditorProps> = ({ content, onChange }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[400px] p-4 bg-bg-card border border-border rounded-md',
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 p-2 bg-bg-alt border border-border rounded-t-md">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-white/10 ${editor.isActive('bold') ? 'bg-gold/20 text-gold' : 'text-gray-400'}`}
        >
          Bold
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-white/10 ${editor.isActive('italic') ? 'bg-gold/20 text-gold' : 'text-gray-400'}`}
        >
          Italic
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded hover:bg-white/10 ${editor.isActive('heading', { level: 2 }) ? 'bg-gold/20 text-gold' : 'text-gray-400'}`}
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded hover:bg-white/10 ${editor.isActive('heading', { level: 3 }) ? 'bg-gold/20 text-gold' : 'text-gray-400'}`}
        >
          H3
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded hover:bg-white/10 ${editor.isActive('bulletList') ? 'bg-gold/20 text-gold' : 'text-gray-400'}`}
        >
          List
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};
