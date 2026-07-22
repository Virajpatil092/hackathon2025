import { useState, useEffect } from 'react';
import { ArrowDownRight, ArrowUpRight, TrendingDown, Info } from 'lucide-react';
import { getCarbonFootprint } from '@/services/api';
import { EmissionsDonut, TrendLineChart, StackedBarChart } from '@/components/Charts';

export default function CarbonFootprint() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCarbonFootprint()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSkeleton />;
  if (!data) return <div className="p-8 text-slate-500">Failed to load data.</div>;

  const isDown = data.vsNationalAverage < 0;
  const ArrowIcon = isDown ? ArrowDownRight : ArrowUpRight;
  const monthChangeDown = data.vsLastMonth < 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Carbon Footprint</h1>
        <p className="text-sm text-slate-500 mt-1">
          Your personal carbon emissions, tracked monthly and compared against national benchmarks.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="This Month" value={`${data.kgThisMonth}`} unit="kg CO₂e" accent="emerald" />
        <StatCard
          label="vs National Average"
          value={`${isDown ? '' : '+'}${data.vsNationalAverage}%`}
          sub={isDown ? 'below average' : 'above average'}
          accent={isDown ? 'emerald' : 'rose'}
          icon={<ArrowIcon className="w-4 h-4" />}
        />
        <StatCard
          label="vs Last Month"
          value={`${data.vsLastMonth}%`}
          sub={monthChangeDown ? 'decreased' : 'increased'}
          accent={monthChangeDown ? 'emerald' : 'amber'}
        />
        <StatCard label="Top Source" value={data.topEmissionCategory} sub="largest category" accent="blue" />
      </div>

      {/* Donut + Line chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Emissions by Category" subtitle="Breakdown of this month's CO₂e" />
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            <div className="w-full sm:w-1/2">
              <EmissionsDonut
                data={data.categoryBreakdown}
                centerValue={`${data.kgThisMonth}`}
                centerLabel="kg CO₂e"
              />
            </div>
            <div className="flex-1 space-y-2 w-full">
              {data.categoryBreakdown.map((c) => (
                <div key={c.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: c.color }} />
                    <span className="text-slate-600">{c.label}</span>
                  </div>
                  <span className="font-semibold text-slate-700">{c.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="6-Month Trend" subtitle="Monthly CO₂e (kg)" />
          <div className="pt-2">
            <TrendLineChart data={data.sixMonthTrend} />
          </div>
        </Card>
      </div>

      {/* Weekly stacked bar */}
      <Card>
        <CardHeader title="Weekly Breakdown by Category" subtitle="Last 4 weeks of emissions (kg CO₂e)" />
        <div className="pt-4">
          <StackedBarChart data={data.weeklyBreakdown} />
        </div>
      </Card>

      {/* Benchmark comparison */}
      <Card>
        <CardHeader
          title="Benchmark Comparison"
          subtitle="How your footprint compares to national and international targets"
        />
        <div className="space-y-5 pt-4">
          <BenchmarkBar label="Your Footprint" value={data.benchmarks.yourFootprint} max={data.benchmarks.maxScale} color="bg-emerald-500" />
          <BenchmarkBar label="National Average" value={data.benchmarks.nationalAverage} max={data.benchmarks.maxScale} color="bg-slate-400" />
          <BenchmarkBar label="EU 2030 Target" value={data.benchmarks.euTarget} max={data.benchmarks.maxScale} color="bg-teal-500" />
          <BenchmarkBar label="Paris Agreement Target" value={data.benchmarks.parisAgreementTarget} max={data.benchmarks.maxScale} color="bg-cyan-500" />
        </div>
        <div className="mt-6 flex items-start gap-3 p-4 bg-emerald-50 rounded-xl">
          <TrendingDown className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-800">
            You're <span className="font-semibold">{Math.abs(data.vsNationalAverage)}% below</span> the national average.
            To meet the EU 2030 target, reduce by{' '}
            <span className="font-semibold">{data.kgThisMonth - data.benchmarks.euTarget} kg</span> more per month.
          </p>
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value, unit, sub, accent, icon }) {
  const accents = {
    emerald: 'text-emerald-600',
    rose: 'text-rose-600',
    amber: 'text-amber-600',
    blue: 'text-blue-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className={`text-2xl font-bold ${accents[accent] || accents.emerald}`}>{value}</span>
        {unit && <span className="text-sm text-slate-400">{unit}</span>}
        {icon}
      </div>
      {sub && <p className="text-sm text-slate-400 mt-1">{sub}</p>}
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

function BenchmarkBar({ label, value, max, color }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="font-semibold text-slate-700">{value} kg</span>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700 ease-out`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-slate-200 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-slate-100 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 bg-slate-100 rounded-2xl" />
        <div className="h-80 bg-slate-100 rounded-2xl" />
      </div>
    </div>
  );
}
