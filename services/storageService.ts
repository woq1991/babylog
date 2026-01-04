import { FeedingRecord } from '../types';

const STORAGE_KEY = 'baby_feeding_records_v1';

export const getStoredRecords = (): FeedingRecord[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load records", e);
    return [];
  }
};

export const saveRecord = (record: FeedingRecord): FeedingRecord[] => {
  const records = getStoredRecords();
  const updated = [record, ...records];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteRecord = (id: string): FeedingRecord[] => {
  const records = getStoredRecords();
  const updated = records.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

// Helper to group records by date string (YYYY-MM-DD)
export const groupRecordsByDate = (records: FeedingRecord[]): Record<string, FeedingRecord[]> => {
  const groups: Record<string, FeedingRecord[]> = {};
  records.forEach(r => {
    const dateKey = new Date(r.timestamp).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).replace(/\//g, '-');
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(r);
  });
  return groups;
};
