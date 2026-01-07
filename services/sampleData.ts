
import { BaseRecord, Company, Employee, FoodItem, Bill } from '../types';

const timestamp = Date.now();
const sampleCompanies: Company[] = [
  { __backendId: 'id_comp_tech', type: 'company', timestamp, name: 'Tech Solutions Pvt Ltd', contactPerson: 'Rajesh Kumar', phone: '9876543210', email: 'rajesh@tech.com', address: 'Bangalore' },
  { __backendId: 'id_comp_global', type: 'company', timestamp, name: 'Global Industries', contactPerson: 'Priya Sharma', phone: '9876543211', email: 'priya@global.com', address: 'Mumbai' }
];

const sampleEmployees: Employee[] = [
  { __backendId: 'id_emp_suresh', type: 'employee', timestamp, companyId: 'id_comp_tech', companyName: 'Tech Solutions Pvt Ltd', name: 'Suresh Reddy', phone: '9988776655', email: '' },
  { __backendId: 'id_emp_lakshmi', type: 'employee', timestamp, companyId: 'id_comp_tech', companyName: 'Tech Solutions Pvt Ltd', name: 'Lakshmi Iyer', phone: '9988776656', email: '' },
  { __backendId: 'id_emp_ravi', type: 'employee', timestamp, companyId: 'id_comp_global', companyName: 'Global Industries', name: 'Ravi Kumar', phone: '9988776658', email: '' }
];

const sampleFoodItems: FoodItem[] = [
  { __backendId: 'f1', type: 'foodItem', timestamp, itemName: 'Idli Sambar', category: 'Breakfast', price: 40, isActive: true },
  { __backendId: 'f5', type: 'foodItem', timestamp, itemName: 'Veg Thali', category: 'Lunch', price: 120, isActive: true },
  { __backendId: 'f15', type: 'foodItem', timestamp, itemName: 'Tea', category: 'Beverages', price: 15, isActive: true }
];

const generateBills = () => {
  const bills: Bill[] = [];
  let count = 1;
  // Generate data for Jan, Feb, and March 2025
  ['2025-01', '2025-02', '2025-03'].forEach(month => {
    sampleEmployees.forEach(emp => {
      // 6 random bills per employee per month
      for (let i = 1; i <= 6; i++) {
        const day = String(i * 4).padStart(2, '0');
        const total = 80 + Math.floor(Math.random() * 300);
        const isPaid = Math.random() > 0.5;
        bills.push({
          __backendId: `b_${count}`, 
          type: 'bill', 
          timestamp: new Date(`${month}-${day}`).getTime(), 
          billId: `SND-2025-00${count}`, 
          billNumber: count,
          date: `${month}-${day}`, 
          companyId: emp.companyId, 
          companyName: emp.companyName, 
          employeeId: emp.__backendId, 
          employeeName: emp.name,
          items: [{ id: 'it', name: 'Regular Service', price: total, quantity: 1 }], 
          subtotal: total, 
          tax: 0, 
          total: total, 
          isPaid, 
          paidAmount: isPaid ? total : 0,
          syncStatus: 'synced', 
          paymentMethod: 'Cash', 
          orderType: 'Dine-In'
        });
        count++;
      }
    });
  });
  return bills;
};

export const SAMPLE_DATA: BaseRecord[] = [...sampleCompanies, ...sampleEmployees, ...sampleFoodItems, ...generateBills()];
