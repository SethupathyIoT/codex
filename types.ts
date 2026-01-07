
export type RecordType = 'company' | 'employee' | 'bill' | 'payment' | 'foodItem' | 'settings';

export interface BaseRecord {
  __backendId: string;
  type: RecordType;
  timestamp: number;
}

export interface Company extends BaseRecord {
  type: 'company';
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
}

export interface Employee extends BaseRecord {
  type: 'employee';
  companyId: string;
  companyName: string;
  name: string;
  phone: string;
  email: string;
}

export interface FoodItem extends BaseRecord {
  type: 'foodItem';
  itemName: string;
  category: string;
  price: number;
  isActive: boolean;
}

export interface BillItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export type SyncStatus = 'synced' | 'pending' | 'failed';

export interface Bill extends BaseRecord {
  type: 'bill';
  billId: string;
  billNumber: number;
  date: string;
  companyId: string;
  companyName: string;
  employeeId: string;
  employeeName: string;
  items: BillItem[];
  subtotal: number;
  tax: number;
  total: number;
  isPaid: boolean;
  paidAmount: number;
  syncStatus?: SyncStatus;
  paymentMethod?: string;
  orderType?: string;
}

export interface Payment extends BaseRecord {
  type: 'payment';
  billId?: string;
  employeeId: string;
  employeeName: string;
  companyId: string;
  companyName: string;
  paidAmount: number;
  paymentDate: string;
  paymentTime: string;
  paymentMethod: string;
  paymentBy: string;
  paymentType: 'staff' | 'company';
  syncStatus?: SyncStatus;
}

export interface Settings extends BaseRecord {
  type: 'settings';
  businessName: string;
  businessTagline: string;
  businessAddress: string;
  businessPhone: string;
  gstNumber: string;
  taxRate: number;
  printerType: 'A4' | '80mm';
  thankYouMessage: string;
  footerNote: string;
}

export type Page = 'dashboard' | 'newbill' | 'companies' | 'manage' | 'foodmenu' | 'reports' | 'settings';
