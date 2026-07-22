import { useState, useEffect } from 'react';
import {
  Footprints,
  TrendingDown,
  Lightbulb,
  Target,
  ArrowRight,
  Activity,
  Award,
  Sparkles,
} from 'lucide-react';
import {
  getDashboardSummary,
  getDashboardTrends,
  getGoals,
  getActivityLog,
  getCurrentUser,
} from '@/services/api';
import { MultiTrendChart } from '@/components/Charts';

export default function Dashboard({ onNavigate }) {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [goals, setGoals] = useState([]);
  const [activities, setActivities] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboardSummary(),
      getDashboardTrends(),
      getGoals(),
      getActivityLog(),
      getCurrentUser(),
    ])
      .then(([s, t, g, a, u]) => {
        setSummary(s);
        setTrends(t);
        setGoals(g);
        setActivities(a);
        setUser(u);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (!summary) return <div className="p-8 text-slate-500">Failed to load dashboard.</div>;

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 sm:p-8 text-white shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 text-emerald-100 text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Welcome back</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">{user?.name || 'there'}</h1>
          <p className="text-emerald-100 mt-2 text-sm max-w-lg">
            You're on a {summary.streakDays}-day sustainability streak. Your emissions are{' '}
            <span className="font-semibold text-white">{Math.abs(summary.emissionsChangePct)}% below</span> last month.
            Keep it up!
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('carbon')}
              className="inline-flex items-center gap-1.5 bg-white text-emerald-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-50 transition-colors"
            >
              View Carbon Footprint
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('recommendations')}
              className="inline-flex items-center gap-1.5 bg-white/15 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/25 transition-colors"
            >
              <Lightbulb className="w-4 h-4" />
              {summary.activeRecommendations} New Recommendations
            </button>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={Footprints}
          label="Monthly Emissions"
          value={`${summary.totalEmissions} ${summary.emissionsUnit}`}
          change={`${summary.emissionsChangePct}%`}
          changePositive={summary.emissionsChangePct < 0}
          accent="emerald"
        />
        <KPICard
          icon={Award}
          label="ESG Score"
          value={`${summary.esgScore}/100`}
          change={`+${summary.esgScoreChange}`}
          changePositive={true}
          accent="teal"
        />
        <KPICard
          icon={Target}
          label="Goals On Track"
          value={`${summary.goalsOnTrack}/${summary.totalGoals}`}
          change={`${summary.targetProgressPct}% progress`}
          changePositive={true}
          accent="blue"
        />
        <KPICard
          icon={Lightbulb}
          label="Potential Savings"
          value={`${summary.potentialSavings} kg`}
          change={`${summary.activeRecommendations} recommendations`}
          changePositive={true}
          accent="amber"
        />
      </div>

      {/* Trend chart + Target progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Emissions vs Target</h3>
              <p className="text-xs text-slate-400 mt-0.5">6-month trend with monthly target line</p>
            </div>
            <button
              onClick={() => onNavigate('carbon')}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
            >
              Details <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <MultiTrendChart data={trends} />
        </div>

        {/* Target ring */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-center">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Monthly Target</h3>
          <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#16a34a"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(summary.targetProgressPct / 100) * 264} 264`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-slate-800">{summary.targetProgressPct}%</span>
              <span className="text-xs text-slate-400">of target</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-4 text-center">
            Target: <span className="font-semibold text-slate-700">{summary.monthlyTarget} {summary.emissionsUnit}</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">Current: {summary.totalEmissions} {summary.emissionsUnit}</p>
        </div>
      </div>

      {/* Goals + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goals */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-800">Active Goals</h3>
            <span className="text-xs text-slate-400">{goals.length} total</span>
          </div>
          <div className="space-y-3">
            {goals.slice(0, 4).map((g) => (
              <div key={g.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 truncate pr-2">{g.title}</span>
                  <span className={`font-medium ${g.status === 'on-track' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {g.progress}%
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${g.status === 'on-track' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${g.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-slate-400" />
            <h3 className="text-base font-semibold text-slate-800">Recent Activity</h3>
          </div>
          <div className="space-y-3">
            {activities.map((a) => (
              <div key={a.id} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
                <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">{a.action}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{a.date} · {a.category}</p>
                </div>
                <span className="text-xs font-medium text-emerald-600 flex-shrink-0">{a.impact}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, change, changePositive, accent }) {
  const accents = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', grad: 'from-emerald-500 to-teal-600' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-600', grad: 'from-teal-500 to-cyan-600' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', grad: 'from-blue-500 to-indigo-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', grad: 'from-amber-500 to-orange-600' },
  };
  const a = accents[accent] || accents.emerald;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl ${a.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${a.text}`} />
        </div>
        <span className={`text-xs font-medium ${changePositive ? 'text-emerald-600' : 'text-rose-600'}`}>
          {change}
        </span>
      </div>
      <p className="text-2xl font-bold text-slate-800 mt-3">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-40 bg-slate-200 rounded-2xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-slate-100 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 bg-slate-100 rounded-2xl" />
        <div className="h-80 bg-slate-100 rounded-2xl" />
      </div>
    </div>
  );
}
