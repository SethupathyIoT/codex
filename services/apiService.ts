
import { BaseRecord } from '../types';

// Safely access environment variables across different environments
const getApiUrl = (): string => {
  try {
    // Check various common ways environment variables are injected
    const env = (globalThis as any).process?.env || (import.meta as any).env || {};
    return env.VITE_API_URL || '';
  } catch (e) {
    return '';
  }
};

const getApiToken = (): string => {
  try {
    const env = (globalThis as any).process?.env || (import.meta as any).env || {};
    return env.VITE_API_TOKEN || '';
  } catch (e) {
    return '';
  }
};

const API_URL = getApiUrl();
const API_TOKEN = getApiToken();

const buildHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json;charset=utf-8',
  };
  if (API_TOKEN) {
    headers['X-Api-Token'] = API_TOKEN;
  }
  return headers;
};

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const cloudApi = {
  async saveRecord(record: BaseRecord): Promise<ApiResponse> {
    if (!API_URL) {
      console.warn('Cloud API URL not configured. Record will remain in local queue.');
      return { success: false, message: 'Cloud API URL not configured' };
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        mode: 'cors',
        headers: buildHeaders(),
        body: JSON.stringify(record),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result = await response.json();
      return { 
        success: result.success || true, 
        message: result.message || 'Saved to cloud successfully' 
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
    if (!API_URL) return [];

    try {
      const response = await fetch(API_URL, { method: 'GET', headers: buildHeaders() });
      if (!response.ok) return [];
      const result = await response.json();
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Fetch Records Error:', error);
      return [];
    }
  }
};
