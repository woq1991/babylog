export type FeedingType = 'breast_milk' | 'formula';

export interface FeedingRecord {
  id: string;
  type: FeedingType;
  amount: number; // in mL
  timestamp: number; // Date.getTime()
  note?: string;
}

export interface DailySummary {
  date: string; // YYYY-MM-DD
  totalBreastMilk: number;
  totalFormula: number;
  countBreastMilk: number;
  countFormula: number;
  records: FeedingRecord[];
}

export interface AnalysisResult {
  summary: string;
  advice: string;
}
