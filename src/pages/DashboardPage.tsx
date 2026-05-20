import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend, Cell,
} from 'recharts';
import { getLogs, getMeasurements } from '../utils/storage';
import type { DailyLog, Measurement } from '../types';
import {
  computeWeightChange,
  movingAverage,
  caloriesBuckets,
  periodPhaseWeight,
  scatterCaloriesWeight,
} from '../utils/correlations';

const COLORS = {
  indigo: '#6366f1',
  emerald: '#10b981',
  rose: '#f43f5e',
  amber: '#f59e0b',
  violet: '#8b5cf6',
  sky: '#0ea5e9',
};

function StatCard({ title, value, sub, color }: { title: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{title}</p>
      <p className={`text-2xl font-bold mt-1`} style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mt-2">{children}</h2>;
}

function NoData({ message = 'Not enough data yet' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center h-36 text-gray-300 text-sm">{message}</div>
  );
}

const shortDate = (d: string) => d.slice(5); // MM-DD

export default function DashboardPage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [range, setRange] = useState<30 | 60 | 90 | 999>(30);

  useEffect(() => {
    setLogs(getLogs());
    setMeasurements(getMeasurements());
  }, []);

  const cutoff = range === 999 ? '' : (() => {
    const d = new Date();
    d.setDate(d.getDate() - range);
    return d.toISOString().slice(0, 10);
  })();

  const filteredLogs = cutoff ? logs.filter(l => l.date >= cutoff) : logs;

  // ── Stats ──────────────────────────────────────────────────────────────────
  const withWeight = filteredLogs.filter(l => l.weight != null);
  const startWeight = withWeight[0]?.weight;
  const latestWeight = withWeight[withWeight.length - 1]?.weight;
  const totalLost = startWeight != null && latestWeight != null ? latestWeight - startWeight : null;
  const avgCals = filteredLogs.filter(l => l.calories != null).reduce((s, l, _, a) =>
    s + l.calories! / a.length, 0);
  const trainingDays = filteredLogs.filter(l => l.hadTraining).length;
  const latestMeasurement = measurements[measurements.length - 1];

  // ── Weight trend data ──────────────────────────────────────────────────────
  const weightChanges = computeWeightChange(filteredLogs);
  const maData = movingAverage(withWeight.map(l => ({ date: l.date, weight: l.weight! })));
  const weightChartData = weightChanges.map(d => {
    const ma = maData.find(m => m.date === d.date);
    return { ...d, ma: ma?.avg };
  });

  // ── Calories + weight dual axis ────────────────────────────────────────────
  const calWeightData = filteredLogs
    .filter(l => l.calories != null)
    .map(l => ({
      date: shortDate(l.date),
      calories: l.calories,
      weight: l.weight,
    }));

  // ── Training impact ────────────────────────────────────────────────────────
  type TrainImpact = { label: string; avg: number; count: number };
  const trainingImpact: TrainImpact[] = (() => {
    const res: Record<string, { total: number; count: number }> = {
      'Trained': { total: 0, count: 0 },
      'Rest day': { total: 0, count: 0 },
    };
    for (let i = 1; i < withWeight.length; i++) {
      const prev = withWeight[i - 1];
      const change = withWeight[i].weight! - prev.weight!;
      const k = prev.hadTraining ? 'Trained' : 'Rest day';
      res[k].total += change;
      res[k].count++;
    }
    return Object.entries(res)
      .filter(([, v]) => v.count > 0)
      .map(([label, v]) => ({ label, avg: parseFloat((v.total / v.count).toFixed(3)), count: v.count }));
  })();

  // ── Alcohol impact ─────────────────────────────────────────────────────────
  type AlcoholImpact = { label: string; avg: number; count: number };
  const alcoholImpact: AlcoholImpact[] = (() => {
    const res: Record<string, { total: number; count: number }> = {
      'Had alcohol': { total: 0, count: 0 },
      'No alcohol': { total: 0, count: 0 },
    };
    for (let i = 1; i < withWeight.length; i++) {
      const prev = withWeight[i - 1];
      const change = withWeight[i].weight! - prev.weight!;
      const k = prev.notes.alcohol ? 'Had alcohol' : 'No alcohol';
      res[k].total += change;
      res[k].count++;
    }
    return Object.entries(res)
      .filter(([, v]) => v.count > 0)
      .map(([label, v]) => ({ label, avg: parseFloat((v.total / v.count).toFixed(3)), count: v.count }));
  })();

  // ── Sleep impact ───────────────────────────────────────────────────────────
  const sleepImpact = (() => {
    const res: Record<string, { total: number; count: number }> = {
      'Bad sleep': { total: 0, count: 0 },
      'Good sleep': { total: 0, count: 0 },
    };
    for (let i = 1; i < withWeight.length; i++) {
      const prev = withWeight[i - 1];
      const change = withWeight[i].weight! - prev.weight!;
      const k = prev.notes.badSleep ? 'Bad sleep' : 'Good sleep';
      res[k].total += change;
      res[k].count++;
    }
    return Object.entries(res)
      .filter(([, v]) => v.count > 0)
      .map(([label, v]) => ({ label, avg: parseFloat((v.total / v.count).toFixed(3)), count: v.count }));
  })();

  // ── Calorie buckets ────────────────────────────────────────────────────────
  const calBuckets = caloriesBuckets(filteredLogs);

  // ── Period phase ───────────────────────────────────────────────────────────
  const phaseData = periodPhaseWeight(filteredLogs);

  // ── Scatter calories vs weight ─────────────────────────────────────────────
  const scatter = scatterCaloriesWeight(filteredLogs);

  // ── Steps ──────────────────────────────────────────────────────────────────
  const withSteps = filteredLogs.filter(l => l.steps != null);
  const avgSteps = withSteps.length > 0
    ? Math.round(withSteps.reduce((s, l) => s + l.steps!, 0) / withSteps.length)
    : null;

  const stepsChartData = filteredLogs
    .filter(l => l.steps != null)
    .map(l => ({ date: shortDate(l.date), steps: l.steps, weight: l.weight }));

  const stepsBuckets = (() => {
    const buckets: Record<string, { total: number; count: number }> = {
      '<5k': { total: 0, count: 0 },
      '5-8k': { total: 0, count: 0 },
      '8-10k': { total: 0, count: 0 },
      '10-15k': { total: 0, count: 0 },
      '>15k': { total: 0, count: 0 },
    };
    for (let i = 1; i < withWeight.length; i++) {
      const prev = withWeight[i - 1];
      if (prev.steps == null) continue;
      const change = withWeight[i].weight! - prev.weight!;
      const s = prev.steps;
      const key = s < 5000 ? '<5k' : s < 8000 ? '5-8k' : s < 10000 ? '8-10k' : s < 15000 ? '10-15k' : '>15k';
      buckets[key].total += change;
      buckets[key].count++;
    }
    return Object.entries(buckets)
      .filter(([, v]) => v.count > 0)
      .map(([bucket, v]) => ({ bucket, avgChange: parseFloat((v.total / v.count).toFixed(3)), count: v.count }));
  })();

  const stepsWeightScatter = filteredLogs
    .filter(l => l.steps != null && l.weight != null)
    .map(l => ({ steps: l.steps!, weight: l.weight!, date: l.date }));

  // ── Measurements trend ─────────────────────────────────────────────────────
  const measChartData = measurements.map(m => ({
    date: shortDate(m.date),
    waist: m.waist,
    hips: m.hips,
    thighL: m.thighLeft,
    thighR: m.thighRight,
  }));

  // ── Stress/tiredness weekly avg ────────────────────────────────────────────
  const stressTired = filteredLogs
    .filter((_, i) => i % 1 === 0)
    .map(l => ({
      date: shortDate(l.date),
      tiredness: l.notes.tiredness,
      stress: l.notes.stress,
      hunger: l.notes.hunger,
      weight: l.weight,
    }));

  const RangeButton = ({ v }: { v: 30 | 60 | 90 | 999 }) => (
    <button
      onClick={() => setRange(v)}
      className={`px-3 py-1 rounded-full text-xs font-medium transition ${
        range === v ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {v === 999 ? 'All' : `${v}d`}
    </button>
  );

  if (logs.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-4xl mb-3">📊</p>
        <p className="font-medium">Dashboard will appear once you start logging</p>
        <p className="text-sm mt-1">Add at least a few days of data to see charts</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Range selector */}
      <div className="flex gap-2">
        <RangeButton v={30} /><RangeButton v={60} /><RangeButton v={90} /><RangeButton v={999} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard
          title="Weight change"
          value={totalLost != null ? `${totalLost > 0 ? '+' : ''}${totalLost.toFixed(1)} kg` : '—'}
          sub={`${startWeight?.toFixed(1)} → ${latestWeight?.toFixed(1)} kg`}
          color={totalLost != null && totalLost < 0 ? COLORS.emerald : COLORS.rose}
        />
        <StatCard
          title="Avg calories"
          value={avgCals > 0 ? `${Math.round(avgCals)}` : '—'}
          sub="kcal / day"
          color={COLORS.amber}
        />
        <StatCard
          title="Training days"
          value={String(trainingDays)}
          sub={`of ${filteredLogs.length} days`}
          color={COLORS.indigo}
        />
        <StatCard
          title="Avg steps"
          value={avgSteps != null ? avgSteps.toLocaleString() : '—'}
          sub="steps / day"
          color={COLORS.emerald}
        />
        <StatCard
          title="Waist"
          value={latestMeasurement?.waist ? `${latestMeasurement.waist} cm` : '—'}
          sub="last measurement"
          color={COLORS.violet}
        />
      </div>

      {/* ── Weight trend ── */}
      <SectionTitle>Weight Trend</SectionTitle>
      <div className="bg-white rounded-2xl shadow-sm p-4">
        {weightChartData.length < 2 ? <NoData /> : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weightChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={shortDate} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} width={40} />
              <Tooltip formatter={(v) => [`${Number(v).toFixed(1)} kg`]} />
              <Legend />
              <Line type="monotone" dataKey="weight" stroke={COLORS.indigo} dot={{ r: 2 }} strokeWidth={2} name="Weight" />
              <Line type="monotone" dataKey="ma" stroke={COLORS.emerald} dot={false} strokeWidth={2.5} strokeDasharray="5 3" name="7d avg" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Calories vs weight ── */}
      <SectionTitle>Calories &amp; Weight Over Time</SectionTitle>
      <div className="bg-white rounded-2xl shadow-sm p-4">
        {calWeightData.length < 3 ? <NoData /> : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={calWeightData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="cal" orientation="right" tick={{ fontSize: 11 }} width={45} />
              <YAxis yAxisId="kg" orientation="left" domain={['auto', 'auto']} tick={{ fontSize: 11 }} width={40} />
              <Tooltip />
              <Legend />
              <Line yAxisId="kg" type="monotone" dataKey="weight" stroke={COLORS.indigo} dot={{ r: 2 }} strokeWidth={2} name="Weight (kg)" />
              <Line yAxisId="cal" type="monotone" dataKey="calories" stroke={COLORS.amber} dot={{ r: 2 }} strokeWidth={2} name="Calories" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Correlation: next-day weight change ── */}
      <SectionTitle>Next-Day Weight Change By Factor</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Training */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 mb-2">🏋️ Training</p>
          {trainingImpact.length < 1 ? <NoData message="Need more data" /> : (
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={trainingImpact} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${v > 0 ? '+' : ''}${v}`} />
                <YAxis dataKey="label" type="category" tick={{ fontSize: 10 }} width={65} />
                <Tooltip formatter={(v) => { const n = Number(v); return [`${n > 0 ? '+' : ''}${n.toFixed(3)} kg`]; }} />
                <ReferenceLine x={0} stroke="#999" />
                <Bar dataKey="avg" name="Avg Δ kg">
                  {trainingImpact.map((entry, i) => (
                    <Cell key={i} fill={entry.avg < 0 ? COLORS.emerald : COLORS.rose} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Alcohol */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 mb-2">🍷 Alcohol</p>
          {alcoholImpact.length < 1 ? <NoData message="Need more data" /> : (
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={alcoholImpact} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${v > 0 ? '+' : ''}${v}`} />
                <YAxis dataKey="label" type="category" tick={{ fontSize: 10 }} width={70} />
                <Tooltip formatter={(v) => { const n = Number(v); return [`${n > 0 ? '+' : ''}${n.toFixed(3)} kg`]; }} />
                <ReferenceLine x={0} stroke="#999" />
                <Bar dataKey="avg" name="Avg Δ kg">
                  {alcoholImpact.map((entry, i) => (
                    <Cell key={i} fill={entry.avg < 0 ? COLORS.emerald : COLORS.rose} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Sleep */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 mb-2">💤 Sleep</p>
          {sleepImpact.length < 1 ? <NoData message="Need more data" /> : (
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={sleepImpact} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${v > 0 ? '+' : ''}${v}`} />
                <YAxis dataKey="label" type="category" tick={{ fontSize: 10 }} width={65} />
                <Tooltip formatter={(v) => { const n = Number(v); return [`${n > 0 ? '+' : ''}${n.toFixed(3)} kg`]; }} />
                <ReferenceLine x={0} stroke="#999" />
                <Bar dataKey="avg" name="Avg Δ kg">
                  {sleepImpact.map((entry, i) => (
                    <Cell key={i} fill={entry.avg < 0 ? COLORS.emerald : COLORS.rose} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Calorie buckets ── */}
      <SectionTitle>Weight Change by Calorie Intake</SectionTitle>
      <div className="bg-white rounded-2xl shadow-sm p-4">
        {calBuckets.length < 2 ? <NoData /> : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={calBuckets}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={v => `${v > 0 ? '+' : ''}${v}`} tick={{ fontSize: 11 }} width={45} />
              <Tooltip formatter={(v) => { const n = Number(v); return [`${n > 0 ? '+' : ''}${n.toFixed(3)} kg avg next-day change`]; }} />
              <ReferenceLine y={0} stroke="#999" />
              <Bar dataKey="avgChange" name="Avg Δ next day">
                {calBuckets.map((entry, i) => (
                  <Cell key={i} fill={entry.avgChange < 0 ? COLORS.emerald : COLORS.rose} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Period phase ── */}
      {phaseData.length > 0 && (
        <>
          <SectionTitle>Average Weight by Cycle Phase</SectionTitle>
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={phaseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="phase" tick={{ fontSize: 10 }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} width={40} />
                <Tooltip formatter={(v) => [`${Number(v).toFixed(2)} kg avg`]} />
                <Bar dataKey="avgWeight" fill={COLORS.violet} name="Avg weight" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-400 mt-2">
              Luteal phase often shows higher weight due to water retention — totally normal!
            </p>
          </div>
        </>
      )}

      {/* ── Stress/tiredness trend ── */}
      <SectionTitle>Wellbeing Scores Over Time</SectionTitle>
      <div className="bg-white rounded-2xl shadow-sm p-4">
        {stressTired.length < 3 ? <NoData /> : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stressTired}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} width={25} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="tiredness" stroke={COLORS.sky} dot={false} strokeWidth={2} name="Tiredness" />
              <Line type="monotone" dataKey="stress" stroke={COLORS.rose} dot={false} strokeWidth={2} name="Stress" />
              <Line type="monotone" dataKey="hunger" stroke={COLORS.amber} dot={false} strokeWidth={2} name="Hunger" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Scatter: calories vs weight ── */}
      <SectionTitle>Calories vs Weight (Scatter)</SectionTitle>
      <div className="bg-white rounded-2xl shadow-sm p-4">
        {scatter.length < 5 ? <NoData /> : (
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="calories" name="Calories" tick={{ fontSize: 11 }} label={{ value: 'Calories', position: 'insideBottom', offset: -5, fontSize: 11 }} />
              <YAxis dataKey="weight" name="Weight" tick={{ fontSize: 11 }} width={40} label={{ value: 'kg', angle: -90, position: 'insideLeft', fontSize: 11 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-white border border-gray-100 rounded-xl shadow px-3 py-2 text-xs">
                    <p>{d.date}</p>
                    <p>🍽️ {d.calories} kcal</p>
                    <p>⚖️ {d.weight} kg</p>
                  </div>
                );
              }} />
              <Scatter data={scatter} fill={COLORS.indigo} opacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Steps over time ── */}
      <SectionTitle>Steps Over Time</SectionTitle>
      <div className="bg-white rounded-2xl shadow-sm p-4">
        {stepsChartData.length < 2 ? <NoData /> : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stepsChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="steps" orientation="left" tick={{ fontSize: 11 }} width={45} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <YAxis yAxisId="kg" orientation="right" domain={['auto', 'auto']} tick={{ fontSize: 11 }} width={40} />
              <Tooltip formatter={(v, name) => name === 'Steps' ? [Number(v).toLocaleString()] : [`${v} kg`]} />
              <Legend />
              <ReferenceLine yAxisId="steps" y={10000} stroke={COLORS.emerald} strokeDasharray="4 2" label={{ value: '10k goal', fontSize: 10, fill: COLORS.emerald }} />
              <Line yAxisId="steps" type="monotone" dataKey="steps" stroke={COLORS.sky} dot={{ r: 2 }} strokeWidth={2} name="Steps" />
              <Line yAxisId="kg" type="monotone" dataKey="weight" stroke={COLORS.indigo} dot={false} strokeWidth={1.5} strokeDasharray="4 2" name="Weight (kg)" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Steps bucket correlation ── */}
      <SectionTitle>Next-Day Weight Change by Steps</SectionTitle>
      <div className="bg-white rounded-2xl shadow-sm p-4">
        {stepsBuckets.length < 2 ? <NoData /> : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stepsBuckets}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={v => `${v > 0 ? '+' : ''}${v}`} tick={{ fontSize: 11 }} width={45} />
              <Tooltip formatter={(v) => { const n = Number(v); return [`${n > 0 ? '+' : ''}${n.toFixed(3)} kg avg next-day change`]; }} />
              <ReferenceLine y={0} stroke="#999" />
              <Bar dataKey="avgChange" name="Avg Δ next day">
                {stepsBuckets.map((entry, i) => (
                  <Cell key={i} fill={entry.avgChange < 0 ? COLORS.emerald : COLORS.rose} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Steps vs weight scatter ── */}
      <SectionTitle>Steps vs Weight (Scatter)</SectionTitle>
      <div className="bg-white rounded-2xl shadow-sm p-4">
        {stepsWeightScatter.length < 5 ? <NoData /> : (
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="steps" name="Steps" tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} label={{ value: 'Steps', position: 'insideBottom', offset: -5, fontSize: 11 }} />
              <YAxis dataKey="weight" name="Weight" tick={{ fontSize: 11 }} width={40} label={{ value: 'kg', angle: -90, position: 'insideLeft', fontSize: 11 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-white border border-gray-100 rounded-xl shadow px-3 py-2 text-xs">
                    <p>{d.date}</p>
                    <p>👟 {d.steps.toLocaleString()} steps</p>
                    <p>⚖️ {d.weight} kg</p>
                  </div>
                );
              }} />
              <Scatter data={stepsWeightScatter} fill={COLORS.sky} opacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Measurements trend ── */}
      {measChartData.length > 1 && (
        <>
          <SectionTitle>Body Measurements Trend</SectionTitle>
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={measChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} width={40} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="waist" stroke={COLORS.rose} strokeWidth={2} dot={{ r: 3 }} name="Waist" />
                <Line type="monotone" dataKey="hips" stroke={COLORS.violet} strokeWidth={2} dot={{ r: 3 }} name="Hips" />
                <Line type="monotone" dataKey="thighL" stroke={COLORS.emerald} strokeWidth={2} dot={{ r: 3 }} name="Thigh L" />
                <Line type="monotone" dataKey="thighR" stroke={COLORS.sky} strokeWidth={2} dot={{ r: 3 }} name="Thigh R" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <div className="pb-6" />
    </div>
  );
}
