
import React from 'react';
import { Bill, Page } from '../types';
import { APP_CONFIG } from '../constants';

interface DashboardProps {
  bills: Bill[];
  onNavigate: (page: Page) => void;
  onViewBill: (bill: Bill) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ bills, onNavigate, onViewBill }) => {
  const formatCurrency = (amount: number) => `${APP_CONFIG.currency_symbol}${amount.toFixed(2)}`;

  const today = new Date().toDateString();
  const todayBills = bills.filter(b => new Date(b.date).toDateString() === today);
  const todayRevenue = todayBills.reduce((sum, b) => sum + b.total, 0);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthBills = bills.filter(b => b.date.startsWith(currentMonth));
  const monthRevenue = monthBills.reduce((sum, b) => sum + b.total, 0);

  const totalRevenue = bills.reduce((sum, b) => sum + b.total, 0);

  const navItems = [
    { id: 'newbill', label: 'NEW BILL', icon: '📝', desc: 'Add Entry' },
    { id: 'companies', label: 'COMPANIES', icon: '🏢', desc: 'Accounts' },
    { id: 'manage', label: 'STAFF', icon: '👥', desc: 'Directory' },
    { id: 'foodmenu', label: 'MENU', icon: '🍽️', desc: 'Catalog' },
    { id: 'reports', label: 'FINANCE', icon: '📊', desc: 'Analysis' },
    { id: 'settings', label: 'CONFIG', icon: '⚙️', desc: 'Profile' },
  ];

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard label="Today's Sales" value={formatCurrency(todayRevenue)} subValue={`${todayBills.length} Invoices`} icon="💰" color="bg-indigo-700 text-white" />
        <StatCard label="Monthly Revenue" value={formatCurrency(monthRevenue)} subValue={`${monthBills.length} Records`} icon="📈" color="bg-emerald-700 text-white" />
        <StatCard label="Grand Total" value={formatCurrency(totalRevenue)} subValue={`${bills.length} Total Entries`} icon="💎" color="bg-amber-600 text-white" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id as Page)}
            className="bg-white border-4 border-slate-200 rounded-[2.5rem] p-8 hover:border-indigo-700 hover:shadow-2xl transition-all group text-center flex flex-col items-center active:scale-95 shadow-lg"
          >
            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300 drop-shadow-md">{item.icon}</div>
            <div className="font-black text-slate-950 text-base tracking-tight leading-none">{item.label}</div>
            <div className="text-[10px] text-slate-600 font-black uppercase mt-3 tracking-[0.15em] opacity-80">{item.desc}</div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[3rem] border-4 border-slate-200 shadow-2xl overflow-hidden">
        <div className="px-10 py-10 border-b-4 border-slate-100 flex justify-between items-center bg-white">
          <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tight">Recent Activity</h2>
          <button 
            onClick={() => onNavigate('reports')} 
            className="text-indigo-800 text-sm font-black hover:bg-indigo-50 transition-colors uppercase tracking-[0.2em] bg-white px-6 py-3 rounded-2xl border-2 border-indigo-700 shadow-sm flex items-center gap-3"
          >
            Full Ledger &rarr;
          </button>
        </div>
        <div className="p-10">
          <div className="space-y-6">
            {bills.length > 0 ? [...bills].reverse().slice(0, 8).map(bill => (
              <div key={bill.__backendId} className="flex flex-col md:flex-row md:items-center justify-between p-8 bg-slate-50 border-2 border-slate-200 rounded-[2rem] hover:bg-white hover:border-indigo-600 transition-all gap-8 shadow-sm group">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <span className="font-black text-slate-950 text-2xl tracking-tighter">#{bill.billNumber}</span>
                    <span className="text-[10px] px-4 py-1.5 bg-slate-950 text-white rounded-xl font-black uppercase tracking-widest leading-none">{bill.companyName}</span>
                    {bill.syncStatus === 'pending' && (
                      <span className="text-[8px] bg-amber-100 text-amber-700 px-2 py-1 rounded font-black uppercase tracking-widest animate-pulse border border-amber-200">Pending Sync</span>
                    )}
                  </div>
                  <div className="text-xl text-slate-800 mt-2 font-bold tracking-tight">{bill.employeeName}</div>
                  <div className="text-sm text-slate-600 font-black mt-1 uppercase tracking-widest">{new Date(bill.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                </div>
                <div className="flex items-center gap-10">
                  <div className="text-left md:text-right min-w-[160px]">
                    <div className="font-black text-4xl text-slate-950 tracking-tighter">{formatCurrency(bill.total)}</div>
                    <div className={`text-xs font-black uppercase tracking-[0.15em] mt-2 inline-flex items-center gap-2 border-2 px-3 py-1 rounded-full ${bill.isPaid ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-orange-100 text-orange-800 border-orange-200'}`}>
                      <span className={`w-2 h-2 rounded-full ${bill.isPaid ? 'bg-emerald-600' : 'bg-orange-600 animate-pulse'}`}></span>
                      {bill.isPaid ? 'PAID' : `DUE: ${formatCurrency(bill.total - bill.paidAmount)}`}
                    </div>
                  </div>
                  <button 
                    onClick={() => onViewBill(bill)}
                    className="w-16 h-16 bg-white border-4 border-slate-300 rounded-3xl text-slate-950 hover:text-white hover:bg-indigo-700 hover:border-indigo-700 transition-all flex items-center justify-center shadow-md active:scale-90 group-hover:border-indigo-600"
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  </button>
                </div>
              </div>
            )) : (
              <div className="text-center py-24 bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-300">
                <div className="text-8xl mb-8 opacity-40">📝</div>
                <p className="text-slate-700 font-black text-2xl uppercase tracking-tighter">Zero Transactions recorded yet.</p>
                <p className="text-slate-500 font-bold mt-2 text-lg">Click "New Invoice" to start billing.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, subValue, icon, color }: any) => (
  <div className="bg-white rounded-[3rem] border-4 border-slate-200 p-10 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 group">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-slate-600 text-sm font-black uppercase tracking-[0.2em] mb-3">{label}</p>
        <p className="text-5xl font-black text-slate-950 tracking-tighter mb-2">{value}</p>
        <div className="text-[11px] text-slate-700 font-black uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-slate-300"></span>
          {subValue}
        </div>
      </div>
      <div className={`${color} w-24 h-24 rounded-[2rem] flex items-center justify-center text-5xl shadow-2xl border-4 border-white transition-transform group-hover:rotate-6`}>{icon}</div>
    </div>
  </div>
);

export default Dashboard;
