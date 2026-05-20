import type { DailyLog, Measurement } from '../types';

const LOGS_KEY = 'fat_loss_logs';
const MEASUREMENTS_KEY = 'fat_loss_measurements';

export function getLogs(): DailyLog[] {
  try {
    return JSON.parse(localStorage.getItem(LOGS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveLog(log: DailyLog): void {
  const logs = getLogs();
  const idx = logs.findIndex(l => l.date === log.date);
  if (idx >= 0) {
    logs[idx] = log;
  } else {
    logs.push(log);
  }
  logs.sort((a, b) => a.date.localeCompare(b.date));
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}

export function getLogByDate(date: string): DailyLog | undefined {
  return getLogs().find(l => l.date === date);
}

export function getMeasurements(): Measurement[] {
  try {
    return JSON.parse(localStorage.getItem(MEASUREMENTS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveMeasurement(m: Measurement): void {
  const measurements = getMeasurements();
  const idx = measurements.findIndex(x => x.date === m.date);
  if (idx >= 0) {
    measurements[idx] = m;
  } else {
    measurements.push(m);
  }
  measurements.sort((a, b) => a.date.localeCompare(b.date));
  localStorage.setItem(MEASUREMENTS_KEY, JSON.stringify(measurements));
}

export function getMeasurementByDate(date: string): Measurement | undefined {
  return getMeasurements().find(m => m.date === date);
}
