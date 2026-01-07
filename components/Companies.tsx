
import React, { useState } from 'react';
import { Company, Employee, Bill } from '../types';
import { APP_CONFIG } from '../constants';

interface CompaniesProps {
  companies: Company[];
  employees: Employee[];
  bills: Bill[];
  onViewEmployee: (employeeId: string) => void;
  onViewMonthlyStatement: (company: Company) => void;
}

const Companies: React.FC<CompaniesProps> = ({ companies, employees, bills, onViewEmployee, onViewMonthlyStatement }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatCurrency = (amount: number) => `${APP_CONFIG.currency_symbol}${amount.toFixed(2)}`;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tight">Company Accounts</h2>
      </div>
      
      <div className="space-y-4">
        {companies.length > 0 ? companies.map(company => {
          const companyEmployees = employees.filter(e => e.companyId === company.__backendId);
          const companyBills = bills.filter(b => b.companyId === company.__backendId);
          const totalAmount = companyBills.reduce((sum, b) => sum + b.total, 0);
          const paidAmount = companyBills.reduce((sum, b) => sum + b.paidAmount, 0);
          const pending = totalAmount - paidAmount;
          const isExpanded = expandedId === company.__backendId;

          return (
            <div key={company.__backendId} className="border-4 border-slate-100 rounded-[2rem] overflow-hidden transition-all duration-300">
              <div 
                className={`p-8 cursor-pointer transition-colors ${isExpanded ? 'bg-slate-50' : 'bg-white hover:bg-slate-50'}`}
                onClick={() => setExpandedId(isExpanded ? null : company.__backendId)}
              >
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">{company.name}</h3>
                      <span className="text-[10px] font-black uppercase tracking-widest bg-slate-950 text-white px-3 py-1 rounded-full">{companyEmployees.length} STAFF</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-xs text-slate-500 font-bold uppercase tracking-wider">
                      <div>Contact: {company.contactPerson || 'N/A'}</div>
                      <div>Phone: {company.phone || 'N/A'}</div>
                      <div className="col-span-2 text-indigo-600 font-black mt-2">Total Bills: {companyBills.length} Invoices</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className="text-left md:text-right min-w-[150px]">
                      <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Total Outstanding</div>
                      <div className="text-3xl font-black text-slate-950 tracking-tighter">{formatCurrency(totalAmount)}</div>
                      <div className={`text-[10px] font-black mt-2 uppercase tracking-widest px-3 py-1 rounded-full border-2 inline-block ${pending > 0 ? 'border-rose-200 text-rose-600 bg-rose-50' : 'border-emerald-200 text-emerald-600 bg-emerald-50'}`}>
                        {pending > 0 ? `DUE: ${formatCurrency(pending)}` : '✓ SETTLED'}
                      </div>
                    </div>
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); onViewMonthlyStatement(company); }}
                      className="px-6 py-4 bg-indigo-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.15em] hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center gap-2"
                    >
                      <span>📊</span> Monthly Statement
                    </button>
                  </div>
                </div>
              </div>
              
              {isExpanded && (
                <div className="p-8 bg-white border-t-4 border-slate-50 animate-in slide-in-from-top-2 duration-300">
                  <h4 className="font-black text-slate-900 text-sm uppercase tracking-widest mb-6 flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    Detailed Staff Ledger
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {companyEmployees.map(emp => {
                      const empBills = bills.filter(b => b.employeeId === emp.__backendId);
                      const empTotal = empBills.reduce((sum, b) => sum + b.total, 0);
                      const empPaid = empBills.reduce((sum, b) => sum + b.paidAmount, 0);
                      const empPending = empTotal - empPaid;
                      
                      return (
                        <div 
                          key={emp.__backendId}
                          onClick={() => onViewEmployee(emp.__backendId)}
                          className="flex justify-between items-center p-6 rounded-2xl bg-slate-50 border-2 border-slate-100 hover:border-indigo-300 hover:bg-white cursor-pointer group transition-all"
                        >
                          <div>
                            <div className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{emp.name}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{emp.phone || 'No contact'}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-black text-slate-950">{formatCurrency(empTotal)}</div>
                            <div className={`text-[10px] font-black uppercase mt-1 ${empPending > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                              {empPending > 0 ? `Pending: ${formatCurrency(empPending)}` : 'SETTLED'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {companyEmployees.length === 0 && <div className="col-span-full text-center py-10 text-slate-400 font-bold uppercase tracking-widest italic border-4 border-dashed border-slate-50 rounded-2xl">No staff associated with this company</div>}
                  </div>
                </div>
              )}
            </div>
          );
        }) : (
          <div className="text-center py-24 bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200 text-slate-400">
            <div className="text-8xl mb-6 opacity-30">🏢</div>
            <div className="text-xl font-black uppercase tracking-widest">No company database found</div>
            <p className="mt-2 text-sm font-bold opacity-60">Go to Manage section to register your first client company.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Companies;
