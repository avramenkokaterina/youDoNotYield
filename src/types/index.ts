export interface DailyLog {
  date: string; // YYYY-MM-DD
  weight?: number; // kg
  periodDay?: number; // 1-35, undefined if not applicable
  calories?: number;
  hadTraining: boolean;
  notes: {
    alcohol: boolean;
    alcoholUnits?: number;
    tiredness: number; // 1-5
    hunger: number; // 1-5
    badSleep: boolean;
    sleepHours?: number;
    stress: number; // 1-5
    bloating: boolean;
    custom: string;
  };
}

export interface Measurement {
  date: string; // YYYY-MM-DD
  waist?: number; // cm
  hips?: number; // cm
  thighLeft?: number; // cm
  thighRight?: number; // cm
  chest?: number; // cm
  upperArmLeft?: number; // cm
  upperArmRight?: number; // cm
  bodyFat?: number; // %
}

export type TabId = 'log' | 'measurements' | 'history' | 'dashboard';
