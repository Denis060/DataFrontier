import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Briefcase, Mail, Settings, Newspaper, Layers } from 'lucide-react';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: FileText, label: 'Articles', path: '/admin/articles' },
    { icon: Layers, label: 'Categories', path: '/admin/categories' },
    { icon: Briefcase, label: 'Jobs', path: '/admin/jobs' },
    { icon: Mail, label: 'Newsletter', path: '/admin/newsletter' },
    { icon: Newspaper, label: 'Ticker', path: '/admin/ticker' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-bg-alt flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-border">
          <Link to="/" className="font-serif text-lg font-black text-[#E8EAF0]">
            The Data<span className="text-gold">Frontier</span>
          </Link>
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">Admin Panel</div>
        </div>
        <nav className="flex-grow p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-gold/10 text-gold border border-gold/20' 
                    : 'text-gray-400 hover:text-[#E8EAF0] hover:bg-white/5'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-4 py-2 text-sm text-gray-500">
            <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold">IK</div>
            <div className="flex flex-col">
              <span className="text-[#E8EAF0] font-semibold">Ibrahim K.</span>
              <span className="text-[10px] uppercase tracking-wider">Super Admin</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
