import { useState, useEffect } from 'react';
import { CheckCircle2, ArrowRight, Shield, TrendingDown, Wallet, Building2, User, Filter, Leaf } from 'lucide-react';
import { getGreenFinancing, applyGreenProduct } from '@/services/api';

function formatAmount(amt) {
  if (!amt || amt === 0) return null;
  if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(1).replace(/\.0$/, '')} Cr`;
  if (amt >= 100000) return `₹${(amt / 100000).toFixed(1).replace(/\.0$/, '')} Lakh`;
  if (amt >= 1000) return `₹${(amt / 1000).toFixed(0)}K`;
  return `₹${amt}`;
}

const CATEGORY_LABELS = {
  ALL: 'All Products',
  LOAN: 'Loans',
  DEPOSIT: 'Deposits',
  INSURANCE: 'Insurance',
  INVESTMENT: 'Investments',
  ADVISORY: 'Advisory',
};

const CATEGORY_COLORS = {
  LOAN: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  DEPOSIT: { bg: 'bg-teal-50', text: 'text-teal-700' },
  INSURANCE: { bg: 'bg-blue-50', text: 'text-blue-700' },
  INVESTMENT: { bg: 'bg-violet-50', text: 'text-violet-700' },
  ADVISORY: { bg: 'bg-amber-50', text: 'text-amber-700' },
};

function getCatStyle(cat) {
  return CATEGORY_COLORS[cat] || { bg: 'bg-slate-100', text: 'text-slate-700' };
}

export default function GreenFinancing() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState({});
  const [customerTab, setCustomerTab] = useState('ALL');
  const [categoryTab, setCategoryTab] = useState('ALL');

  useEffect(() => {
    getGreenFinancing()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  const handleApply = async (id) => {
    await applyGreenProduct(id);
    setApplied((prev) => ({ ...prev, [id]: true }));
  };

  // Derive available categories dynamically from loaded data
  const availableCategories = [
    'ALL',
    ...Array.from(new Set(items.map((p) => p.category).filter(Boolean))),
  ];

  const filteredItems = items.filter((p) => {
    const matchCustomer = customerTab === 'ALL' || p.customerType === customerTab;
    const matchCategory = categoryTab === 'ALL' || p.category === categoryTab;
    return matchCustomer && matchCategory;
  });

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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Green Financing Catalog</h1>
          <p className="text-sm text-slate-500 mt-1">
            Explore sustainable financial products aligned with ESG criteria —{' '}
            {filteredItems.length} of {items.length} products shown.
          </p>
        </div>

        {/* Customer Type Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-fit shrink-0">
          {['ALL', 'INDIVIDUAL', 'BUSINESS'].map((tab) => {
            const count =
              tab === 'ALL'
                ? items.length
                : items.filter((i) => i.customerType === tab).length;
            const icon = tab === 'INDIVIDUAL' ? <User className="w-3.5 h-3.5" /> : tab === 'BUSINESS' ? <Building2 className="w-3.5 h-3.5" /> : null;
            const label = tab === 'ALL' ? 'All' : tab === 'INDIVIDUAL' ? 'Individual' : 'Business';
            return (
              <button
                key={tab}
                onClick={() => setCustomerTab(tab)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  customerTab === tab
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {icon}
                {label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
        {availableCategories.map((cat) => {
          const count =
            cat === 'ALL'
              ? items.filter((p) => customerTab === 'ALL' || p.customerType === customerTab).length
              : items.filter(
                  (p) =>
                    (customerTab === 'ALL' || p.customerType === customerTab) &&
                    p.category === cat
                ).length;
          return (
            <button
              key={cat}
              onClick={() => setCategoryTab(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                categoryTab === cat
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400 hover:text-emerald-700'
              }`}
            >
              {CATEGORY_LABELS[cat] || cat}
              <span className="ml-1 opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-teal-50 rounded-xl border border-teal-100">
        <Shield className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-teal-800">
            Meridian Bank — Verified ESG Framework Aligned Products
          </p>
          <p className="text-xs text-teal-600 mt-0.5">
            All products meet IGBC / GRIHA / RBI Green Deposit Framework / FAME II standards.
            CO₂e savings are estimated based on standard usage benchmarks.
          </p>
        </div>
      </div>

      {/* Product cards */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Leaf className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No products match the selected filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredItems.map((p) => {
            const minFormatted = formatAmount(p.minAmount);
            const maxFormatted = formatAmount(p.maxAmount);
            const amountText =
              minFormatted && maxFormatted
                ? `${minFormatted} – ${maxFormatted}`
                : minFormatted || maxFormatted || 'Flexible';
            const catStyle = getCatStyle(p.category);

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`text-xs font-bold tracking-wider px-2.5 py-1 rounded-full uppercase ${catStyle.bg} ${catStyle.text}`}
                    >
                      {p.type}
                    </span>
                    {p.customerType && (
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {p.customerType}
                      </span>
                    )}
                    {p.status && p.status !== 'ACTIVE' && (
                      <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                        {p.status}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50/60 px-2 py-1 rounded-lg whitespace-nowrap shrink-0">
                    {p.rate}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-800 mt-3">{p.name}</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed flex-1">{p.description}</p>

                {/* Features */}
                {p.features && p.features.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {p.features.map((f, i) => (
                      <span key={i} className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                        {f}
                      </span>
                    ))}
                  </div>
                )}

                {/* SDG Alignment */}
                {p.sdgAlignment && p.sdgAlignment.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {p.sdgAlignment.map((sdg) => (
                      <span
                        key={sdg}
                        className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded"
                      >
                        {sdg}
                      </span>
                    ))}
                  </div>
                )}

                {/* CO2 saving */}
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                  <TrendingDown className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-medium text-slate-700">{p.co2Saving}</span>
                </div>

                {/* Loan details */}
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-xs text-slate-400">Amount Range</p>
                    <p className="font-semibold text-slate-700 mt-0.5">{amountText}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Tenure</p>
                    <p className="font-semibold text-slate-700 mt-0.5">{p.term}</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full truncate max-w-[200px]"
                    title={p.badge}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                    <span className="truncate">{p.badge}</span>
                  </span>
                  {applied[p.id] ? (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                      Applied
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
            );
          })}
        </div>
      )}
    </div>
  );
}
