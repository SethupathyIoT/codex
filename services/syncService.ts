
import { BaseRecord } from '../types';
import { cloudApi } from './apiService';

const QUEUE_KEY = 'sync_queue';
const LAST_SYNC_KEY = 'sync_last_ts';

export const syncService = {
  getQueue(): BaseRecord[] {
    const stored = localStorage.getItem(QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  addToQueue(record: BaseRecord) {
    const queue = this.getQueue();
    queue.push(record);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },

  getLastSyncAt(): number | null {
    const stored = localStorage.getItem(LAST_SYNC_KEY);
    if (!stored) return null;
    const numeric = Number(stored);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
  },

  setLastSyncAt(timestamp: number) {
    if (!Number.isFinite(timestamp) || timestamp <= 0) return;
    localStorage.setItem(LAST_SYNC_KEY, String(Math.floor(timestamp)));
  },

  getNextSyncTimestamp(records: BaseRecord[], serverTime?: number | null): number {
    const maxRecordTimestamp = records.reduce((max, record) => {
      return record.timestamp > max ? record.timestamp : max;
    }, 0);
    const candidate = Math.max(serverTime || 0, maxRecordTimestamp || 0);
    return candidate > 0 ? candidate : Date.now();
  },

  async processQueue(): Promise<boolean> {
    const queue = this.getQueue();
    if (queue.length === 0) return true;

    let success = true;
    const remaining = [...queue];

    for (const record of queue) {
      const result = await cloudApi.saveRecord(record);
      if (result.success) {
        remaining.shift();
      } else {
        success = false;
        break; // Stop processing queue on first failure (network issues)
      }
    }

    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    return success;
  },

  /**
   * Reconciles local data with cloud data.
   * Prioritizes cloud versions and specifically for bills, takes the latest version per billNumber.
   */
  reconcile(localData: BaseRecord[], cloudData: BaseRecord[]): BaseRecord[] {
    const merged = new Map<string, BaseRecord>();

    // Add local records first
    localData.forEach(r => merged.set(r.__backendId, r));

    // Overwrite with cloud records (source of truth)
    cloudData.forEach(r => {
      // For bills, we might have multiple rows for the same Bill ID in append-only.
      // We look for the latest timestamp.
      const existing = merged.get(r.__backendId);
      if (!existing || r.timestamp > existing.timestamp) {
        merged.set(r.__backendId, { ...r, syncStatus: 'synced' } as any);
      }
    });

    return Array.from(merged.values());
  }
};
