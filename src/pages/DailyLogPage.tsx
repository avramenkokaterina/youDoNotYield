import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Save, ChevronLeft, ChevronRight } from 'lucide-react';
import type { DailyLog } from '../types';
import { getLogByDate, saveLog } from '../utils/storage';

const today = () => format(new Date(), 'yyyy-MM-dd');

function emptyLog(date: string): DailyLog {
  return {
    date,
    hadTraining: false,
    notes: {
      alcohol: false,
      tiredness: 3,
      hunger: 3,
      badSleep: false,
      stress: 3,
      bloating: false,
      custom: '',
    },
  };
}

export default function DailyLogPage() {
  const [date, setDate] = useState(today());
  const [log, setLog] = useState<DailyLog>(emptyLog(date));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const existing = getLogByDate(date);
    setLog(existing ?? emptyLog(date));
    setSaved(false);
  }, [date]);

  function changeDate(delta: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(format(d, 'yyyy-MM-dd'));
  }

  function update<K extends keyof DailyLog>(key: K, value: DailyLog[K]) {
    setLog(prev => ({ ...prev, [key]: value }));
  }

  function updateNote<K extends keyof DailyLog['notes']>(key: K, value: DailyLog['notes'][K]) {
    setLog(prev => ({ ...prev, notes: { ...prev.notes, [key]: value } }));
  }

  function handleSave() {
    saveLog(log);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const SliderField = ({
    label, value, onChange, emoji,
  }: { label: string; value: number; onChange: (v: number) => void; emoji: string }) => (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{emoji} {label}</span>
        <span className="text-sm font-bold text-indigo-600">{value}/5</span>
      </div>
      <input
        type="range" min={1} max={5} step={1} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-indigo-500"
      />
      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
        <span>Low</span><span>High</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Date nav */}
      <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm p-4">
        <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <input
            type="date" value={date} onChange={e => setDate(e.target.value)}
            className="text-lg font-semibold text-gray-800 border-none outline-none text-center cursor-pointer"
          />
          {date === today() && (
            <p className="text-xs text-indigo-500 font-medium mt-0.5">Today</p>
          )}
        </div>
        <button
          onClick={() => changeDate(1)}
          disabled={date >= today()}
          className="p-2 hover:bg-gray-100 rounded-full transition disabled:opacity-30"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Core metrics */}
      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-gray-800 text-base">Core Metrics</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">⚖️ Weight (kg)</label>
            <input
              type="number" step="0.1" placeholder="e.g. 68.5"
              value={log.weight ?? ''}
              onChange={e => update('weight', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">🍽️ Calories</label>
            <input
              type="number" step="10" placeholder="e.g. 1600"
              value={log.calories ?? ''}
              onChange={e => update('calories', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">🌸 Cycle Day</label>
          <div className="flex gap-2 items-center">
            <input
              type="number" min={1} max={35} placeholder="1–35"
              value={log.periodDay ?? ''}
              onChange={e => update('periodDay', e.target.value ? Number(e.target.value) : undefined)}
              className="w-28 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <span className="text-xs text-gray-400">Leave blank if not tracking</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => update('hadTraining', !log.hadTraining)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              log.hadTraining
                ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-400'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            🏋️ Training
            <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
              log.hadTraining ? 'bg-emerald-500 border-emerald-500' : 'border-gray-400'
            }`}>
              {log.hadTraining && <span className="text-white text-xs">✓</span>}
            </span>
          </button>
          <span className="text-xs text-gray-400">
            {log.hadTraining ? 'Logged — great job! 💪' : 'No training today'}
          </span>
        </div>
      </div>

      {/* Wellbeing */}
      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-gray-800 text-base">Wellbeing</h2>

        <SliderField label="Tiredness" value={log.notes.tiredness} onChange={v => updateNote('tiredness', v)} emoji="😴" />
        <SliderField label="Hunger" value={log.notes.hunger} onChange={v => updateNote('hunger', v)} emoji="🍴" />
        <SliderField label="Stress" value={log.notes.stress} onChange={v => updateNote('stress', v)} emoji="😰" />

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">💤 Sleep Hours</label>
          <input
            type="number" step="0.5" min={0} max={24} placeholder="e.g. 7.5"
            value={log.notes.sleepHours ?? ''}
            onChange={e => updateNote('sleepHours', e.target.value ? Number(e.target.value) : undefined)}
            className="w-28 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {([
            { key: 'badSleep', label: '😵 Bad Sleep', value: log.notes.badSleep },
            { key: 'alcohol', label: '🍷 Alcohol', value: log.notes.alcohol },
            { key: 'bloating', label: '🎈 Bloating', value: log.notes.bloating },
          ] as const).map(({ key, label, value }) => (
            <button
              key={key}
              onClick={() => updateNote(key, !value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                value ? 'bg-rose-100 text-rose-600 ring-1 ring-rose-400' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {log.notes.alcohol && (
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Alcohol Units</label>
            <input
              type="number" step="0.5" min={0} placeholder="e.g. 2"
              value={log.notes.alcoholUnits ?? ''}
              onChange={e => updateNote('alcoholUnits', e.target.value ? Number(e.target.value) : undefined)}
              className="w-28 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">📝 Notes</label>
          <textarea
            rows={3} placeholder="Anything else to note today…"
            value={log.notes.custom}
            onChange={e => updateNote('custom', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-white transition ${
          saved ? 'bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        <Save size={18} />
        {saved ? 'Saved!' : 'Save Log'}
      </button>
    </div>
  );
}
