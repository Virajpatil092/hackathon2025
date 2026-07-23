// Recharts-based chart components for DecaESG.
// Each chart is a reusable wrapper with consistent styling.

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const CHART_COLORS = {
  emerald: '#16a34a',
  blue: '#3b82f6',
  amber: '#f59e0b',
  violet: '#8b5cf6',
  pink: '#ec4899',
  slate: '#94a3b8',
  teal: '#14b8a6',
  rose: '#f43f5e',
};

const tooltipStyle = {
  backgroundColor: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  fontSize: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  padding: '8px 12px',
};

// ─── Donut Chart ────────────────────────────────────────────────────────────

export function EmissionsDonut({ data, centerLabel, centerValue }) {
  return (
    <div className="relative w-full" style={{ height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, name) => [`${value}%`, name]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-bold text-slate-800">{centerValue}</span>
        <span className="text-xs text-slate-500 mt-0.5">{centerLabel}</span>
      </div>
    </div>
  );
}

// ─── Trend Line Chart ────────────────────────────────────────────────────────

export function TrendLineChart({ data, dataKey = 'value', xKey = 'month', color = CHART_COLORS.emerald, height = 260 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2.5}
          fill={`url(#grad-${dataKey})`}
          dot={{ r: 4, fill: '#fff', stroke: color, strokeWidth: 2 }}
          activeDot={{ r: 6, fill: color, stroke: '#fff', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Multi-Line Trend Chart (with target) ─────────────────────────────────────

export function MultiTrendChart({ data, height = 260 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Line type="monotone" dataKey="emissions" stroke={CHART_COLORS.emerald} strokeWidth={2.5} name="Your emissions" dot={{ r: 4, fill: '#fff', stroke: CHART_COLORS.emerald, strokeWidth: 2 }} />
        <Line type="monotone" dataKey="target" stroke={CHART_COLORS.slate} strokeWidth={2} strokeDasharray="5 4" name="Target" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Stacked Bar Chart (weekly breakdown) ─────────────────────────────────────

export function StackedBarChart({ data, height = 260 }) {
  const bars = [
    { key: 'transport', name: 'Transport', color: CHART_COLORS.emerald },
    { key: 'food', name: 'Food', color: CHART_COLORS.amber },
    { key: 'utilities', name: 'Utilities', color: CHART_COLORS.blue },
    { key: 'travel', name: 'Travel', color: CHART_COLORS.violet },
  ];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(241,245,249,0.5)' }} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        {bars.map((b) => (
          <Bar key={b.key} dataKey={b.key} stackId="a" fill={b.color} name={b.name} radius={[0, 0, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Radar Chart ─────────────────────────────────────────────────────────────

export function ESGRadarChart({ data, height = 280 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="70%">
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#cbd5e1' }} />
        <Radar name="Your Score" dataKey="yourScore" stroke={CHART_COLORS.emerald} fill={CHART_COLORS.emerald} fillOpacity={0.18} strokeWidth={2} />
        <Radar name="Industry Avg" dataKey="industryAvg" stroke={CHART_COLORS.slate} fill={CHART_COLORS.slate} fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 3" />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Tooltip contentStyle={tooltipStyle} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ─── Scope Emissions Bar Chart ────────────────────────────────────────────────

export function ScopeBarChart({ data, height = 200 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={100} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(241,245,249,0.5)' }} />
        <Bar dataKey="value" name="tCO₂e" radius={[0, 8, 8, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Scope Trend (stacked area) ───────────────────────────────────────────────

export function ScopeTrendChart({ data, height = 260 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="grad-s1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.emerald} stopOpacity={0.3} />
            <stop offset="100%" stopColor={CHART_COLORS.emerald} stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="grad-s2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.blue} stopOpacity={0.3} />
            <stop offset="100%" stopColor={CHART_COLORS.blue} stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="grad-s3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.violet} stopOpacity={0.3} />
            <stop offset="100%" stopColor={CHART_COLORS.violet} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Area type="monotone" dataKey="scope1" stackId="1" stroke={CHART_COLORS.emerald} fill="url(#grad-s1)" name="Scope 1" strokeWidth={1.5} />
        <Area type="monotone" dataKey="scope2" stackId="1" stroke={CHART_COLORS.blue} fill="url(#grad-s2)" name="Scope 2" strokeWidth={1.5} />
        <Area type="monotone" dataKey="scope3" stackId="1" stroke={CHART_COLORS.violet} fill="url(#grad-s3)" name="Scope 3" strokeWidth={1.5} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── ESG Score History Line ──────────────────────────────────────────────────

export function ScoreHistoryChart({ data, height = 200 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="grad-score" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.teal} stopOpacity={0.25} />
            <stop offset="100%" stopColor={CHART_COLORS.teal} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis domain={[50, 80]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="score" stroke={CHART_COLORS.teal} strokeWidth={2.5} fill="url(#grad-score)" name="ESG Score" dot={{ r: 3, fill: '#fff', stroke: CHART_COLORS.teal, strokeWidth: 2 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
