import React, { useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { RichTextEditor } from '../components/RichTextEditor';
import { ArrowLeft, Save, Eye, Image as ImageIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const AdminArticleEditor: React.FC = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    setSlug(val.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 text-gray-500 hover:text-[#E8EAF0] hover:bg-white/5 rounded-md">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-serif font-black text-[#E8EAF0]">Create New Article</h1>
              <p className="text-sm text-gray-500 mt-1">Draft your next frontier story.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-md text-sm text-gray-400 hover:text-[#E8EAF0] hover:bg-white/5">
              <Eye size={18} />
              Preview
            </button>
            <button className="bg-gold text-black px-6 py-2 rounded-md font-bold text-sm flex items-center gap-2 hover:opacity-85 transition-opacity">
              <Save size={18} />
              Publish Article
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          <div className="space-y-6">
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Article Title" 
                value={title}
                onChange={handleTitleChange}
                className="w-full bg-transparent border-none text-4xl font-serif font-black text-[#E8EAF0] placeholder:text-gray-700 outline-none"
              />
              <div className="flex items-center gap-2 text-sm text-gray-500 font-mono">
                <span>slug:</span>
                <span className="text-gold">/articles/{slug || '...'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">Excerpt</label>
              <textarea 
                placeholder="A brief summary of the article for the homepage..." 
                className="w-full bg-bg-card border border-border rounded-md p-4 text-sm text-[#E8EAF0] outline-none focus:border-gold/40 min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">Content</label>
              <RichTextEditor content={content} onChange={setContent} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-bg-card border border-border rounded-xl p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">Category</label>
                <select className="w-full bg-bg-alt border border-border rounded-md px-3 py-2 text-sm text-[#E8EAF0] outline-none focus:border-gold/40">
                  <option>Agentic AI</option>
                  <option>ML & Data Science</option>
                  <option>Africa AI</option>
                  <option>Careers</option>
                  <option>Tutorial</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">Featured Image</label>
                <div className="aspect-video bg-bg-alt border border-dashed border-border rounded-md flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/5 transition-colors">
                  <ImageIcon size={24} className="text-gray-600" />
                  <span className="text-xs text-gray-600">Click to upload</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">Read Time (min)</label>
                <input 
                  type="text" 
                  placeholder="e.g. 8" 
                  className="w-full bg-bg-alt border border-border rounded-md px-3 py-2 text-sm text-[#E8EAF0] outline-none focus:border-gold/40"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="text-sm text-[#E8EAF0]">Featured Story</span>
                <div className="w-10 h-5 bg-white/10 rounded-full relative cursor-pointer">
                  <div className="absolute left-1 top-1 w-3 h-3 bg-gray-500 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
