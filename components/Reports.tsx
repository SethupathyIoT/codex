
import React from 'react';
import { Bill } from '../types';
import { APP_CONFIG } from '../constants';

interface ReportsProps {
  bills: Bill[];
}

const Reports: React.FC<ReportsProps> = ({ bills }) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthBills = bills.filter(b => b.date.startsWith(currentMonth));
  const monthRevenue = monthBills.reduce((s, b) => s + b.total, 0);
  const totalPaid = bills.reduce((s, b) => s + b.paidAmount, 0);
  const totalOutstanding = bills.reduce((s, b) => s + (b.total - b.paidAmount), 0);

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-blue-600 uppercase tracking-tighter font-black">Monthly Reports</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-slate-950 text-white rounded-2xl shadow-lg">
          <div className="opacity-80 text-xs font-black uppercase tracking-widest">This Month Revenue</div>
          <div className="text-4xl font-black mt-2 tracking-tighter">{APP_CONFIG.currency_symbol}{monthRevenue.toFixed(2)}</div>
        </div>
        <div className="p-6 bg-emerald-600 text-white rounded-2xl shadow-lg">
          <div className="opacity-80 text-xs font-black uppercase tracking-widest">Total Collected</div>
          <div className="text-4xl font-black mt-2 tracking-tighter">{APP_CONFIG.currency_symbol}{totalPaid.toFixed(2)}</div>
        </div>
        <div className="p-6 bg-rose-600 text-white rounded-2xl shadow-lg">
          <div className="opacity-80 text-xs font-black uppercase tracking-widest">Total Outstanding</div>
          <div className="text-4xl font-black mt-2 tracking-tighter">{APP_CONFIG.currency_symbol}{totalOutstanding.toFixed(2)}</div>
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="font-black text-xl mb-4 uppercase tracking-tight">Detailed Audit Trail</h3>
        <div className="space-y-3">
          {bills.map(b => (
            <div key={b.__backendId} className="p-5 bg-slate-50 rounded-xl flex justify-between items-center border-2 border-slate-100 hover:border-slate-300 transition-all">
              <div>
                <div className="font-black text-slate-950 text-lg uppercase tracking-tight">Bill #{b.billNumber} | {new Date(b.date).toLocaleDateString()}</div>
                <div className="text-sm font-bold text-slate-500 uppercase">{b.companyName} &bull; {b.employeeName}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black tracking-tighter text-slate-950">{APP_CONFIG.currency_symbol}{b.total.toFixed(2)}</div>
                <div className={`text-[10px] font-black uppercase tracking-widest mt-1 ${b.isPaid ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {b.isPaid ? 'Settled Full' : `Balance: ${APP_CONFIG.currency_symbol}${(b.total - b.paidAmount).toFixed(2)}`}
                </div>
              </div>
            </div>
          ))}
          {bills.length === 0 && <div className="text-center py-20 text-slate-400 font-black text-xl uppercase tracking-tighter border-4 border-dashed border-slate-100 rounded-3xl">No records found.</div>}
        </div>
      </div>
    </div>
  );
};

export default Reports;
