import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Target,
  TrendingUp,
} from 'lucide-react';
import { getESGInsights } from '@/services/api';
import { ESGRadarChart, ScopeBarChart, ScopeTrendChart, ScoreHistoryChart } from '@/components/Charts';

export default function ESGInsights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getESGInsights()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-slate-100 rounded-2xl" />
        ))}
      </div>
    );

  if (!data) return <div className="p-8 text-slate-500">Failed to load ESG data.</div>;

  const radarData = [
    { axis: 'Environmental', yourScore: data.radarScores.yourScore.environmental, industryAvg: data.radarScores.industryAverage.environmental },
    { axis: 'Social', yourScore: data.radarScores.yourScore.social, industryAvg: data.radarScores.industryAverage.social },
    { axis: 'Governance', yourScore: data.radarScores.yourScore.governance, industryAvg: data.radarScores.industryAverage.governance },
  ];

  const scopeData = [
    { label: 'Scope 1', value: data.scopeEmissions.scope1.value, color: data.scopeEmissions.scope1.color },
    { label: 'Scope 2', value: data.scopeEmissions.scope2.value, color: data.scopeEmissions.scope2.color },
    { label: 'Scope 3', value: data.scopeEmissions.scope3.value, color: data.scopeEmissions.scope3.color },
  ];

  const scopeTotal = scopeData.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">ESG Insights</h1>
        <p className="text-sm text-slate-500 mt-1">
          Your corporate sustainability metrics, regulatory standing, and priority actions.
        </p>
      </div>

      {/* ESG Score summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {radarData.map((d) => {
          const diff = d.yourScore - d.industryAvg;
          return (
            <div key={d.axis} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{d.axis}</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-800">{d.yourScore}</span>
                <span className="text-sm text-slate-400">/ 100</span>
              </div>
              <div className={`mt-2 flex items-center gap-1 text-xs ${diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{diff >= 0 ? '+' : ''}{diff} vs industry avg</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Radar + Scope Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="ESG Score Overview" subtitle="Your score vs industry average" />
          <div className="pt-2">
            <ESGRadarChart data={radarData} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Scope Emissions" subtitle="GHG emissions breakdown (tCO₂e)" />
          <div className="pt-4">
            <ScopeBarChart data={scopeData} />
            <div className="mt-4 p-3 bg-slate-50 rounded-xl flex justify-between text-sm">
              <span className="text-slate-500">Total emissions</span>
              <span className="font-bold text-slate-800">{scopeTotal} tCO₂e</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Scope Trend + Score History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Scope Emissions Trend" subtitle="7-month breakdown by scope (tCO₂e)" />
          <div className="pt-2">
            <ScopeTrendChart data={data.scopeTrend} />
          </div>
        </Card>

        <Card>
          <CardHeader title="ESG Score History" subtitle="Monthly score progression" />
          <div className="pt-2">
            <ScoreHistoryChart data={data.esgScoreHistory} />
          </div>
        </Card>
      </div>

      {/* Regulatory compliance */}
      <Card>
        <CardHeader title="Regulatory Compliance" subtitle="EU sustainability directives applicable to your business" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          {data.regulatoryCompliance.map((r) => {
            const styles = {
              green: { icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
              yellow: { icon: AlertTriangle, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
            };
            const s = styles[r.color] || { icon: Info, bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
            const Icon = s.icon;
            return (
              <div key={r.id} className={`p-4 rounded-xl border ${s.border} ${s.bg}`}>
                <Icon className={`w-5 h-5 ${s.text} mb-2`} />
                <h4 className="text-sm font-semibold text-slate-800">{r.name}</h4>
                <p className={`text-xs mt-1 ${s.text}`}>{r.status}</p>
                <p className="text-xs text-slate-500 mt-2">{r.description}</p>
                <p className="text-xs text-slate-400 mt-2">Deadline: {r.deadline}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Priority actions */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-semibold text-slate-800">Priority Actions</h3>
        </div>
        <div className="space-y-2">
          {data.priorityActions.map((action, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span className="text-sm text-slate-600">{action}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Card({ children }) {
  return <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">{children}</div>;
}

function CardHeader({ title, subtitle }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}
