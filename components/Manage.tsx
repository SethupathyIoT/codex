
import React, { useState } from 'react';
import { Company, Employee } from '../types';

interface ManageProps {
  companies: Company[];
  employees: Employee[];
  onAddCompany: (data: any) => boolean;
  onUpdateCompany: (id: string, data: any) => boolean;
  onAddEmployee: (data: any) => boolean;
  onUpdateEmployee: (id: string, data: any) => boolean;
}

const Manage: React.FC<ManageProps> = ({
  companies,
  employees,
  onAddCompany,
  onUpdateCompany,
  onAddEmployee,
  onUpdateEmployee
}) => {
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const handleCompanySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const data = { name: f.get('name') as string, contactPerson: f.get('contact') as string, phone: f.get('phone') as string, email: f.get('email') as string, address: f.get('address') as string };
    const success = editingCompany ? onUpdateCompany(editingCompany.__backendId, data) : onAddCompany(data);
    if (success) { setEditingCompany(null); e.currentTarget.reset(); }
  };

  const handleEmployeeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const data = { companyId: f.get('companyId') as string, name: f.get('name') as string, phone: f.get('phone') as string, email: f.get('email') as string };
    const success = editingEmployee ? onUpdateEmployee(editingEmployee.__backendId, data) : onAddEmployee(data);
    if (success) { setEditingEmployee(null); e.currentTarget.reset(); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-7xl mx-auto">
      <div className="space-y-8">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border-4 border-slate-100">
          <h2 className="text-3xl font-black mb-8 text-indigo-700 uppercase tracking-tighter">
            <span>🏢</span> {editingCompany ? 'Edit Company' : 'New Company'}
          </h2>
          <form onSubmit={handleCompanySubmit} className="space-y-5">
            <input name="name" defaultValue={editingCompany?.name} placeholder="Company Name *" required className="w-full px-5 py-4 rounded-2xl border-4 border-slate-50 focus:border-indigo-600 outline-none font-bold" />
            <input name="contact" defaultValue={editingCompany?.contactPerson} placeholder="Contact Person" className="w-full px-5 py-4 rounded-2xl border-4 border-slate-50 focus:border-indigo-600 outline-none font-bold" />
            <div className="grid grid-cols-2 gap-5">
              <input name="phone" defaultValue={editingCompany?.phone} placeholder="Phone" className="w-full px-5 py-4 rounded-2xl border-4 border-slate-50 focus:border-indigo-600 outline-none font-bold" />
              <input name="email" type="email" defaultValue={editingCompany?.email} placeholder="Email" className="w-full px-5 py-4 rounded-2xl border-4 border-slate-50 focus:border-indigo-600 outline-none font-bold" />
            </div>
            <textarea name="address" defaultValue={editingCompany?.address} placeholder="Address" className="w-full px-5 py-4 rounded-2xl border-4 border-slate-50 focus:border-indigo-600 outline-none h-28 font-bold" />
            <div className="flex gap-4">
              {editingCompany && <button type="button" onClick={() => setEditingCompany(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase text-xs">Cancel</button>}
              <button type="submit" className="flex-[2] py-5 bg-indigo-700 text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-sm">{editingCompany ? 'Update Company' : 'Save Company'}</button>
            </div>
          </form>
        </div>
        <div className="bg-white/50 p-6 rounded-[2rem] border-4 border-dashed border-slate-200">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-4 px-4">Registry ({companies.length})</h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {companies.map(c => (
              <div key={c.__backendId} className="flex justify-between items-center p-5 bg-white rounded-2xl border-2 border-slate-100 hover:border-indigo-200 transition-all">
                <div className="font-black text-slate-900">{c.name}</div>
                <button onClick={() => setEditingCompany(c)} className="px-4 py-2 bg-indigo-50 text-indigo-700 font-black rounded-xl text-[10px] uppercase hover:bg-indigo-700 hover:text-white transition-all">Edit</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border-4 border-slate-100">
          <h2 className="text-3xl font-black mb-8 text-emerald-700 uppercase tracking-tighter">
            <span>👤</span> {editingEmployee ? 'Edit Staff' : 'Register Staff'}
          </h2>
          <form onSubmit={handleEmployeeSubmit} className="space-y-5">
            <select name="companyId" defaultValue={editingEmployee?.companyId} required className="w-full px-5 py-4 rounded-2xl border-4 border-slate-50 focus:border-emerald-600 outline-none font-bold bg-white">
              <option value="">Choose Company...</option>
              {companies.map(c => <option key={c.__backendId} value={c.__backendId}>{c.name}</option>)}
            </select>
            <input name="name" defaultValue={editingEmployee?.name} placeholder="Staff Full Name *" required className="w-full px-5 py-4 rounded-2xl border-4 border-slate-50 focus:border-emerald-600 outline-none font-bold" />
            <input name="phone" defaultValue={editingEmployee?.phone} placeholder="Phone" className="w-full px-5 py-4 rounded-2xl border-4 border-slate-50 focus:border-emerald-600 outline-none font-bold" />
            <input name="email" type="email" defaultValue={editingEmployee?.email} placeholder="Email (Optional)" className="w-full px-5 py-4 rounded-2xl border-4 border-slate-50 focus:border-emerald-600 outline-none font-bold" />
            <div className="flex gap-4 pt-4">
              {editingEmployee && <button type="button" onClick={() => setEditingEmployee(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase text-xs">Cancel</button>}
              <button type="submit" className="flex-[2] py-5 bg-emerald-700 text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-sm">{editingEmployee ? 'Update Staff' : 'Save Staff'}</button>
            </div>
          </form>
        </div>
        <div className="bg-white/50 p-6 rounded-[2rem] border-4 border-dashed border-slate-200">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-4 px-4">Directory ({employees.length})</h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {employees.map(e => (
              <div key={e.__backendId} className="flex justify-between items-center p-5 bg-white rounded-2xl border-2 border-slate-100 hover:border-emerald-200 transition-all">
                <div><div className="font-black text-slate-900">{e.name}</div><div className="text-[10px] font-bold text-emerald-600 uppercase">{e.companyName}</div></div>
                <button onClick={() => setEditingEmployee(e)} className="px-4 py-2 bg-emerald-50 text-emerald-700 font-black rounded-xl text-[10px] uppercase hover:bg-emerald-700 hover:text-white transition-all">Edit</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Manage;
