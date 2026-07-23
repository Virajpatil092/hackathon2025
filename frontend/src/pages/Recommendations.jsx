import { useState, useEffect } from 'react';
import { Train, Leaf, Zap, Bike, ArrowRight, X, CheckCircle2, Clock, AlertCircle, TrendingDown, Sparkles, CreditCard } from 'lucide-react';
import { getRecommendations, dismissRecommendation, applyRecommendation } from '@/services/api';

const ICONS = { train: Train, leaf: Leaf, zap: Zap, bike: Bike };

const PRIORITY_STYLES = {
  high: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', label: 'High Priority' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', label: 'Medium Priority' },
};

const DIFFICULTY_STYLES = {
  easy: { icon: CheckCircle2, text: 'text-emerald-600' },
  medium: { icon: Clock, text: 'text-amber-600' },
  hard: { icon: AlertCircle, text: 'text-rose-600' },
};

export default function Recommendations() {
  const [data, setData] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState({});

  useEffect(() => {
    getRecommendations()
      .then((result) => {
        setData(result);
        setItems(result.recommendations || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDismiss = async (id) => {
    await dismissRecommendation(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleApply = async (id) => {
    await applyRecommendation(id);
    setApplied((prev) => ({ ...prev, [id]: true }));
  };

  if (loading)
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-slate-100 rounded-2xl" />
        ))}
      </div>
    );

  if (!items.length)
    return (
      <div className="p-8 text-center text-slate-500">
        <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400 mb-3" />
        No recommendations right now - you're doing great!
      </div>
    );

  const totalSavings = items.reduce((sum, r) => sum + (r.savingKg || 0), 0);
  const currentFootprint = data?.currentFootprint;
  const projectedFootprint = data?.projectedFootprint;
  const hasProjection = currentFootprint != null && projectedFootprint != null;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Recommendations</h1>
          <p className="text-sm text-slate-500 mt-1">
            Personalised actions to reduce your carbon footprint, based on your spending patterns.
          </p>
        </div>
        <div className="bg-emerald-50 rounded-xl px-4 py-3 flex items-center gap-2">
          <Leaf className="w-5 h-5 text-emerald-600" />
          <div>
            <p className="text-xs text-emerald-600 font-medium">Total Potential Savings</p>
            <p className="text-lg font-bold text-emerald-700">{Math.round(totalSavings)} kg CO₂e/mo</p>
          </div>
        </div>
      </div>

      {/* Projected improvement banner */}
      {hasProjection && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-700 p-6 text-white shadow-lg">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 text-emerald-100 text-sm mb-3">
              <Sparkles className="w-4 h-4" />
              <span>Your Projected Impact</span>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
              {/* Current */}
              <div>
                <p className="text-xs text-emerald-200 uppercase tracking-wide">Current Footprint</p>
                <p className="text-3xl font-bold mt-1">{Math.round(currentFootprint)} <span className="text-lg font-normal text-emerald-200">kg CO₂e/mo</span></p>
              </div>
              {/* Arrow */}
              <div className="hidden sm:flex items-center">
                <TrendingDown className="w-8 h-8 text-emerald-200" />
              </div>
              {/* Projected */}
              <div>
                <p className="text-xs text-emerald-200 uppercase tracking-wide">Projected Footprint</p>
                <p className="text-3xl font-bold mt-1">{Math.round(projectedFootprint)} <span className="text-lg font-normal text-emerald-200">kg CO₂e/mo</span></p>
              </div>
              {/* Reduction pill */}
              <div className="sm:ml-auto">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3 text-center">
                  <p className="text-xs text-emerald-100">Potential Reduction</p>
                  <p className="text-2xl font-bold">
                    {currentFootprint > 0
                      ? Math.round(((currentFootprint - projectedFootprint) / currentFootprint) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-4">
              <div className="w-full bg-white/20 rounded-full h-2.5">
                <div
                  className="bg-white rounded-full h-2.5 transition-all duration-700"
                  style={{
                    width: `${currentFootprint > 0
                      ? Math.min(100, Math.round(((currentFootprint - projectedFootprint) / currentFootprint) * 100))
                      : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendation cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {items.map((rec) => {
          const Icon = ICONS[rec.icon] || Leaf;
          const pStyle = PRIORITY_STYLES[rec.priority] || PRIORITY_STYLES.medium;
          const dStyle = DIFFICULTY_STYLES[rec.difficulty] || DIFFICULTY_STYLES.easy;
          const DIcon = dStyle.icon;
          const isApplied = applied[rec.id];
          const hasCurrentProjected = rec.currentKg != null && rec.projectedKg != null;

          return (
            <div
              key={rec.id}
              className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-200 relative"
            >
              <button
                onClick={() => handleDismiss(rec.id)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pStyle.bg} ${pStyle.text}`}>
                      {pStyle.label}
                    </span>
                    <span className="text-xs text-slate-400">{rec.category}</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-800 pr-8">{rec.title}</h3>
                  <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{rec.description}</p>
                </div>
              </div>

              {/* Metrics grid: currentKg → projectedKg + saving + timeframe */}
              <div className={`mt-5 grid ${hasCurrentProjected ? 'grid-cols-4' : 'grid-cols-3'} gap-3 text-center`}>
                {hasCurrentProjected && (
                  <div className="bg-gradient-to-b from-slate-50 to-emerald-50/50 rounded-lg py-2 px-1">
                    <p className="text-xs text-slate-400">Category Impact</p>
                    <p className="text-sm font-bold text-slate-600">
                      {Math.round(rec.currentKg)} <span className="text-emerald-500">→ {Math.round(rec.projectedKg)}</span>
                    </p>
                    <p className="text-[10px] text-slate-400">kg CO₂e</p>
                  </div>
                )}
                <div className="bg-slate-50 rounded-lg py-2">
                  <p className="text-xs text-slate-400">Saving</p>
                  <p className="text-sm font-bold text-emerald-600">{Math.round(rec.savingKg)} kg</p>
                </div>
                <div className="bg-slate-50 rounded-lg py-2">
                  <p className="text-xs text-slate-400">Reduction</p>
                  <p className="text-sm font-bold text-slate-700">{Math.round(rec.savingPct)}%</p>
                </div>
                <div className="bg-slate-50 rounded-lg py-2">
                  <p className="text-xs text-slate-400">Timeframe</p>
                  <p className="text-sm font-bold text-slate-700">{rec.timeframe}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className={`flex items-center gap-1.5 text-xs ${dStyle.text}`}>
                  <DIcon className="w-3.5 h-3.5" />
                  <span className="capitalize">{rec.difficulty}</span>
                </div>
                <div className="flex items-center gap-3">
                  {isApplied ? (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                      Applied!
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        handleApply(rec.id);
                        const event = new CustomEvent('navigate', {
                          detail: {
                            page: 'financing',
                            productId: rec.linkedProduct?.id,
                            category: rec.category,
                            title: rec.title,
                          },
                        });
                        window.dispatchEvent(event);
                      }}
                      className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      {rec.linkedProduct && <CreditCard className="w-4 h-4 text-emerald-600" />}
                      {rec.ctaLabel || (rec.linkedProduct ? `Explore ${rec.linkedProduct.name}` : 'Explore Financing')}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
