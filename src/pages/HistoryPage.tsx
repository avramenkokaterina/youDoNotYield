import { useState, useEffect } from 'react';
import { getLogs } from '../utils/storage';
import type { DailyLog } from '../types';

const tierColor = (v: number) =>
  v <= 2 ? 'text-emerald-600 bg-emerald-50' : v === 3 ? 'text-amber-600 bg-amber-50' : 'text-rose-600 bg-rose-50';

export default function HistoryPage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);

  useEffect(() => {
    setLogs(getLogs().slice().reverse());
  }, []);

  if (logs.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-4xl mb-3">📋</p>
        <p className="font-medium">No logs yet</p>
        <p className="text-sm mt-1">Start by adding today's data in the Log tab</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      <p className="text-sm text-gray-500">{logs.length} entries total</p>
      {logs.map(log => (
        <div key={log.date} className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-semibold text-gray-800">{log.date}</span>
              {log.hadTraining && (
                <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">🏋️ Trained</span>
              )}
            </div>
            <div className="flex gap-3 text-sm">
              {log.weight != null && (
                <span className="font-bold text-indigo-600">{log.weight} kg</span>
              )}
              {log.calories != null && (
                <span className="text-gray-500">{log.calories} kcal</span>
              )}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {log.steps != null && (
              <span className="text-xs bg-sky-50 text-sky-600 px-2 py-0.5 rounded-full">👟 {log.steps.toLocaleString()}</span>
            )}
            {log.periodDay != null && (
              <span className="text-xs bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full">🌸 Day {log.periodDay}</span>
            )}
            {log.notes.badSleep && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">😵 Bad sleep</span>
            )}
            {log.notes.alcohol && (
              <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                🍷 {log.notes.alcoholUnits ? `${log.notes.alcoholUnits}u` : 'Alcohol'}
              </span>
            )}
            {log.notes.bloating && (
              <span className="text-xs bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full">🎈 Bloating</span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full ${tierColor(log.notes.tiredness)}`}>
              😴 {log.notes.tiredness}/5
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${tierColor(log.notes.hunger)}`}>
              🍴 {log.notes.hunger}/5
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${tierColor(log.notes.stress)}`}>
              😰 {log.notes.stress}/5
            </span>
            {log.notes.sleepHours != null && (
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                💤 {log.notes.sleepHours}h
              </span>
            )}
          </div>

          {log.notes.custom && (
            <p className="mt-2 text-xs text-gray-500 italic">"{log.notes.custom}"</p>
          )}
        </div>
      ))}
    </div>
  );
}
