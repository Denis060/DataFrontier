import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Article, Job } from '../types';
import { AdSlot } from '../components/AdSlot';

export const Home: React.FC = () => {
  const [featuredArticle, setFeaturedArticle] = useState<Article | null>(null);
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    // In a real app, we'd fetch from Supabase
    // For now, I'll use some mock data that matches the requested design
    setFeaturedArticle({
      id: '1',
      title: 'The Agent Revolution Is Here — and Most Organizations Are Not Ready',
      slug: 'agent-revolution',
      excerpt: 'As LLM-powered agents move from research demos to production infrastructure, the gap between early adopters and the rest is widening fast. Here\'s what the data actually shows.',
      content: '',
      category: 'Agentic AI',
      author_name: 'Ibrahim Kamara',
      read_time: '12 min',
      featured: true,
      published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    setRecentArticles([
      {
        id: '2',
        title: 'How Rwanda Is Building a Sovereign AI Cloud for the Continent',
        slug: 'rwanda-ai-cloud',
        excerpt: 'Infrastructure deep dive into Rwanda\'s latest tech initiative.',
        content: '',
        category: 'Africa AI',
        author_name: 'Ibrahim Kamara',
        read_time: '4 min',
        featured: false,
        published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        title: 'Building Multi-Agent Pipelines with LangGraph: A Practical Guide',
        slug: 'langgraph-guide',
        excerpt: 'A hands-on tutorial for building complex agentic workflows.',
        content: '',
        category: 'Tutorial',
        author_name: 'Ibrahim Kamara',
        read_time: '12 min',
        featured: false,
        published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]);

    setJobs([
      {
        id: '1',
        title: 'Research Engineer — Agent Infrastructure',
        company: 'Anthropic',
        location: 'San Francisco · Remote',
        salary: '$220K–280K',
        tags: ['Python', 'LLMs', 'Distributed Systems'],
        remote: true,
        published: true,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Senior ML Engineer — Reasoning Systems',
        company: 'Google DeepMind',
        location: 'London · Hybrid',
        salary: '£180K–240K',
        tags: ['JAX', 'Reinforcement Learning', 'TPUs'],
        remote: false,
        published: true,
        created_at: new Date().toISOString()
      }
    ]);
  }, []);

  return (
    <div className="relative">
      <div className="atmosphere" />
      
      {/* Editorial Hero */}
      <section className="relative min-h-[90vh] flex flex-col justify-end border-b border-border overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full border-l border-border bg-bg-alt/30 hidden lg:block" />
        
        <div className="container mx-auto px-6 md:px-12 py-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-4 mb-8">
              <span className="label-mono text-gold">Feature Story</span>
              <span className="w-12 h-px bg-gold/30" />
              <span className="label-mono text-gray-500">Feb 2026</span>
            </div>

            <h1 className="display-huge text-ink mb-12 max-w-[1200px]">
              THE <span className="text-gold italic">AGENT</span> <br />
              REVOLUTION <br />
              IS <span className="text-teal">HERE</span>.
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 items-end">
              <p className="text-xl md:text-2xl text-gray-400 font-light leading-relaxed max-w-2xl">
                As LLM-powered agents move from research demos to production infrastructure, 
                the gap between early adopters and the rest is widening fast. 
                The DataFrontier explores the new architecture of action.
              </p>
              
              <div className="flex flex-col gap-6">
                <Link to="/articles/agent-revolution" className="group inline-flex items-center gap-4 text-gold font-bold tracking-tight">
                  <span className="text-lg">Read the Full Feature</span>
                  <div className="w-12 h-12 rounded-full border border-gold/30 flex items-center justify-center group-hover:bg-gold group-hover:text-bg transition-all duration-500">
                    →
                  </div>
                </Link>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center font-serif text-xs font-bold text-gold">IK</div>
                  <span className="text-xs label-mono text-gray-500">By Ibrahim Kamara</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bento Grid Content */}
      <section className="grid grid-cols-1 lg:grid-cols-12 border-b border-border">
        {/* Left Column: Main Feed */}
        <div className="lg:col-span-8 border-r border-border p-6 md:p-12">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-4xl font-black italic">Latest Deep Dives</h2>
            <Link to="/articles" className="label-mono text-gray-500 hover:text-gold transition-colors">View All Archive</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {recentArticles.map((article, idx) => (
              <motion.div 
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group cursor-pointer"
              >
                <div className="aspect-[16/10] bg-bg-card border border-border rounded-sm mb-6 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-bg to-transparent opacity-60" />
                  <div className="absolute bottom-4 left-4">
                    <span className="label-mono text-teal bg-teal/10 px-2 py-1 rounded-sm">{article.category}</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-3 group-hover:text-gold transition-colors leading-tight">
                  {article.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">
                  {article.excerpt}
                </p>
                <div className="flex items-center gap-4 text-[10px] label-mono text-gray-600">
                  <span>{article.read_time}</span>
                  <span className="w-1 h-1 bg-gray-700 rounded-full" />
                  <span>{article.author_name}</span>
                </div>
              </motion.div>
            ))}
          </div>
          
          <AdSlot type="in-feed" className="mt-20" />
        </div>

        {/* Right Column: Sidebar & Ads */}
        <div className="lg:col-span-4 bg-bg-alt/20 p-6 md:p-12 space-y-12">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-2 h-2 bg-gold rounded-full" />
              <span className="label-mono text-gold">Frontier Careers</span>
            </div>
            <div className="space-y-4">
              {jobs.map(job => (
                <div key={job.id} className="p-6 bg-bg-card border border-border rounded-sm hover:border-gold/30 transition-all group cursor-pointer">
                  <div className="flex justify-between items-start mb-4">
                    <span className="label-mono text-gray-500">{job.company}</span>
                    <span className="text-teal text-[10px] font-mono">NEW</span>
                  </div>
                  <h4 className="text-lg font-bold mb-4 group-hover:text-gold transition-colors">{job.title}</h4>
                  <div className="flex items-center justify-between text-[10px] label-mono text-gray-600">
                    <span>{job.location}</span>
                    <span>{job.salary}</span>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/careers" className="block text-center mt-6 label-mono text-gray-500 hover:text-gold transition-colors">View Job Board →</Link>
          </div>

          <AdSlot type="sidebar" className="my-0" />
        </div>
      </section>

      {/* Newsletter: Split Layout */}
      <section className="grid grid-cols-1 lg:grid-cols-2 border-b border-border">
        <div className="p-12 md:p-24 border-r border-border bg-gold text-bg">
          <h2 className="display-huge mb-8">JOIN THE <br /> ELITE.</h2>
          <p className="text-xl font-medium leading-relaxed opacity-80">
            Every Tuesday, we deliver the future of AI to 12,000+ practitioners. 
            No hype. Just the data.
          </p>
        </div>
        <div className="p-12 md:p-24 flex flex-col justify-center bg-bg-alt">
          <div className="max-w-md w-full mx-auto space-y-8">
            <div className="space-y-2">
              <label className="label-mono text-gray-500">Email Address</label>
              <input 
                type="email" 
                placeholder="you@frontier.ai" 
                className="w-full bg-transparent border-b-2 border-border py-4 text-2xl font-serif outline-none focus:border-gold transition-colors"
              />
            </div>
            <button className="w-full bg-gold text-bg py-6 label-mono font-black text-sm hover:bg-white transition-colors">
              Subscribe to the Frontier
            </button>
            <p className="text-center text-[10px] label-mono text-gray-600">
              Join engineers from Google, Meta, and Anthropic.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
