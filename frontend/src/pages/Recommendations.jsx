import { useState, useEffect } from 'react';
import { Train, Leaf, Zap, Bike, ArrowRight, X, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
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
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState({});

  useEffect(() => {
    getRecommendations()
      .then(setItems)
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

  const totalSavings = items.reduce((sum, r) => sum + r.savingKg, 0);

  return (
    <div className="space-y-6">
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
            <p className="text-lg font-bold text-emerald-700">{totalSavings} kg CO₂e/yr</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {items.map((rec) => {
          const Icon = ICONS[rec.icon] || Leaf;
          const pStyle = PRIORITY_STYLES[rec.priority] || PRIORITY_STYLES.medium;
          const dStyle = DIFFICULTY_STYLES[rec.difficulty] || DIFFICULTY_STYLES.easy;
          const DIcon = dStyle.icon;
          const isApplied = applied[rec.id];

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

              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 rounded-lg py-2">
                  <p className="text-xs text-slate-400">Saving</p>
                  <p className="text-sm font-bold text-emerald-600">{rec.savingKg} kg</p>
                </div>
                <div className="bg-slate-50 rounded-lg py-2">
                  <p className="text-xs text-slate-400">Reduction</p>
                  <p className="text-sm font-bold text-slate-700">{rec.savingPct}%</p>
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
                {isApplied ? (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    Applied!
                  </span>
                ) : (
                  <button
                    onClick={() => handleApply(rec.id)}
                    className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    {rec.ctaLabel}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
