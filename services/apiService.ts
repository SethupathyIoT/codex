
import { BaseRecord } from '../types';

// Safely access environment variables across different environments
const getApiUrl = (): string => {
  try {
    // Check various common ways environment variables are injected
    const env = (globalThis as any).process?.env || (import.meta as any).env || {};
    return env.VITE_SUPABASE_URL || '';
  } catch (e) {
    return '';
  }
};

const getApiToken = (): string => {
  try {
    const env = (globalThis as any).process?.env || (import.meta as any).env || {};
    return env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_KEY || env.VITE_API_TOKEN || '';
  } catch (e) {
    return '';
  }
};

const getSupabaseTable = (): string => {
  try {
    const env = (globalThis as any).process?.env || (import.meta as any).env || {};
    return env.VITE_SUPABASE_TABLE || 'records';
  } catch (e) {
    return 'records';
  }
};

const SUPABASE_URL = getApiUrl();
const SUPABASE_KEY = getApiToken();
const SUPABASE_TABLE = getSupabaseTable();

const createHeaders = () => ({
  'Content-Type': 'application/json;charset=utf-8',
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
});

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const cloudApi = {
  async saveRecord(record: BaseRecord): Promise<ApiResponse> {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.warn('Supabase not configured. Record will remain in local queue.');
      return { success: false, message: 'Supabase not configured' };
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          ...createHeaders(),
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          __backendId: record.__backendId,
          type: record.type,
          timestamp: record.timestamp,
          businessId: record.businessId ?? null,
          payload: record,
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result = await response.json().catch(() => ({}));
      return { 
        success: result.success || true, 
        message: result.message || 'Saved to Supabase successfully' 
      };
    } catch (error) {
      console.error('Cloud Sync Error:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Network connection failed' 
      };
    }
  },

  async fetchLatestRecords(): Promise<BaseRecord[]> {
    if (!SUPABASE_URL || !SUPABASE_KEY) return [];

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?select=payload,*&order=timestamp.asc`,
        { method: 'GET', headers: createHeaders() }
      );
      if (!response.ok) return [];
      const result = await response.json();
      if (!Array.isArray(result)) return [];
      return result
        .map((row: BaseRecord & { payload?: BaseRecord }) => row.payload ?? row)
        .filter((row): row is BaseRecord => Boolean(row));
    } catch (error) {
      console.error('Fetch Records Error:', error);
      return [];
    }
  }
};
