
import React, { useState, useMemo } from 'react';
import { Company, Employee, FoodItem, Settings, BillItem, Bill } from '../types';
import { APP_CONFIG, FOOD_CATEGORIES } from '../constants';

interface NewBillProps {
  companies: Company[];
  employees: Employee[];
  foodItems: FoodItem[];
  bills: Bill[];
  settings: Settings;
  onSave: (billData: any, shouldPrint: boolean) => void;
  onCancel: () => void;
  onViewBill: (bill: Bill) => void;
}

const NewBill: React.FC<NewBillProps> = ({ companies, employees, foodItems, bills, settings, onSave, onCancel, onViewBill }) => {
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Items');
  const [cart, setCart] = useState<BillItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [orderType, setOrderType] = useState('Dine-In');

  const filteredEmployees = employees.filter(e => e.companyId === selectedCompanyId);

  const filteredFoodItems = useMemo(() => {
    return foodItems.filter(item => {
      const matchesSearch = item.itemName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All Items' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [foodItems, searchQuery, selectedCategory]);

  const recentBills = useMemo(() => {
    return [...bills].reverse().slice(0, 10);
  }, [bills]);

  const addToCart = (item: FoodItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.__backendId);
      if (existing) {
        return prev.map(i => i.id === item.__backendId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: item.__backendId, name: item.itemName, price: item.price, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal; // Assuming no tax as per prev requirements or settings

  const handleSubmit = (shouldPrint: boolean) => {
    if (!selectedCompanyId || !selectedEmployeeId || cart.length === 0) {
      alert('Please select Company, Staff, and add items.');
      return;
    }

    const company = companies.find(c => c.__backendId === selectedCompanyId);
    const employee = employees.find(e => e.__backendId === selectedEmployeeId);

    onSave({
      date: billDate,
      companyId: selectedCompanyId,
      companyName: company?.name,
      employeeId: selectedEmployeeId,
      employeeName: employee?.name,
      items: cart,
      subtotal: subtotal,
      tax: 0,
      total: total,
      paymentMethod,
      orderType,
    }, shouldPrint);

    // Clear cart for next entry
    setCart([]);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-200px)] gap-6 animate-in fade-in duration-300">
      
      {/* LEFT: Side Bill History (interpreted as "alwase is side bill") */}
      <div className="hidden xl:flex w-72 flex-col bg-slate-100 rounded-2xl border-2 border-slate-200 overflow-hidden shadow-inner">
        <div className="p-4 border-b border-slate-200 bg-white/50">
          <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Recent Activity</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {recentBills.map(b => (
            <div 
              key={b.__backendId} 
              onClick={() => onViewBill(b)}
              className="p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-500 cursor-pointer shadow-sm transition-all"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-black text-slate-900 text-xs">#{b.billNumber}</span>
                <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">{b.companyName.substring(0, 10)}</span>
              </div>
              <div className="text-[10px] font-bold text-slate-600 truncate">{b.employeeName}</div>
              <div className="font-black text-xs mt-1">{APP_CONFIG.currency_symbol}{b.total.toFixed(0)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CENTER: Menu & Filters */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px] relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40">🔍</span>
              <input 
                type="text" 
                placeholder="Search food..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
              />
            </div>
            <div className="flex gap-2">
              {['All Items', ...FOOD_CATEGORIES].map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${selectedCategory === cat ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFoodItems.map(item => (
              <button 
                key={item.__backendId}
                onClick={() => addToCart(item)}
                className="bg-white p-5 rounded-2xl border-2 border-slate-100 hover:border-indigo-500 hover:shadow-xl transition-all text-left flex flex-col justify-between group active:scale-95 shadow-sm"
              >
                <div className="mb-4">
                  <div className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">{item.category}</div>
                  <div className="font-black text-slate-900 leading-tight group-hover:text-indigo-600">{item.itemName}</div>
                </div>
                <div className="font-black text-xl text-slate-950">{APP_CONFIG.currency_symbol}{item.price.toFixed(0)}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Cart & Details */}
      <div className="w-full lg:w-[400px] flex flex-col bg-white rounded-3xl shadow-2xl border-4 border-slate-100 overflow-hidden">
        <div className="p-6 border-b-2 border-slate-50 bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight">
            <span>🛒</span> Item Basket
          </h3>
          <button onClick={() => setCart([])} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline">Clear</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {cart.map(item => (
            <div key={item.id} className="flex items-center justify-between gap-4 pb-4 border-b border-slate-50">
              <div className="flex-1">
                <div className="font-black text-slate-800 text-sm leading-tight">{item.name}</div>
                <div className="text-[10px] font-bold text-slate-400 mt-1">{APP_CONFIG.currency_symbol}{item.price} × {item.quantity}</div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-xl font-black">-</button>
                <span className="font-black text-sm">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-xl font-black">+</button>
              </div>
              <button
                onClick={() => removeFromCart(item.id)}
                className="text-slate-300 hover:text-rose-500 transition-colors text-xl"
                aria-label={`Remove ${item.name}`}
              >
                ×
              </button>
              <div className="font-black text-slate-950 text-right min-w-[60px]">
                {APP_CONFIG.currency_symbol}{(item.price * item.quantity).toFixed(0)}
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-30 py-20 italic">
              <span className="text-6xl mb-4">🍽️</span>
              <p className="font-black text-xs uppercase tracking-[0.2em]">Select Items</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-950 text-white space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Payable Amount</span>
            <span className="text-4xl font-black text-white tracking-tighter">{APP_CONFIG.currency_symbol}{total.toFixed(2)}</span>
          </div>
        </div>

        <div className="p-6 bg-white space-y-4 border-t-2 border-slate-50">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Company</label>
              <select 
                value={selectedCompanyId}
                onChange={(e) => { setSelectedCompanyId(e.target.value); setSelectedEmployeeId(''); }}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-black focus:border-indigo-500 outline-none"
              >
                <option value="">Choose Company...</option>
                {companies.map(c => <option key={c.__backendId} value={c.__backendId}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Staff Member</label>
              <select 
                value={selectedEmployeeId}
                disabled={!selectedCompanyId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-black focus:border-indigo-500 outline-none disabled:opacity-50"
              >
                <option value="">Select Staff...</option>
                {filteredEmployees.map(e => <option key={e.__backendId} value={e.__backendId}>{e.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Order Type</label>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-black focus:border-indigo-500 outline-none"
                >
                  <option value="Dine-In">Dine-In</option>
                  <option value="Takeaway">Takeaway</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-black focus:border-indigo-500 outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI / Online</option>
                  <option value="Card">Bank Card</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onCancel}
              className="flex-1 py-4 bg-white text-slate-600 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all border-2 border-slate-200 shadow-sm"
            >
              Cancel
            </button>
            <button 
              onClick={() => handleSubmit(false)}
              className="flex-1 py-4 bg-slate-100 text-slate-950 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all border-2 border-slate-200 shadow-sm"
            >
              Save Record
            </button>
            <button 
              onClick={() => handleSubmit(true)}
              className="flex-[1.5] py-4 bg-indigo-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2"
            >
              <span>🖨️</span> Save & Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewBill;
