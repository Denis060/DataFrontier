import React from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { Plus, Search, Filter, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminArticles: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-black text-[#E8EAF0]">Article Manager</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your editorial content, drafts, and featured stories.</p>
          </div>
          <Link to="/admin/articles/new" className="bg-gold text-black px-4 py-2 rounded-md font-bold text-sm flex items-center gap-2 hover:opacity-85 transition-opacity">
            <Plus size={18} />
            New Article
          </Link>
        </div>

        <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input 
                type="text" 
                placeholder="Search articles..." 
                className="w-full bg-white/5 border border-border rounded-md pl-10 pr-4 py-2 text-sm outline-none focus:border-gold/40"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-md text-sm text-gray-400 hover:text-[#E8EAF0] hover:bg-white/5">
              <Filter size={16} />
              Filter
            </button>
          </div>

          <table className="w-full text-left">
            <thead className="bg-bg-alt border-b border-border">
              <tr>
                <th className="px-6 py-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest">Title</th>
                <th className="px-6 py-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                { title: 'The Agent Revolution Is Here', category: 'Agentic AI', status: 'Published', date: 'Feb 28, 2026' },
                { title: 'How Rwanda Is Building a Sovereign AI Cloud', category: 'Africa AI', status: 'Published', date: 'Feb 26, 2026' },
                { title: 'Building Multi-Agent Pipelines with LangGraph', category: 'Tutorial', status: 'Draft', date: 'Feb 24, 2026' },
                { title: 'The Skills Gap in Agentic AI', category: 'Careers', status: 'Published', date: 'Feb 22, 2026' },
              ].map((article, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-[#E8EAF0]">{article.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">/articles/the-agent-revolution</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-2 py-1 bg-white/5 border border-border rounded text-gray-400">{article.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${
                      article.status === 'Published' ? 'bg-teal/10 text-teal' : 'bg-gray-500/10 text-gray-500'
                    }`}>
                      {article.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">{article.date}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 text-gray-500 hover:text-gold transition-colors"><Eye size={16} /></button>
                      <button className="p-1.5 text-gray-500 hover:text-gold transition-colors"><Edit size={16} /></button>
                      <button className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};
