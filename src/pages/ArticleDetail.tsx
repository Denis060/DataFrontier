import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Article } from '../types';
import { ArrowLeft, Clock, Share2, Bookmark } from 'lucide-react';
import { AdSlot } from '../components/AdSlot';

export const ArticleDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);

  useEffect(() => {
    // Mock data for the specific article
    setArticle({
      id: '1',
      title: 'The Agent Revolution Is Here — and Most Organizations Are Not Ready',
      slug: 'agent-revolution',
      excerpt: 'As LLM-powered agents move from research demos to production infrastructure, the gap between early adopters and the rest is widening fast.',
      content: `
        <p>The transition from large language models (LLMs) as simple chat interfaces to <strong>autonomous agentic systems</strong> represents the most significant shift in computing since the arrival of the cloud. While the initial wave of AI was about generation, the second wave is about action.</p>
        
        <h2>The Three Pillars of Production Agents</h2>
        <p>For an agent to be useful in a production environment, it must excel in three distinct areas: memory, planning, and tool use. Without these, an agent is merely a sophisticated autocomplete engine.</p>
        
        <h3>1. Memory</h3>
        <p>Agents need to maintain state across long-running tasks. This isn't just about vector databases; it's about semantic understanding of past actions and their outcomes.</p>
        
        <h3>2. Planning</h3>
        <p>The ability to break down a complex goal into a sequence of sub-tasks is what separates a chatbot from an agent. This involves reasoning about dependencies and potential failure modes.</p>
        
        <h3>3. Tool Use</h3>
        <p>An agent is only as powerful as the APIs it can call. Reliable tool invocation is the bridge between the digital brain and the physical world.</p>
        
        <h2>Why Organizations Are Failing</h2>
        <p>Most enterprises are treating AI agents as another software library. In reality, they are a new paradigm of probabilistic computing. The traditional deterministic testing frameworks are insufficient for systems that can reason and adapt.</p>
      `,
      category: 'Agentic AI',
      author_name: 'Ibrahim Kamara',
      read_time: '12 min',
      featured: true,
      published: true,
      created_at: '2026-02-28T10:00:00Z',
      updated_at: '2026-02-28T10:00:00Z'
    });
  }, [slug]);

  if (!article) return <div className="p-20 text-center text-gray-500">Loading article...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto px-6 py-12 md:py-20"
    >
      <Link to="/" className="inline-flex items-center gap-2 text-xs font-mono text-gray-500 hover:text-gold transition-colors mb-10">
        <ArrowLeft size={14} />
        Back to Frontier
      </Link>

      <header className="space-y-6 mb-12">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] font-medium tracking-[2px] uppercase bg-gold/15 text-gold px-2.5 py-1 rounded-sm">
            {article.category}
          </span>
          <span className="text-xs text-gray-500">February 28, 2026</span>
        </div>
        <h1 className="font-serif text-4xl md:text-6xl font-black leading-[1.1] tracking-tight text-[#E8EAF0]">
          {article.title}
        </h1>
        <p className="text-xl text-gray-500 leading-relaxed italic border-l-2 border-gold/30 pl-6">
          {article.excerpt}
        </p>
        
        <div className="flex items-center justify-between pt-8 border-t border-border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold to-[#8B6914] flex items-center justify-center font-serif text-lg font-bold text-black">
              IK
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-[#E8EAF0]">{article.author_name}</span>
              <span className="text-xs text-gray-500">Data Scientist & AI Researcher</span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-gray-500">
            <div className="flex items-center gap-2 text-xs">
              <Clock size={14} />
              {article.read_time} read
            </div>
            <div className="flex items-center gap-4">
              <button className="hover:text-gold transition-colors"><Share2 size={18} /></button>
              <button className="hover:text-gold transition-colors"><Bookmark size={18} /></button>
            </div>
          </div>
        </div>
      </header>

      <div 
        className="prose prose-invert max-w-none prose-h2:font-serif prose-h2:text-3xl prose-h2:font-black prose-h2:mt-12 prose-h2:mb-6 prose-p:text-gray-400 prose-p:leading-relaxed prose-p:text-lg prose-strong:text-gold prose-li:text-gray-400"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      <AdSlot type="in-feed" className="my-16" />

      <footer className="mt-20 pt-12 border-t border-border">
        <div className="bg-bg-card border border-border rounded-xl p-8 flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold to-[#8B6914] flex items-center justify-center font-serif text-3xl font-bold text-black shrink-0">
            IK
          </div>
          <div className="space-y-4 text-center md:text-left">
            <h3 className="font-serif text-2xl font-black text-[#E8EAF0]">About Ibrahim Kamara</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Ibrahim is a data scientist and AI researcher focused on agentic systems and their application in emerging markets. He is the author of "The Agent Revolution" and a frequent contributor to open-source AI projects.
            </p>
            <div className="flex justify-center md:justify-start gap-4">
              <a href="#" className="text-xs font-mono text-gold hover:underline">Follow on Twitter</a>
              <a href="#" className="text-xs font-mono text-gold hover:underline">LinkedIn Profile</a>
            </div>
          </div>
        </div>
      </footer>
    </motion.div>
  );
};
