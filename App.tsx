
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Page, Company, Employee, FoodItem, Bill, Payment, Settings as SettingsType, BaseRecord } from './types.ts';
import { loadAllData, saveData, generateId, filterByType } from './services/storageService.ts';
import { DEFAULT_SETTINGS, APP_CONFIG } from './constants.ts';
import { SAMPLE_DATA } from './services/sampleData.ts';
import { cloudApi } from './services/apiService.ts';
import { syncService } from './services/syncService.ts';
import Dashboard from './components/Dashboard.tsx';
import NewBill from './components/NewBill.tsx';
import Companies from './components/Companies.tsx';
import Manage from './components/Manage.tsx';
import FoodMenu from './components/FoodMenu.tsx';
import Reports from './components/Reports.tsx';
import Settings from './components/Settings.tsx';
import Modal from './components/ui/Modal.tsx';
import PrintBill from './components/PrintBill.tsx';

const App: React.FC = () => {
  const [data, setData] = useState<BaseRecord[]>([]);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedCompanyForStatement, setSelectedCompanyForStatement] = useState<Company | null>(null);
  const [viewingBill, setViewingBill] = useState<Bill | null>(null);
  const [billToPrint, setBillToPrint] = useState<Bill | null>(null);
  const [statementMonth, setStatementMonth] = useState(new Date().toISOString().slice(0, 7));
  
  // Ledger States
  const [ledgerTab, setLedgerTab] = useState<'bills' | 'transactions'>('bills');
  const [ledgerFilter, setLedgerFilter] = useState({ from: '', to: '' });
  
  const [paymentTarget, setPaymentTarget] = useState<{ bills: Bill[], total: number } | null>(null);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncPendingCount, setSyncPendingCount] = useState(0);
  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const loadedData = loadAllData();
    setData(loadedData);
    performReconciliation(loadedData);
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));
    syncTimerRef.current = setInterval(triggerBackgroundSync, 180000);
    return () => { if (syncTimerRef.current) clearInterval(syncTimerRef.current); };
  }, []);

  useEffect(() => {
    if (billToPrint) {
      const timer = setTimeout(() => { window.print(); setBillToPrint(null); }, 500);
      return () => clearTimeout(timer);
    }
  }, [billToPrint]);

  const performReconciliation = async (currentData: BaseRecord[]) => {
    try {
      const cloudRecords = await cloudApi.fetchLatestRecords();
      if (cloudRecords.length > 0) {
        const reconciled = syncService.reconcile(currentData, cloudRecords);
        setData(reconciled);
        saveData(reconciled);
      }
    } catch (e) { console.error("Reconciliation failed", e); }
    setSyncPendingCount(syncService.getQueue().length);
  };

  const triggerBackgroundSync = async () => {
    if (navigator.onLine) {
      const success = await syncService.processQueue();
      setSyncPendingCount(syncService.getQueue().length);
    }
  };

  const handleManualSync = async () => {
    await triggerBackgroundSync();
    await performReconciliation(data);
    return syncService.getQueue().length === 0;
  };

  const companies = useMemo(() => filterByType<Company>(data, 'company'), [data]);
  const employees = useMemo(() => filterByType<Employee>(data, 'employee'), [data]);
  const foodItems = useMemo(() => filterByType<FoodItem>(data, 'foodItem'), [data]);
  const bills = useMemo(() => filterByType<Bill>(data, 'bill').sort((a, b) => a.timestamp - b.timestamp), [data]);
  const payments = useMemo(() => filterByType<Payment>(data, 'payment').sort((a, b) => a.timestamp - b.timestamp), [data]);
  
  const settings = useMemo(() => {
    const s = filterByType<SettingsType>(data, 'settings')[0];
    return s || { ...DEFAULT_SETTINGS, __backendId: 'default', type: 'settings', timestamp: 0 } as SettingsType;
  }, [data]);

  const businessId = settings.__backendId || 'default';

  const saveRecord = (record: any) => {
    const newRecord = {
      ...record,
      __backendId: record.__backendId || generateId(),
      businessId: record.businessId || businessId,
      timestamp: Date.now(),
      syncStatus: 'pending'
    } as BaseRecord;
    setData(prev => {
      const updated = [...prev, newRecord];
      saveData(updated);
      return updated;
    });
    syncService.addToQueue(newRecord);
    triggerBackgroundSync();
    return newRecord;
  };

  const updateRecord = (id: string, updates: any) => {
    setData(prev => {
      const updated = prev.map(item => item.__backendId === id ? { ...item, ...updates, businessId: item.businessId || businessId, timestamp: Date.now(), syncStatus: 'pending' } : item);
      saveData(updated);
      const updatedRecord = updated.find(i => i.__backendId === id);
      if (updatedRecord) syncService.addToQueue(updatedRecord);
      return updated;
    });
    triggerBackgroundSync();
  };

  const handleCreateBill = (billData: any, shouldPrint: boolean) => {
    const lastNum = bills.length > 0 ? Math.max(...bills.map(b => b.billNumber || 0)) : 0;
    const nextNum = lastNum + 1;
    const billDisplayId = `${APP_CONFIG.invoice_prefix}-${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`;
    const newBill = saveRecord({ type: 'bill', billId: billDisplayId, billNumber: nextNum, isPaid: false, paidAmount: 0, ...billData }) as Bill;
    if (shouldPrint) setBillToPrint(newBill);
  };

  const handleRecordPayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!paymentTarget || !selectedEmployeeId) return;
    const formData = new FormData(e.currentTarget);
    const employee = employees.find(emp => emp.__backendId === selectedEmployeeId);
    if (!employee) return;

    const paidVal = parseFloat(formData.get('payAmount') as string) || paymentTarget.total;
    saveRecord({
      type: 'payment',
      employeeId: selectedEmployeeId,
      employeeName: employee.name,
      companyId: employee.companyId,
      companyName: employee.companyName,
      paidAmount: paidVal,
      paymentDate: formData.get('payDate') as string,
      paymentTime: formData.get('payTime') as string,
      paymentMethod: formData.get('payMethod') as string,
      paymentBy: formData.get('payBy') as string,
      paymentType: 'staff'
    });

    let remainingPayment = paidVal;
    setData(prev => {
      const updatedData = prev.map(r => {
        if (r.type === 'bill' && r.employeeId === selectedEmployeeId && !r.isPaid && remainingPayment > 0) {
          const b = r as Bill;
          const unpaidForThisBill = b.total - b.paidAmount;
          const amountToApply = Math.min(remainingPayment, unpaidForThisBill);
          const newPaidAmount = b.paidAmount + amountToApply;
          remainingPayment -= amountToApply;
          return { ...b, paidAmount: newPaidAmount, isPaid: newPaidAmount >= b.total, syncStatus: 'pending' };
        }
        return r;
      });
      saveData(updatedData);
      return updatedData;
    });

    setIsPaymentFormOpen(false);
    setPaymentTarget(null);
  };

  const normalizeName = (value: string) => value.trim().toLowerCase();

  const handleAddCompany = (companyData: any) => {
    const companyName = companyData.name?.trim() || '';
    if (companies.some(c => normalizeName(c.name) === normalizeName(companyName))) {
      alert(`Error: A company with name "${companyName}" already exists.`);
      return false;
    }
    saveRecord({ type: 'company', ...companyData, name: companyName });
    return true;
  };

  const handleUpdateCompany = (id: string, updates: any) => {
    const companyName = updates.name?.trim() || '';
    if (companies.some(c => c.__backendId !== id && normalizeName(c.name) === normalizeName(companyName))) {
      alert(`Error: Another company with name "${companyName}" already exists.`);
      return false;
    }
    updateRecord(id, { ...updates, name: companyName });
    return true;
  };

  const handleAddEmployee = (employeeData: any) => {
    const employeeName = employeeData.name?.trim() || '';
    if (employees.some(e => e.companyId === employeeData.companyId && normalizeName(e.name) === normalizeName(employeeName))) {
      alert(`Error: Staff member "${employeeName}" already exists in this company.`);
      return false;
    }
    const company = companies.find(c => c.__backendId === employeeData.companyId);
    saveRecord({ type: 'employee', ...employeeData, name: employeeName, companyName: company?.name || 'Unknown' });
    return true;
  };

  const handleUpdateEmployee = (id: string, updates: any) => {
    const employeeName = updates.name?.trim() || '';
    if (employees.some(e => e.__backendId !== id && e.companyId === updates.companyId && normalizeName(e.name) === normalizeName(employeeName))) {
      alert(`Error: Another staff member named "${employeeName}" already exists in this company.`);
      return false;
    }
    const company = companies.find(c => c.__backendId === updates.companyId);
    updateRecord(id, { ...updates, name: employeeName, companyName: company?.name || 'Unknown' });
    return true;
  };

  const handleAddFoodItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    saveRecord({ type: 'foodItem', itemName: f.get('name'), category: f.get('category'), price: parseFloat(f.get('price') as string), isActive: true });
    e.currentTarget.reset();
  };

  const handleSeedData = () => {
    if (confirm('Load 3-month testing data?')) {
      const seedBusinessId = settings.__backendId || 'default';
      const seededRecords = SAMPLE_DATA.map(item => ({
        ...item,
        businessId: (item as BaseRecord).businessId || seedBusinessId
      }));
      setData(prev => {
        const updated = [...prev, ...seededRecords];
        saveData(updated);
        return updated;
      });
      seededRecords.forEach(item => syncService.addToQueue(item as BaseRecord));
      triggerBackgroundSync();
      alert('Testing data loaded successfully.');
    }
  };

  const selectedEmployeeLedger = useMemo(() => {
    if (!selectedEmployeeId) return null;
    const employee = employees.find(e => e.__backendId === selectedEmployeeId);
    let empBills = bills.filter(b => b.employeeId === selectedEmployeeId);
    let empPayments = payments.filter(p => p.employeeId === selectedEmployeeId);

    // Apply Filters
    if (ledgerFilter.from) {
      empBills = empBills.filter(b => b.date >= ledgerFilter.from);
      empPayments = empPayments.filter(p => p.paymentDate >= ledgerFilter.from);
    }
    if (ledgerFilter.to) {
      empBills = empBills.filter(b => b.date <= ledgerFilter.to);
      empPayments = empPayments.filter(p => p.paymentDate <= ledgerFilter.to);
    }

    const totalBilled = empBills.reduce((s, b) => s + b.total, 0);
    const totalPaid = empPayments.reduce((s, p) => s + p.paidAmount, 0);
    const pending = totalBilled - totalPaid;

    return { 
      employee, 
      bills: empBills, 
      payments: empPayments,
      totalBilled, 
      totalPaid, 
      pending 
    };
  }, [selectedEmployeeId, bills, payments, employees, ledgerFilter]);

  const monthlyStatementData = useMemo(() => {
    if (!selectedCompanyForStatement) return null;
    const [year, month] = statementMonth.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    const dateRange = `01 ${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} to ${lastDay} ${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}`;
    const companyEmployees = employees.filter(e => e.companyId === selectedCompanyForStatement.__backendId);
    const companyBills = bills.filter(b => b.companyId === selectedCompanyForStatement.__backendId && b.date.startsWith(statementMonth));
    const report = companyEmployees.map(emp => ({ name: emp.name, total: companyBills.filter(b => b.employeeId === emp.__backendId).reduce((sum, b) => sum + b.total, 0) }));
    return { report, dateRange, grandTotal: report.reduce((sum, r) => sum + r.total, 0) };
  }, [selectedCompanyForStatement, statementMonth, employees, bills]);

  const setLedgerDateRange = (type: 'today' | 'week' | 'month' | 'lastMonth') => {
    const today = new Date();
    const from = new Date();
    if (type === 'today') {
      const dateStr = today.toISOString().split('T')[0];
      setLedgerFilter({ from: dateStr, to: dateStr });
    } else if (type === 'week') {
      from.setDate(today.getDate() - today.getDay());
      setLedgerFilter({ from: from.toISOString().split('T')[0], to: today.toISOString().split('T')[0] });
    } else if (type === 'month') {
      from.setDate(1);
      setLedgerFilter({ from: from.toISOString().split('T')[0], to: today.toISOString().split('T')[0] });
    } else if (type === 'lastMonth') {
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      setLedgerFilter({ from: lastMonth.toISOString().split('T')[0], to: endOfLastMonth.toISOString().split('T')[0] });
    }
  };

  const handleDownloadExcel = () => {
    if (!selectedEmployeeLedger) return;
    const { bills, payments, employee } = selectedEmployeeLedger;
    let csv = `Employee Ledger: ${employee?.name}\nDate Range: ${ledgerFilter.from || 'Start'} to ${ledgerFilter.to || 'End'}\n\n`;
    csv += "TYPE,ID,DATE,TOTAL,PAID/METHOD,STATUS\n";
    bills.forEach(b => {
      csv += `BILL,${b.billNumber},${b.date},${b.total},${b.paidAmount},${b.isPaid ? 'PAID' : 'DUE'}\n`;
    });
    payments.forEach(p => {
      csv += `PAYMENT,N/A,${p.paymentDate},${p.paidAmount},${p.paymentMethod},N/A\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `ledger_${employee?.name.replace(' ', '_')}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'newbill': return <NewBill companies={companies} employees={employees} foodItems={foodItems} bills={bills} settings={settings} onSave={handleCreateBill} onCancel={() => setCurrentPage('dashboard')} onViewBill={setViewingBill} />;
      case 'companies': return <Companies companies={companies} employees={employees} bills={bills} onViewEmployee={setSelectedEmployeeId} onViewMonthlyStatement={setSelectedCompanyForStatement} />;
      case 'manage': return <Manage companies={companies} employees={employees} onAddCompany={handleAddCompany} onUpdateCompany={handleUpdateCompany} onAddEmployee={handleAddEmployee} onUpdateEmployee={handleUpdateEmployee} />;
      case 'foodmenu': return <FoodMenu foodItems={foodItems} onAddFoodItem={handleAddFoodItem} onDeleteFoodItem={(id) => setData(prev => { const u = prev.filter(r => r.__backendId !== id); saveData(u); return u; })} />;
      case 'reports': return <Reports bills={bills} />;
      case 'settings': return <Settings settings={settings} onUpdateSettings={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); const updated = { ...settings, businessName: f.get('bizName') as string, businessTagline: f.get('tagline') as string, businessAddress: f.get('address') as string, businessPhone: f.get('phone') as string, thankYouMessage: f.get('thanks') as string, footerNote: f.get('footer') as string, printerType: f.get('printerType') as 'A4' | '80mm' } as SettingsType; setData(prev => { const ud = prev.map(r => r.type === 'settings' ? updated : r); if (!prev.find(r => r.type === 'settings')) ud.push(updated); saveData(ud); return ud; }); alert('Settings saved.'); }} onSeedData={handleSeedData} onManualSync={handleManualSync} />;
      default: return <Dashboard bills={bills} onNavigate={setCurrentPage} onViewBill={setViewingBill} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 antialiased font-medium relative">
      <div className="fixed top-6 right-6 z-[100] flex items-center gap-3 bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-full border-2 border-slate-200 shadow-xl pointer-events-none no-print">
        <div className={`w-3.5 h-3.5 rounded-full ${isOnline && syncPendingCount === 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-950">
          {isOnline && syncPendingCount === 0 ? 'Connected' : isOnline ? `${syncPendingCount} Pending` : 'Offline'}
        </span>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-10 no-print">
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b-8 border-slate-950">
          <div>
            <h1 className="text-7xl font-black text-slate-950 tracking-tighter leading-none">{settings.businessName}</h1>
            <p className="text-slate-600 font-bold uppercase tracking-[0.2em] mt-3 bg-slate-100 inline-block px-4 py-1.5 rounded-lg">{settings.businessTagline}</p>
          </div>
          <div className="flex gap-4">
            {currentPage !== 'dashboard' && <button onClick={() => setCurrentPage('dashboard')} className="px-8 py-4 bg-white text-slate-950 rounded-2xl font-black border-4 border-slate-950 shadow-xl active:scale-95 uppercase tracking-widest text-xs">Home</button>}
            <button onClick={() => setCurrentPage('newbill')} className="px-10 py-4 bg-slate-950 text-white rounded-2xl font-black shadow-2xl hover:bg-black transition-all active:scale-95 uppercase tracking-widest text-xs">+ Create Bill</button>
          </div>
        </header>
        <main className="animate-in fade-in duration-500">{renderContent()}</main>
      </div>

      {/* RESTORED: Monthly Statement Modal */}
      <Modal isOpen={!!selectedCompanyForStatement} onClose={() => setSelectedCompanyForStatement(null)} title={`Monthly Expense Statement`} maxWidth="max-w-[800px]">
        {selectedCompanyForStatement && monthlyStatementData && (
          <div className="space-y-8">
            <div className="flex justify-between items-center no-print">
               <div className="flex items-center gap-4">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Select Month:</label>
                 <input type="month" value={statementMonth} onChange={(e) => setStatementMonth(e.target.value)} className="px-4 py-2 border-4 border-slate-100 rounded-xl font-black uppercase text-xs outline-none focus:border-indigo-600" />
               </div>
               <button onClick={() => window.print()} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 flex items-center gap-2">
                 <span>📥</span> Download Statement (PDF)
               </button>
            </div>
            <div className="bg-white p-12 shadow-inner border-2 border-slate-100 rounded-xl printable-statement">
               <div className="text-center mb-10 pb-10 border-b-4 border-slate-950">
                  <h2 className="text-4xl font-black text-slate-950 uppercase tracking-tighter mb-2">{selectedCompanyForStatement.name}</h2>
                  <div className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] mb-6">Staff Expense Statement</div>
                  <div className="flex justify-center gap-10">
                    <div><div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Billing Cycle</div><div className="text-sm font-black text-slate-900">{monthlyStatementData.dateRange}</div></div>
                    <div><div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Generated On</div><div className="text-sm font-black text-slate-900">{new Date().toLocaleDateString('en-GB')}</div></div>
                  </div>
               </div>
               <table className="w-full mb-10">
                 <thead><tr className="border-b-4 border-slate-950"><th className="text-left py-4 text-[10px] font-black uppercase tracking-widest w-16">S.No</th><th className="text-left py-4 text-[10px] font-black uppercase tracking-widest">Employee Name</th><th className="text-right py-4 text-[10px] font-black uppercase tracking-widest">Monthly Amount</th></tr></thead>
                 <tbody>
                    {monthlyStatementData.report.map((row, idx) => (
                      <tr key={idx} className="border-b-2 border-slate-100">
                        <td className="py-4 font-black text-slate-400 text-xs">{idx + 1}</td>
                        <td className="py-4 font-black text-slate-900 text-base">{row.name}</td>
                        <td className="py-4 text-right font-black text-slate-950 text-lg">{APP_CONFIG.currency_symbol}{row.total.toFixed(2)}</td>
                      </tr>
                    ))}
                 </tbody>
               </table>
               <div className="flex justify-between items-center bg-slate-50 p-8 rounded-[2rem] border-4 border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Monthly Payable</div>
                  <div className="text-4xl font-black text-slate-950 tracking-tighter">{APP_CONFIG.currency_symbol}{monthlyStatementData.grandTotal.toFixed(2)}</div>
               </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!selectedEmployeeId} onClose={() => setSelectedEmployeeId(null)} maxWidth="max-w-5xl">
        {selectedEmployeeLedger && (
          <div className="space-y-8">
            {/* Header / Profile Section */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
               <div className="flex items-center gap-5">
                 <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-indigo-200">
                    {selectedEmployeeLedger.employee?.name.split(' ').map(n => n[0]).join('')}
                 </div>
                 <div>
                    <h2 className="text-4xl font-black text-slate-950 tracking-tight">{selectedEmployeeLedger.employee?.name}</h2>
                    <div className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">{selectedEmployeeLedger.employee?.companyName}</div>
                    <div className="flex gap-4 mt-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       <span>📞 {selectedEmployeeLedger.employee?.phone || 'N/A'}</span>
                       <span>✉ {selectedEmployeeLedger.employee?.email || 'N/A'}</span>
                    </div>
                 </div>
               </div>
               <button 
                 onClick={handleDownloadExcel}
                 className="px-6 py-3 bg-slate-400 text-white font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-500 shadow-lg shadow-slate-100 transition-all"
               >
                 📥 Download Excel
                 <span className="opacity-50 font-normal">Includes bills & payments</span>
               </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-indigo-600 p-8 rounded-[2rem] text-white shadow-2xl shadow-indigo-100 flex items-center gap-6">
                  <div className="text-4xl opacity-50">🧾</div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-70">Total Billed</div>
                    <div className="text-4xl font-black tracking-tighter">{APP_CONFIG.currency_symbol}{selectedEmployeeLedger.totalBilled.toFixed(2)}</div>
                  </div>
               </div>
               <div className="bg-emerald-500 p-8 rounded-[2rem] text-white shadow-2xl shadow-emerald-100 flex items-center gap-6">
                  <div className="text-4xl opacity-50">✔️</div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-70">Total Paid</div>
                    <div className="text-4xl font-black tracking-tighter">{APP_CONFIG.currency_symbol}{selectedEmployeeLedger.totalPaid.toFixed(2)}</div>
                  </div>
               </div>
               <div className="bg-slate-400 p-8 rounded-[2rem] text-white shadow-2xl shadow-slate-100 flex items-center gap-6 relative group overflow-hidden">
                  <div className="text-4xl opacity-50">⌛</div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-70">Pending</div>
                    <div className="text-4xl font-black tracking-tighter">{APP_CONFIG.currency_symbol}{selectedEmployeeLedger.pending.toFixed(2)}</div>
                  </div>
                  {selectedEmployeeLedger.pending > 0 && (
                    <button 
                      onClick={() => { setPaymentTarget({ bills: selectedEmployeeLedger.bills.filter(b => !b.isPaid), total: selectedEmployeeLedger.pending }); setIsPaymentFormOpen(true); }}
                      className="absolute bottom-0 right-0 left-0 bg-slate-950 py-3 text-[10px] font-black uppercase tracking-widest translate-y-full group-hover:translate-y-0 transition-transform"
                    >
                      Pay Now &rarr;
                    </button>
                  )}
               </div>
            </div>

            {/* Filters Section */}
            <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-100 space-y-6">
               <div className="text-sm font-black text-slate-900 uppercase tracking-widest">Filter by Date</div>
               <div className="flex flex-wrap gap-3">
                  {['today', 'week', 'month', 'lastMonth'].map(type => (
                    <button 
                      key={type}
                      onClick={() => setLedgerDateRange(type as any)}
                      className="px-6 py-3 bg-white border-2 border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-indigo-600 transition-all flex items-center gap-2"
                    >
                      <span>{type === 'today' ? '🗓️' : type === 'week' ? '📅' : '📊'}</span>
                      {type.replace(/([A-Z])/g, ' $1')}
                    </button>
                  ))}
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">From Date</label>
                    <input 
                      type="date" 
                      value={ledgerFilter.from}
                      onChange={(e) => setLedgerFilter(f => ({ ...f, from: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-white rounded-xl text-xs font-black focus:border-indigo-600 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">To Date</label>
                    <input 
                      type="date" 
                      value={ledgerFilter.to}
                      onChange={(e) => setLedgerFilter(f => ({ ...f, to: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-white rounded-xl text-xs font-black focus:border-indigo-600 outline-none" 
                    />
                  </div>
                  <div className="flex items-end gap-3 sm:col-span-2">
                    <button 
                      onClick={() => setLedgerFilter({ from: '', to: '' })}
                      className="flex-1 py-3.5 bg-white border-2 border-slate-200 text-slate-600 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-50"
                    >
                      Clear
                    </button>
                  </div>
               </div>
            </div>

            {/* Tabs & Content */}
            <div>
              <div className="flex justify-between items-center mb-6 border-b-2 border-slate-50">
                 <div className="flex gap-10">
                    <button 
                      onClick={() => setLedgerTab('bills')}
                      className={`pb-4 text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all ${ledgerTab === 'bills' ? 'text-indigo-600 border-b-4 border-indigo-600' : 'text-slate-400 border-b-4 border-transparent hover:text-slate-600'}`}
                    >
                      <span>📙</span> Bills
                      <span className="bg-indigo-50 px-2 py-0.5 rounded-lg text-[10px]">{selectedEmployeeLedger.bills.length}</span>
                    </button>
                    <button 
                      onClick={() => setLedgerTab('transactions')}
                      className={`pb-4 text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all ${ledgerTab === 'transactions' ? 'text-indigo-600 border-b-4 border-indigo-600' : 'text-slate-400 border-b-4 border-transparent hover:text-slate-600'}`}
                    >
                      <span>💰</span> Transactions
                      <span className="bg-indigo-50 px-2 py-0.5 rounded-lg text-[10px]">{selectedEmployeeLedger.payments.length}</span>
                    </button>
                 </div>
                 <button onClick={() => window.print()} className="px-5 py-2.5 bg-slate-400 text-white font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-900 transition-all">
                    <span>⎙</span> Print All
                 </button>
              </div>

              <div className="space-y-4">
                {ledgerTab === 'bills' ? (
                  selectedEmployeeLedger.bills.length > 0 ? selectedEmployeeLedger.bills.map(b => (
                    <div key={b.__backendId} className="p-6 bg-white border-2 border-slate-50 rounded-2xl flex justify-between items-center hover:border-slate-200 transition-all shadow-sm">
                       <div className="flex items-center gap-6">
                         <div className="text-2xl opacity-30">📄</div>
                         <div>
                            <div className="font-black text-slate-900">Bill #{b.billNumber}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(b.date).toLocaleDateString()}</div>
                         </div>
                       </div>
                       <div className="text-right">
                          <div className="font-black text-xl text-slate-950">{APP_CONFIG.currency_symbol}{b.total.toFixed(2)}</div>
                          <div className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border-2 inline-block mt-1 ${b.isPaid ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : 'border-orange-200 text-orange-600 bg-orange-50'}`}>
                            {b.isPaid ? 'PAID' : 'DUE'}
                          </div>
                       </div>
                    </div>
                  )) : (
                    <div className="py-20 text-center flex flex-col items-center gap-4 opacity-40">
                       <div className="text-6xl">📋</div>
                       <div className="text-xl font-black uppercase tracking-tighter text-slate-900">No bills found</div>
                       <div className="text-xs font-bold uppercase tracking-widest">Try adjusting your date filter</div>
                    </div>
                  )
                ) : (
                  selectedEmployeeLedger.payments.length > 0 ? selectedEmployeeLedger.payments.map(p => (
                    <div key={p.__backendId} className="p-6 bg-white border-2 border-slate-50 rounded-2xl flex justify-between items-center hover:border-slate-200 transition-all shadow-sm">
                       <div className="flex items-center gap-6">
                         <div className="text-2xl text-emerald-500">📥</div>
                         <div>
                            <div className="font-black text-slate-900">Payment Recv. ({p.paymentMethod})</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(p.paymentDate).toLocaleDateString()} at {p.paymentTime}</div>
                         </div>
                       </div>
                       <div className="text-right">
                          <div className="font-black text-xl text-emerald-600">+{APP_CONFIG.currency_symbol}{p.paidAmount.toFixed(2)}</div>
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Ref: {p.paymentBy}</div>
                       </div>
                    </div>
                  )) : (
                    <div className="py-20 text-center flex flex-col items-center gap-4 opacity-40">
                       <div className="text-6xl">💸</div>
                       <div className="text-xl font-black uppercase tracking-tighter text-slate-900">No transactions found</div>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="pt-10">
               <button 
                 onClick={() => setSelectedEmployeeId(null)}
                 className="w-full py-5 bg-white border-4 border-slate-100 text-slate-600 font-black rounded-3xl uppercase tracking-widest hover:border-slate-200 transition-all shadow-sm text-sm"
               >
                 Close
               </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isPaymentFormOpen} onClose={() => setIsPaymentFormOpen(false)} title="Record Ledger Entry" zIndex="z-[60]" maxWidth="max-w-3xl">
        {paymentTarget && (
          <form onSubmit={handleRecordPayment} className="space-y-8">
            <div className="bg-slate-950 text-white p-12 rounded-[2.5rem] flex justify-between items-center shadow-2xl">
               <div><div className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Entry Amount</div><div className="flex items-baseline gap-2"><span className="text-4xl font-black">₹</span><input name="payAmount" type="number" step="0.01" autoFocus defaultValue={paymentTarget.total.toFixed(2)} className="bg-transparent text-7xl font-black outline-none border-b-4 border-slate-700 focus:border-emerald-500 transition-all w-64" /></div></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <input type="date" name="payDate" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-5 rounded-2xl border-4 border-slate-100 font-black outline-none" />
              <input type="time" name="payTime" required defaultValue={new Date().toTimeString().slice(0, 5)} className="w-full p-5 rounded-2xl border-4 border-slate-100 font-black outline-none" />
              <select name="payMethod" required className="w-full p-5 rounded-2xl border-4 border-slate-100 font-black outline-none bg-slate-50"><option value="Cash">Cash</option><option value="UPI">UPI / Online</option><option value="Card">Bank Card</option></select>
              <input type="text" name="payBy" placeholder="Authorized Receiver" required className="w-full p-5 rounded-2xl border-4 border-slate-100 font-black outline-none" />
            </div>
            <button type="submit" className="w-full py-7 bg-emerald-600 text-white font-black rounded-3xl uppercase tracking-widest shadow-2xl hover:bg-emerald-700 transition-all text-xl">Confirm Entry</button>
          </form>
        )}
      </Modal>

      {viewingBill && (
        <Modal isOpen={!!viewingBill} onClose={() => setViewingBill(null)} title={`Invoice #${viewingBill.billNumber}`}>
          <div className="space-y-8">
            <div className="p-10 bg-slate-50 border-4 border-slate-200 rounded-[2.5rem] shadow-inner">
               <div className="grid grid-cols-2 gap-10">
                 <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Account Details</label><div className="text-3xl font-black text-slate-950">{viewingBill.employeeName}</div><div className="text-lg font-bold text-slate-600 mt-1 uppercase tracking-tight">{viewingBill.companyName}</div></div>
                 <div className="text-right"><label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Metadata</label><div className="text-2xl font-black text-slate-950">{new Date(viewingBill.date).toLocaleDateString()}</div><div className={`text-xs font-black uppercase px-5 py-2 rounded-full border-2 inline-block mt-3 tracking-widest ${viewingBill.isPaid ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : 'border-amber-500 text-amber-600 bg-amber-50'}`}>{viewingBill.isPaid ? 'Settled' : 'Pending'}</div></div>
               </div>
            </div>
            <table className="w-full">
              <thead><tr className="border-b-4 border-slate-950"><th className="text-left py-6 text-xs font-black uppercase">Service</th><th className="text-center py-6 text-xs font-black uppercase">Qty</th><th className="text-right py-6 text-xs font-black uppercase">Rate</th><th className="text-right py-6 text-xs font-black uppercase">Amount</th></tr></thead>
              <tbody>{viewingBill.items.map((item, idx) => (<tr key={idx} className="border-b-2 border-slate-100"><td className="py-6 font-black text-xl text-slate-900">{item.name}</td><td className="py-6 text-center font-bold text-xl text-slate-700">{item.quantity}</td><td className="py-6 text-right font-bold text-xl text-slate-700">{APP_CONFIG.currency_symbol}{item.price.toFixed(2)}</td><td className="py-6 text-right font-black text-3xl text-slate-950">{APP_CONFIG.currency_symbol}{(item.price * item.quantity).toFixed(2)}</td></tr>))}</tbody>
            </table>
            <button onClick={() => setBillToPrint(viewingBill)} className="w-full py-6 bg-slate-950 text-white font-black rounded-3xl uppercase tracking-widest shadow-2xl hover:bg-black active:scale-95 transition-all text-sm">Download / Print PDF</button>
          </div>
        </Modal>
      )}

      {billToPrint && <PrintBill bill={billToPrint} settings={settings} />}
    </div>
  );
};

export default App;
