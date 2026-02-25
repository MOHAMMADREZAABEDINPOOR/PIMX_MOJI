import { FormEvent, useEffect, useState } from 'react';
import { AnalyticsSummary, getAnalyticsSummary } from '../services/analytics';

type RangeOption = { label: string; ms: number };

const RANGE_OPTIONS: RangeOption[] = [
  { label: '1 min', ms: 1 * 60 * 1000 },
  { label: '3 min', ms: 3 * 60 * 1000 },
  { label: '5 min', ms: 5 * 60 * 1000 },
  { label: '7 min', ms: 7 * 60 * 1000 },
  { label: '10 min', ms: 10 * 60 * 1000 },
  { label: '30 min', ms: 30 * 60 * 1000 },
  { label: '1 hour', ms: 60 * 60 * 1000 },
  { label: '2 hours', ms: 2 * 60 * 60 * 1000 },
  { label: '3 hours', ms: 3 * 60 * 60 * 1000 },
  { label: '5 hours', ms: 5 * 60 * 60 * 1000 },
  { label: '10 hours', ms: 10 * 60 * 60 * 1000 },
  { label: '17 hours', ms: 17 * 60 * 60 * 1000 },
  { label: '22 hours', ms: 22 * 60 * 60 * 1000 },
  { label: '1 day', ms: 24 * 60 * 60 * 1000 },
  { label: '2 days', ms: 2 * 24 * 60 * 60 * 1000 },
  { label: '3 days', ms: 3 * 24 * 60 * 60 * 1000 },
  { label: '5 days', ms: 5 * 24 * 60 * 60 * 1000 },
  { label: '7 days', ms: 7 * 24 * 60 * 60 * 1000 },
  { label: '9 days', ms: 9 * 24 * 60 * 60 * 1000 },
  { label: '10 days', ms: 10 * 24 * 60 * 60 * 1000 },
];

const ADMIN_USER = 'PIMX_MOJI';
const ADMIN_PASS = '123456789PIMX_MOJI@#$%^&';
const AUTH_KEY = 'pimxmoji_admin_auth';

function applySavedTheme() {
  const root = document.documentElement;
  const saved = localStorage.getItem('theme');
  const isLight = saved
    ? saved === 'light'
    : window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  root.classList.remove('light', 'dark');
  root.classList.add(isLight ? 'light' : 'dark');
}

function MetricCard({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl p-5">
      <p className="text-xs uppercase tracking-widest font-bold text-zinc-500 dark:text-zinc-400">{title}</p>
      <p className="mt-2 text-4xl font-black tracking-tight text-zinc-900 dark:text-white">{value}</p>
    </div>
  );
}

function LineChart({ title, series }: { title: string; series: Array<{ label: string; value: number }> }) {
  const width = 620;
  const height = 260;
  const pad = 24;
  const max = Math.max(1, ...series.map((d) => d.value));
  const points = series
    .map((d, i) => {
      const x = pad + (i * (width - pad * 2)) / Math.max(1, series.length - 1);
      const y = height - pad - (d.value / max) * (height - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');
  const last = series[series.length - 1];

  return (
    <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl p-5">
      <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{title}</h3>
      {series.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400 mt-6">No data to display</p>
      ) : (
        <div className="mt-4">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[260px]">
            <polyline fill="none" stroke="rgba(113,113,122,0.35)" strokeWidth="1" points={`${pad},${height - pad} ${width - pad},${height - pad}`} />
            <polyline fill="none" stroke="rgba(139,92,246,0.95)" strokeWidth="3" points={points} />
          </svg>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="rounded-xl bg-zinc-100/80 dark:bg-zinc-800/50 px-3 py-2 text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">Total </span>
              <span className="font-black text-zinc-900 dark:text-white">{series.reduce((s, d) => s + d.value, 0)}</span>
            </div>
            <div className="rounded-xl bg-zinc-100/80 dark:bg-zinc-800/50 px-3 py-2 text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">Average </span>
              <span className="font-black text-zinc-900 dark:text-white">{Math.round(series.reduce((s, d) => s + d.value, 0) / Math.max(1, series.length))}</span>
            </div>
            <div className="rounded-xl bg-zinc-100/80 dark:bg-zinc-800/50 px-3 py-2 text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">Max </span>
              <span className="font-black text-zinc-900 dark:text-white">{Math.max(0, ...series.map((d) => d.value))}</span>
            </div>
            <div className="rounded-xl bg-zinc-100/80 dark:bg-zinc-800/50 px-3 py-2 text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">Last </span>
              <span className="font-black text-zinc-900 dark:text-white">{last?.value ?? 0}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function shareRows(counts: Array<{ label: string; value: number; color: string }>) {
  const total = counts.reduce((s, r) => s + r.value, 0);
  return counts.map((row) => ({
    ...row,
    pct: total ? ((row.value / total) * 100).toFixed(1) : '0.0',
  }));
}

function StylesBreakdown({ summary }: { summary: AnalyticsSummary }) {
  const rows = summary.styleCounts.map((style, i) => ({
    label: style.label,
    value: style.count,
    color: ['bg-violet-500', 'bg-emerald-500', 'bg-blue-500', 'bg-orange-500', 'bg-fuchsia-500'][i % 5],
  }));
  const normalized = shareRows(rows);
  return (
    <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl p-5">
      <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-4">Styles Share (All Styles)</h3>
      <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
        {normalized.length === 0 && <p className="text-zinc-500 dark:text-zinc-400">No style data yet</p>}
        {normalized.map((row) => (
          <div key={row.label}>
            <div className="flex items-center justify-between text-sm mb-1 gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-2.5 h-2.5 rounded-full ${row.color}`} />
                <span className="font-bold text-zinc-700 dark:text-zinc-200 truncate">{row.label}</span>
              </div>
              <span className="text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{row.pct}% ({row.value})</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
              <div className={`h-full ${row.color}`} style={{ width: `${row.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeviceBreakdown({ summary }: { summary: AnalyticsSummary }) {
  const rows = shareRows([
    { label: 'Android', value: summary.deviceCounts.android, color: 'bg-emerald-500' },
    { label: 'iPhone', value: summary.deviceCounts.iphone, color: 'bg-blue-500' },
    { label: 'iPad', value: summary.deviceCounts.ipad, color: 'bg-cyan-500' },
    { label: 'macOS', value: summary.deviceCounts.macos, color: 'bg-violet-500' },
    { label: 'Linux', value: summary.deviceCounts.linux, color: 'bg-orange-500' },
    { label: 'Windows', value: summary.deviceCounts.windows, color: 'bg-indigo-500' },
    { label: 'Other', value: summary.deviceCounts.other, color: 'bg-zinc-500' },
  ]);
  return (
    <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl p-5">
      <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-4">Device Share</h3>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">{row.label}</span>
              <span className="text-zinc-500 dark:text-zinc-400">{row.pct}% ({row.value})</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
              <div className={`h-full ${row.color}`} style={{ width: `${row.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PimxMojiAdmin() {
  const [rangeMs, setRangeMs] = useState(RANGE_OPTIONS[6].ms);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);
  const [loadError, setLoadError] = useState('');
  const [summary, setSummary] = useState<AnalyticsSummary>({
    visits: 0,
    imagesCreated: 0,
    modeCounts: { mosaic: 0, ascii: 0, emoji: 0 },
    styleCounts: [],
    deviceCounts: { android: 0, iphone: 0, ipad: 0, windows: 0, macos: 0, linux: 0, other: 0 },
    visitsTrend: [],
    generationsTrend: [],
  });

  useEffect(() => {
    applySavedTheme();
    setAuthed(sessionStorage.getItem(AUTH_KEY) === '1');
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setRefreshTick((v) => v + 1), 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await getAnalyticsSummary(rangeMs);
        if (active) {
          setSummary(data);
          setLoadError('');
        }
      } catch (error) {
        if (active) {
          setLoadError(error instanceof Error ? error.message : 'Failed to load analytics');
        }
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [rangeMs, refreshTick]);

  const onLogin = (e: FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      sessionStorage.setItem(AUTH_KEY, '1');
      setAuthed(true);
      setLoginError('');
      return;
    }
    setLoginError('Invalid credentials');
  };

  const onLogout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    setAuthed(false);
    setPassword('');
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex items-center justify-center p-6">
        <form onSubmit={onLogin} className="w-full max-w-md rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/70 p-8 space-y-5">
          <h1 className="text-3xl font-black tracking-tight">PIMX_MOJI Admin</h1>
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-600 dark:text-zinc-300">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-4 py-3 font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-600 dark:text-zinc-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-4 py-3 font-mono"
            />
          </div>
          {loginError && <p className="text-sm text-red-500 font-semibold">{loginError}</p>}
          <button className="w-full rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black py-3">
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-4xl font-black tracking-tight">Admin Panel</h1>
          <div className="flex items-center gap-3">
            <label className="text-sm font-bold text-zinc-600 dark:text-zinc-300">Time Range</label>
            <select
              value={rangeMs}
              onChange={(e) => setRangeMs(Number(e.target.value))}
              className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 font-semibold"
            >
              {RANGE_OPTIONS.map((opt) => (
                <option key={opt.ms} value={opt.ms}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              onClick={onLogout}
              className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <MetricCard title="Visits" value={summary.visits} />
          <MetricCard title="Images Created" value={summary.imagesCreated} />
          <MetricCard title="Mosaic Created" value={summary.modeCounts.mosaic} />
          <MetricCard title="ASCII Created" value={summary.modeCounts.ascii} />
          <MetricCard title="Emoji Created" value={summary.modeCounts.emoji} />
        </div>

        {loadError && (
          <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
            API Error: {loadError}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <LineChart title="Visits Trend" series={summary.visitsTrend} />
          <LineChart title="Generations Trend" series={summary.generationsTrend} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <StylesBreakdown summary={summary} />
          <DeviceBreakdown summary={summary} />
        </div>
      </div>
    </div>
  );
}
