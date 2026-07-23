import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Dashboard from '@/pages/Dashboard';
import CarbonFootprint from '@/pages/CarbonFootprint';
import Recommendations from '@/pages/Recommendations';
import GreenFinancing from '@/pages/GreenFinancing';
import ESGInsights from '@/pages/ESGInsights';
import ChatAssistant from '@/components/ChatAssistant';

export default function App() {
  const [page, setPage] = useState('dashboard');

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <Navbar active={page} onNavigate={setPage} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
        {page === 'carbon' && <CarbonFootprint />}
        {page === 'recommendations' && <Recommendations />}
        {page === 'financing' && <GreenFinancing />}
        {page === 'esg' && <ESGInsights />}
      </main>

      {/* Global AI Chat Assistant */}
      <ChatAssistant />
    </div>
  );
}

