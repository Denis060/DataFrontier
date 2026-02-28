import React from 'react';
import { Link } from 'react-router-dom';
import { Share2, Linkedin } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-bg/90 backdrop-blur-2xl border-b border-border">
      <div className="flex items-center justify-between px-6 md:px-12 h-20 md:h-24">
        <Link to="/" className="flex flex-col no-underline group">
          <span className="font-serif text-2xl md:text-3xl font-[900] text-ink tracking-tighter leading-none group-hover:text-gold transition-colors">
            THE DATA<span className="text-gold italic">FRONTIER</span>
          </span>
          <span className="label-mono text-gray-600 mt-1">Intelligence for the Edge</span>
        </Link>
        
        <nav className="hidden lg:flex items-center gap-8">
          <Link to="/category/agentic-ai" className="label-mono text-gray-500 hover:text-ink transition-colors">Agents</Link>
          <Link to="/category/ml-data" className="label-mono text-gray-500 hover:text-ink transition-colors">ML/Data</Link>
          <Link to="/africa" className="label-mono text-gray-500 hover:text-ink transition-colors">Africa</Link>
          <Link to="/datasets" className="label-mono text-gray-500 hover:text-ink transition-colors">Datasets</Link>
          <Link to="/events" className="label-mono text-gray-500 hover:text-ink transition-colors">Events</Link>
          <Link to="/resources" className="label-mono text-gray-500 hover:text-ink transition-colors">Resources</Link>
          <Link to="/careers" className="label-mono text-gray-500 hover:text-ink transition-colors">Careers</Link>
          <Link to="/advertise" className="label-mono text-gray-500 hover:text-ink transition-colors">Advertise</Link>
          
          <div className="flex items-center gap-4 border-l border-border pl-8 ml-2">
            <a href="#" className="text-gray-500 hover:text-gold transition-colors"><Share2 size={16} /></a>
            <a href="#" className="text-gray-500 hover:text-gold transition-colors"><Linkedin size={16} /></a>
            <Link to="/subscribe" className="bg-gold text-bg px-6 py-3 label-mono font-black text-[11px] hover:bg-white transition-colors">
              Subscribe
            </Link>
          </div>
        </nav>

        <button className="lg:hidden text-ink">
          <span className="label-mono">Menu</span>
        </button>
      </div>
      
      <div className="border-t border-border bg-bg-alt/50 px-6 md:px-12 py-2 flex items-center gap-6 overflow-hidden">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-1.5 h-1.5 bg-teal rounded-full animate-pulse" />
          <span className="label-mono text-teal">Live</span>
        </div>
        <div className="flex gap-16 animate-ticker whitespace-nowrap">
          <span className="text-[11px] label-mono text-gray-500 hover:text-ink cursor-pointer transition-colors">GPT-5 Reasoning Benchmarks Leaked</span>
          <span className="text-[11px] label-mono text-gray-500 hover:text-ink cursor-pointer transition-colors">Nairobi AI Hub raises $50M Series A</span>
          <span className="text-[11px] label-mono text-gray-500 hover:text-ink cursor-pointer transition-colors">Agentic Workflows hit 40% Enterprise Adoption</span>
          <span className="text-[11px] label-mono text-gray-500 hover:text-ink cursor-pointer transition-colors">DeepSeek-R2 Open Weights Released</span>
          {/* Loop */}
          <span className="text-[11px] label-mono text-gray-500 hover:text-ink cursor-pointer transition-colors">GPT-5 Reasoning Benchmarks Leaked</span>
          <span className="text-[11px] label-mono text-gray-500 hover:text-ink cursor-pointer transition-colors">Nairobi AI Hub raises $50M Series A</span>
          <span className="text-[11px] label-mono text-gray-500 hover:text-ink cursor-pointer transition-colors">Agentic Workflows hit 40% Enterprise Adoption</span>
          <span className="text-[11px] label-mono text-gray-500 hover:text-ink cursor-pointer transition-colors">DeepSeek-R2 Open Weights Released</span>
        </div>
      </div>
      
      {/* Global Top Ad Slot */}
      <div className="bg-bg border-b border-border py-4 hidden md:block">
        <div className="flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/10 rounded-md overflow-hidden mx-auto min-h-[90px] w-full max-w-[728px]">
          <span className="font-mono text-[9px] text-gray-600 uppercase tracking-widest mb-2">Advertisement</span>
          <div className="text-gray-700 text-xs font-medium">728 x 90 Leaderboard</div>
        </div>
      </div>
    </header>
  );
};
