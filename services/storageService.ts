
import { BaseRecord, RecordType } from '../types';

const STORAGE_KEY = 'billingSystemData';

export const loadAllData = (): BaseRecord[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveData = (data: BaseRecord[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const generateId = () => {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
};

export const filterByType = <T extends BaseRecord>(data: BaseRecord[], type: RecordType): T[] => {
  return data.filter(item => item.type === type) as T[];
};
