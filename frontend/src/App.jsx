import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Dashboard from '@/pages/Dashboard';
import CarbonFootprint from '@/pages/CarbonFootprint';
import Recommendations from '@/pages/Recommendations';
import GreenFinancing from '@/pages/GreenFinancing';
import ESGInsights from '@/pages/ESGInsights';
import ChatAssistant from '@/components/ChatAssistant';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [highlightInfo, setHighlightInfo] = useState(null);

  // Listen for cross-component navigation events (e.g., linked product in Recommendations)
  useEffect(() => {
    const handler = (e) => {
      if (typeof e.detail === 'string') {
        setPage(e.detail);
        setHighlightInfo(null);
      } else if (e.detail && e.detail.page) {
        setPage(e.detail.page);
        setHighlightInfo({
          productId: e.detail.productId,
          category: e.detail.category,
          title: e.detail.title,
        });
      }
    };
    window.addEventListener('navigate', handler);
    return () => window.removeEventListener('navigate', handler);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <Navbar active={page} onNavigate={(p) => { setPage(p); setHighlightInfo(null); }} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
        {page === 'carbon' && <CarbonFootprint />}
        {page === 'recommendations' && <Recommendations />}
        {page === 'financing' && <GreenFinancing highlightInfo={highlightInfo} />}
        {page === 'esg' && <ESGInsights />}
      </main>

      {/* Global AI Chat Assistant */}
      <ChatAssistant />
    </div>
  );
}

