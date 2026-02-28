import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-bg-alt border-t border-border p-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-10">
        <div className="space-y-4">
          <div className="font-serif text-lg font-black text-[#E8EAF0]">
            The Data<span className="text-gold">Frontier</span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Agentic AI, Data Science, and the future of intelligent systems — written by practitioners.
          </p>
          <div className="flex gap-4">
            <a href="#" className="font-mono text-[11px] text-gray-500 hover:text-[#E8EAF0] tracking-wider transition-colors">Twitter</a>
            <a href="#" className="font-mono text-[11px] text-gray-500 hover:text-[#E8EAF0] tracking-wider transition-colors">LinkedIn</a>
            <a href="#" className="font-mono text-[11px] text-gray-500 hover:text-[#E8EAF0] tracking-wider transition-colors">GitHub</a>
          </div>
        </div>

        <div>
          <div className="font-mono text-[10px] text-gray-500 tracking-[2px] uppercase mb-4">Topics</div>
          <div className="flex flex-col gap-2.5">
            <Link to="/category/agentic-ai" className="text-xs text-gray-500 hover:text-[#E8EAF0] transition-colors">Agentic AI Systems</Link>
            <Link to="/category/ml-data" className="text-xs text-gray-500 hover:text-[#E8EAF0] transition-colors">Machine Learning</Link>
            <Link to="/category/data-eng" className="text-xs text-gray-500 hover:text-[#E8EAF0] transition-colors">Data Engineering</Link>
            <Link to="/africa" className="text-xs text-gray-500 hover:text-[#E8EAF0] transition-colors">AI in Africa</Link>
          </div>
        </div>

        <div>
          <div className="font-mono text-[10px] text-gray-500 tracking-[2px] uppercase mb-4">Resources</div>
          <div className="flex flex-col gap-2.5">
            <a href="#" className="text-xs text-gray-500 hover:text-[#E8EAF0] transition-colors">Agentic AI Book</a>
            <a href="#" className="text-xs text-gray-500 hover:text-[#E8EAF0] transition-colors">Learning Path</a>
            <a href="#" className="text-xs text-gray-500 hover:text-[#E8EAF0] transition-colors">Open Source Tools</a>
            <Link to="/careers" className="text-xs text-gray-500 hover:text-[#E8EAF0] transition-colors">Job Board</Link>
          </div>
        </div>

        <div>
          <div className="font-mono text-[10px] text-gray-500 tracking-[2px] uppercase mb-4">Company</div>
          <div className="flex flex-col gap-2.5">
            <a href="#" className="text-xs text-gray-500 hover:text-[#E8EAF0] transition-colors">About Ibrahim</a>
            <a href="#" className="text-xs text-gray-500 hover:text-[#E8EAF0] transition-colors">Write for Us</a>
            <a href="#" className="text-xs text-gray-500 hover:text-[#E8EAF0] transition-colors">Contact</a>
            <Link to="/admin" className="text-xs text-gray-500 hover:text-[#E8EAF0] transition-colors">Admin Login</Link>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs text-gray-500">
          © 2026 The DataFrontier · Built by <strong className="text-gold">Ibrahim Kamara</strong> · All rights reserved.
        </p>
        <div className="flex gap-4">
          <a href="#" className="font-mono text-[11px] text-gray-500 hover:text-[#E8EAF0] tracking-wider transition-colors">Terms</a>
          <a href="#" className="font-mono text-[11px] text-gray-500 hover:text-[#E8EAF0] tracking-wider transition-colors">Privacy</a>
          <a href="#" className="font-mono text-[11px] text-gray-500 hover:text-[#E8EAF0] tracking-wider transition-colors">RSS</a>
        </div>
      </div>
    </footer>
  );
};
