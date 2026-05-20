import type { DailyLog } from '../types';

export function computeWeightChange(logs: DailyLog[]): { date: string; weight: number; change: number | null }[] {
  const withWeight = logs.filter(l => l.weight != null);
  return withWeight.map((log, i) => ({
    date: log.date,
    weight: log.weight!,
    change: i === 0 ? null : log.weight! - withWeight[i - 1].weight!,
  }));
}

export function movingAverage(data: { date: string; weight: number }[], window = 7) {
  return data.map((d, i) => {
    const slice = data.slice(Math.max(0, i - window + 1), i + 1);
    const avg = slice.reduce((s, x) => s + x.weight, 0) / slice.length;
    return { date: d.date, avg: parseFloat(avg.toFixed(2)) };
  });
}

// Returns average weight change day-after based on a boolean flag
export function booleanImpact(logs: DailyLog[], flag: (l: DailyLog) => boolean): { label: string; avgChange: number; count: number } | null {
  const withWeight = logs.filter(l => l.weight != null);
  if (withWeight.length < 2) return null;

  let yesChange = 0, yesCount = 0, noChange = 0, noCount = 0;
  for (let i = 1; i < withWeight.length; i++) {
    const prev = withWeight[i - 1];
    const change = withWeight[i].weight! - prev.weight!;
    if (flag(prev)) {
      yesChange += change;
      yesCount++;
    } else {
      noChange += change;
      noCount++;
    }
  }
  return {
    label: 'impact',
    avgChange: yesCount > 0 ? parseFloat((yesChange / yesCount).toFixed(3)) : 0,
    count: yesCount,
  };
}

export function caloriesBuckets(logs: DailyLog[]): { bucket: string; avgChange: number; count: number }[] {
  const withData = logs.filter(l => l.calories != null && l.weight != null);
  const buckets: Record<string, { total: number; count: number }> = {
    '<1400': { total: 0, count: 0 },
    '1400-1700': { total: 0, count: 0 },
    '1700-2000': { total: 0, count: 0 },
    '2000-2300': { total: 0, count: 0 },
    '>2300': { total: 0, count: 0 },
  };

  const withWeight = logs.filter(l => l.weight != null);
  for (let i = 1; i < withData.length; i++) {
    const prev = withData[i - 1];
    // Find next day with weight
    const nextIdx = withWeight.findIndex(l => l.date > prev.date);
    if (nextIdx === -1) continue;
    const change = withWeight[nextIdx].weight! - prev.weight!;
    const cal = prev.calories!;
    const key =
      cal < 1400 ? '<1400' :
      cal < 1700 ? '1400-1700' :
      cal < 2000 ? '1700-2000' :
      cal < 2300 ? '2000-2300' : '>2300';
    buckets[key].total += change;
    buckets[key].count++;
  }

  return Object.entries(buckets)
    .filter(([, v]) => v.count > 0)
    .map(([bucket, v]) => ({
      bucket,
      avgChange: parseFloat((v.total / v.count).toFixed(3)),
      count: v.count,
    }));
}

export function periodPhaseWeight(logs: DailyLog[]): { phase: string; avgWeight: number; count: number }[] {
  const phaseMap: Record<string, { total: number; count: number }> = {
    'Menstrual (1-5)': { total: 0, count: 0 },
    'Follicular (6-13)': { total: 0, count: 0 },
    'Ovulation (14-16)': { total: 0, count: 0 },
    'Luteal (17-28)': { total: 0, count: 0 },
  };

  for (const log of logs) {
    if (!log.periodDay || !log.weight) continue;
    const d = log.periodDay;
    const phase =
      d <= 5 ? 'Menstrual (1-5)' :
      d <= 13 ? 'Follicular (6-13)' :
      d <= 16 ? 'Ovulation (14-16)' : 'Luteal (17-28)';
    phaseMap[phase].total += log.weight;
    phaseMap[phase].count++;
  }

  return Object.entries(phaseMap)
    .filter(([, v]) => v.count > 0)
    .map(([phase, v]) => ({
      phase,
      avgWeight: parseFloat((v.total / v.count).toFixed(2)),
      count: v.count,
    }));
}

export function scatterCaloriesWeight(logs: DailyLog[]): { calories: number; weight: number; date: string }[] {
  return logs
    .filter(l => l.calories != null && l.weight != null)
    .map(l => ({ calories: l.calories!, weight: l.weight!, date: l.date }));
}
