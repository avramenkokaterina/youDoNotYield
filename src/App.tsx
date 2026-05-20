import { useState } from 'react';
import { ClipboardList, BarChart2, History, Ruler } from 'lucide-react';
import DailyLogPage from './pages/DailyLogPage';
import MeasurementsPage from './pages/MeasurementsPage';
import HistoryPage from './pages/HistoryPage';
import DashboardPage from './pages/DashboardPage';
import type { TabId } from './types';

const TABS: { id: TabId; label: string; Icon: React.ElementType }[] = [
  { id: 'log', label: 'Log', Icon: ClipboardList },
  { id: 'measurements', label: 'Measure', Icon: Ruler },
  { id: 'history', label: 'History', Icon: History },
  { id: 'dashboard', label: 'Dashboard', Icon: BarChart2 },
];

export default function App() {
  const [tab, setTab] = useState<TabId>('log');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
          <span className="text-xl">🔥</span>
          <div>
            <h1 className="font-bold text-gray-900 leading-tight text-base">Fat Loss Tracker</h1>
            <p className="text-xs text-gray-400">you do not yield</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-5">
        {tab === 'log' && <DailyLogPage />}
        {tab === 'measurements' && <MeasurementsPage />}
        {tab === 'history' && <HistoryPage />}
        {tab === 'dashboard' && <DashboardPage />}
      </main>

      <nav className="bg-white border-t border-gray-100 sticky bottom-0 z-10">
        <div className="max-w-2xl mx-auto flex">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition ${
                tab === id ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={20} strokeWidth={tab === id ? 2.5 : 1.8} />
              {label}
              {tab === id && <span className="w-1 h-1 bg-indigo-500 rounded-full" />}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
