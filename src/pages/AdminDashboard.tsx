import React from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { Users, FileText, Briefcase, Eye, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const stats = [
    { label: 'Total Articles', value: '184', icon: FileText, change: '+12%', trend: 'up' },
    { label: 'Subscribers', value: '12,482', icon: Users, change: '+8%', trend: 'up' },
    { label: 'Job Listings', value: '94', icon: Briefcase, change: '-2%', trend: 'down' },
    { label: 'Page Views', value: '842K', icon: Eye, change: '+24%', trend: 'up' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-serif font-black text-[#E8EAF0]">Dashboard Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back, Ibrahim. Here's what's happening today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-bg-card border border-border rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-white/5 rounded-lg">
                  <stat.icon size={20} className="text-gold" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${stat.trend === 'up' ? 'text-teal' : 'text-red-400'}`}>
                  {stat.change}
                  {stat.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                </div>
              </div>
              <div>
                <div className="text-2xl font-serif font-black text-[#E8EAF0]">{stat.value}</div>
                <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-serif font-bold text-[#E8EAF0] mb-6">Recent Activity</h2>
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-2 h-2 rounded-full bg-gold mt-2 shrink-0" />
                  <div>
                    <p className="text-sm text-[#E8EAF0]">New article published: <span className="text-gold font-medium">"The Agent Revolution Is Here"</span></p>
                    <p className="text-xs text-gray-500 mt-1">2 hours ago by Ibrahim Kamara</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-serif font-bold text-[#E8EAF0] mb-6">Top Categories</h2>
            <div className="space-y-4">
              {[
                { name: 'Agentic AI', count: 48, color: 'bg-gold' },
                { name: 'ML & Data Science', count: 124, color: 'bg-teal' },
                { name: 'Africa AI', count: 37, color: 'bg-blue-400' },
                { name: 'Careers', count: 61, color: 'bg-purple-400' },
              ].map((cat) => (
                <div key={cat.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#E8EAF0]">{cat.name}</span>
                    <span className="text-gray-500">{cat.count} articles</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${cat.color}`} style={{ width: `${(cat.count / 150) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
