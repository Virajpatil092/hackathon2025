import { useState, useEffect } from 'react';
import { CheckCircle2, ArrowRight, Shield, TrendingDown, Wallet } from 'lucide-react';
import { getGreenFinancing, applyGreenProduct } from '@/services/api';

export default function GreenFinancing() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState({});

  useEffect(() => {
    getGreenFinancing()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  const handleApply = async (id) => {
    await applyGreenProduct(id);
    setApplied((prev) => ({ ...prev, [id]: true }));
  };

  if (loading)
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-48 bg-slate-100 rounded-2xl" />
        ))}
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Green Financing</h1>
        <p className="text-sm text-slate-500 mt-1">
          Sustainable financial products aligned with the EU Taxonomy to help you reduce your carbon footprint.
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-teal-50 rounded-xl border border-teal-100">
        <Shield className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-teal-800">EU Taxonomy Aligned Products</p>
          <p className="text-xs text-teal-600 mt-0.5">
            All products listed here meet the EU Taxonomy criteria for environmentally sustainable activities.
            CO₂e savings are estimated and may vary based on individual circumstances.
          </p>
        </div>
      </div>

      {/* Product cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {items.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col"
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                {p.type}
              </span>
              <span className="text-xs font-medium text-slate-400">{p.rate}</span>
            </div>

            <h3 className="text-lg font-bold text-slate-800 mt-3">{p.name}</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed flex-1">{p.description}</p>

            {/* Features */}
            <div className="mt-4 flex flex-wrap gap-2">
              {p.features.map((f, i) => (
                <span key={i} className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                  {f}
                </span>
              ))}
            </div>

            {/* CO2 saving */}
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
              <TrendingDown className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>{p.co2Saving}</span>
            </div>

            {/* Loan details */}
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-400">Amount</p>
                <p className="font-medium text-slate-700">
                  {p.minAmount >= 1000000
                    ? `${p.minAmount / 1000000}M`
                    : p.minAmount >= 1000
                      ? `${p.minAmount / 1000}K`
                      : p.minAmount}
                  {' - '}
                  {p.maxAmount >= 1000000
                    ? `${p.maxAmount / 1000000}M`
                    : p.maxAmount >= 1000
                      ? `${p.maxAmount / 1000}K`
                      : p.maxAmount}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Term</p>
                <p className="font-medium text-slate-700">{p.term}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                {p.badge}
              </span>
              {applied[p.id] ? (
                <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                  Application Submitted
                </span>
              ) : (
                <button
                  onClick={() => handleApply(p.id)}
                  className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  <Wallet className="w-4 h-4" />
                  Apply Now
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
