import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Save, Ruler } from 'lucide-react';
import type { Measurement } from '../types';
import { getMeasurementByDate, saveMeasurement, getMeasurements } from '../utils/storage';

const today = () => format(new Date(), 'yyyy-MM-dd');

function emptyMeasurement(date: string): Measurement {
  return { date };
}

type FieldKey = keyof Omit<Measurement, 'date'>;

const FIELDS: { key: FieldKey; label: string; emoji: string }[] = [
  { key: 'waist', label: 'Waist', emoji: '📏' },
  { key: 'hips', label: 'Hips', emoji: '📏' },
  { key: 'thighLeft', label: 'Left Thigh', emoji: '🦵' },
  { key: 'thighRight', label: 'Right Thigh', emoji: '🦵' },
  { key: 'chest', label: 'Chest', emoji: '📏' },
  { key: 'upperArmLeft', label: 'Left Upper Arm', emoji: '💪' },
  { key: 'upperArmRight', label: 'Right Upper Arm', emoji: '💪' },
  { key: 'bodyFat', label: 'Body Fat %', emoji: '📊' },
];

export default function MeasurementsPage() {
  const [date, setDate] = useState(today());
  const [measurement, setMeasurement] = useState<Measurement>(emptyMeasurement(date));
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<Measurement[]>([]);

  useEffect(() => {
    const existing = getMeasurementByDate(date);
    setMeasurement(existing ?? emptyMeasurement(date));
    setSaved(false);
  }, [date]);

  useEffect(() => {
    setHistory(getMeasurements().slice().reverse());
  }, [saved]);

  function update(key: FieldKey, value: number | undefined) {
    setMeasurement(prev => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    saveMeasurement(measurement);
    setSaved(true);
    setHistory(getMeasurements().slice().reverse());
    setTimeout(() => setSaved(false), 2000);
  }

  const lastMeasurement = history.find(m => m.date !== date);

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Ruler size={20} className="text-indigo-500" />
          <h2 className="font-semibold text-gray-800">Body Measurements</h2>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
          <input
            type="date" value={date} onChange={e => setDate(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <p className="text-xs text-gray-400 mt-1">You can log measurements any time — weekly is ideal</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map(({ key, label, emoji }) => {
            const prev = lastMeasurement?.[key] as number | undefined;
            const curr = measurement[key] as number | undefined;
            const diff = curr != null && prev != null ? curr - prev : null;
            return (
              <div key={key} className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">
                  {emoji} {label} {key === 'bodyFat' ? '(%)' : '(cm)'}
                </label>
                <input
                  type="number" step="0.1" placeholder="—"
                  value={curr ?? ''}
                  onChange={e => update(key, e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                {diff !== null && (
                  <span className={`text-xs font-medium ${diff < 0 ? 'text-emerald-500' : diff > 0 ? 'text-rose-500' : 'text-gray-400'}`}>
                    {diff > 0 ? '+' : ''}{diff.toFixed(1)} from last
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSave}
          className={`mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-white transition ${
            saved ? 'bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          <Save size={18} />
          {saved ? 'Saved!' : 'Save Measurements'}
        </button>
      </div>

      {/* History table */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5 overflow-x-auto">
          <h3 className="font-semibold text-gray-800 mb-3">Measurement History</h3>
          <table className="min-w-full text-xs">
            <thead>
              <tr className="text-gray-400 border-b">
                <th className="text-left pb-2 pr-3">Date</th>
                <th className="text-right pb-2 px-2">Waist</th>
                <th className="text-right pb-2 px-2">Hips</th>
                <th className="text-right pb-2 px-2">Thigh L</th>
                <th className="text-right pb-2 px-2">Thigh R</th>
                <th className="text-right pb-2 px-2">Chest</th>
                <th className="text-right pb-2 px-2">BF%</th>
              </tr>
            </thead>
            <tbody>
              {history.map(m => (
                <tr
                  key={m.date}
                  className={`border-b last:border-0 ${m.date === date ? 'bg-indigo-50' : ''}`}
                >
                  <td className="py-2 pr-3 font-medium text-gray-700">{m.date}</td>
                  {(['waist', 'hips', 'thighLeft', 'thighRight', 'chest', 'bodyFat'] as FieldKey[]).map(k => (
                    <td key={k} className="text-right py-2 px-2 text-gray-600">
                      {m[k] != null ? String(m[k]) : '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
