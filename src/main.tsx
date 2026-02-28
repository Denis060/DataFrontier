import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { ArticleDetail } from './pages/ArticleDetail';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminArticles } from './pages/AdminArticles';
import { AdminArticleEditor } from './pages/AdminArticleEditor';
import './index.css';

// Placeholder pages
const Careers = () => <div className="p-20 text-center font-serif text-4xl">Job Board Coming Soon</div>;
const AfricaAI = () => <div className="p-20 text-center font-serif text-4xl">Africa AI Spotlight Coming Soon</div>;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="articles/:slug" element={<ArticleDetail />} />
          <Route path="careers" element={<Careers />} />
          <Route path="africa" element={<AfricaAI />} />
        </Route>
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/articles" element={<AdminArticles />} />
        <Route path="/admin/articles/new" element={<AdminArticleEditor />} />
        <Route path="/admin/articles/:id/edit" element={<AdminArticleEditor />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
