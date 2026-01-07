
import React, { useState } from 'react';
import { Settings as SettingsType } from '../types';

interface SettingsProps {
  settings: SettingsType;
  onUpdateSettings: (e: React.FormEvent<HTMLFormElement>) => void;
  onSeedData: () => void;
  onManualSync: () => Promise<boolean>;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdateSettings, onSeedData, onManualSync }) => {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<'success' | 'fail' | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    const success = await onManualSync();
    setSyncing(false);
    setSyncResult(success ? 'success' : 'fail');
    setTimeout(() => setSyncResult(null), 3000);
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-4xl mx-auto space-y-10">
      <div className="flex justify-between items-center mb-8 pb-6 border-b-2 border-slate-100">
        <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tighter">Business Settings</h2>
        <div className="flex gap-4">
          <button 
            onClick={handleSync}
            disabled={syncing}
            className={`px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs border-4 transition-all active:scale-95 flex items-center gap-3 ${syncing ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-white border-indigo-700 text-indigo-800 hover:bg-indigo-50 shadow-lg shadow-indigo-100'}`}
          >
            {syncing ? 'Syncing...' : syncResult === 'success' ? '✓ Synced' : syncResult === 'fail' ? '⚠ Failed' : '☁ Sync Now'}
          </button>
          <button 
            onClick={onSeedData}
            className="px-6 py-3 bg-amber-100 text-amber-700 font-black rounded-xl hover:bg-amber-200 transition-colors text-xs uppercase tracking-widest border-2 border-amber-200"
          >
            Seed Sample Data
          </button>
        </div>
      </div>

      <form onSubmit={onUpdateSettings} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Business Name</label>
            <input name="bizName" defaultValue={settings.businessName} className="w-full px-4 py-3 rounded-lg border-2 border-gray-100 outline-none focus:border-blue-500 font-bold" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tagline</label>
            <input name="tagline" defaultValue={settings.businessTagline} className="w-full px-4 py-3 rounded-lg border-2 border-gray-100 outline-none focus:border-blue-500 font-bold" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</label>
            <input name="phone" defaultValue={settings.businessPhone} className="w-full px-4 py-3 rounded-lg border-2 border-gray-100 outline-none focus:border-blue-500 font-bold" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Printer Type</label>
            <select name="printerType" defaultValue={settings.printerType} className="w-full px-4 py-3 rounded-lg border-2 border-gray-100 outline-none focus:border-blue-500 font-bold">
              <option value="80mm">Thermal (80mm)</option>
              <option value="A4">Standard (A4 PDF)</option>
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thank You Message</label>
          <input name="thanks" defaultValue={settings.thankYouMessage} className="w-full px-4 py-3 rounded-lg border-2 border-gray-100 outline-none focus:border-blue-500 font-bold" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Footer Note</label>
          <input name="footer" defaultValue={settings.footerNote} className="w-full px-4 py-3 rounded-lg border-2 border-gray-100 outline-none focus:border-blue-500 font-bold" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Address</label>
          <textarea name="address" defaultValue={settings.businessAddress} className="w-full px-4 py-3 rounded-lg border-2 border-gray-100 outline-none focus:border-blue-500 h-24 font-bold" />
        </div>
        <button type="submit" className="w-full py-5 bg-slate-950 text-white font-black rounded-2xl shadow-2xl hover:bg-black transition-all uppercase tracking-[0.2em] text-sm">Save Global Settings</button>
      </form>
    </div>
  );
};

export default Settings;
