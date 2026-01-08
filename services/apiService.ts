
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

const API_URL = getApiUrl();
const API_TOKEN = getApiToken();

const buildRecordsUrl = (businessId?: string, since?: number | null): string => {
  if (!API_URL) return '';
  const trimmed = API_URL.replace(/\/$/, '');
  const base = trimmed.includes('/records') ? trimmed : `${trimmed}/records`;
  const url = new URL(base);
  if (businessId) {
    url.searchParams.set('businessId', businessId);
  }
  if (since && Number.isFinite(since)) {
    url.searchParams.set('since', String(since));
  }
  return url.toString();
};

const parseServerTime = (response: Response): number | null => {
  const dateHeader = response.headers.get('Date');
  if (!dateHeader) return null;
  const parsed = Date.parse(dateHeader);
  return Number.isNaN(parsed) ? null : parsed;
};

const buildHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json;charset=utf-8',
  };
  if (API_TOKEN) {
    headers['X-Api-Token'] = API_TOKEN;
  }
};

const SUPABASE_URL = getApiUrl();
const SUPABASE_KEY = getSupabaseKey();
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

export interface FetchRecordsResponse {
  success: boolean;
  records: BaseRecord[];
  serverTime: number | null;
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

  async fetchLatestRecords(params?: { businessId?: string; since?: number | null }): Promise<FetchRecordsResponse> {
    if (!API_URL) return { success: false, records: [], serverTime: null };

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?select=payload,*&order=timestamp.asc`,
        { method: 'GET', headers: createHeaders() }
      );
      if (!response.ok) return [];
      const result = await response.json();
      const records = Array.isArray(result) ? result : [];
      return { success: true, records, serverTime: parseServerTime(response) };
    } catch (error) {
      console.error('Fetch Records Error:', error);
      return { success: false, records: [], serverTime: null };
    }
  }
};
