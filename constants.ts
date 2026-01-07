
import { Settings } from './types';

export const FOOD_CATEGORIES = ["Breakfast", "Lunch", "Dinner"];

export const DEFAULT_SETTINGS: Partial<Settings> = {
  businessName: 'SOUNDARYAM',
  businessTagline: 'Food Services for Corporate Employees',
  businessAddress: 'Corporate Hub, Sector 5, Industrial Area',
  businessPhone: '+91 98765 43210',
  gstNumber: '',
  taxRate: 0,
  printerType: 'A4',
  thankYouMessage: 'Thank you for choosing Soundaryam',
  footerNote: 'This is a system-generated bill'
};

export const APP_CONFIG = {
  primary_color: "#0f172a", // Slate 900 for professional look
  currency_symbol: "₹",
  font_size: 14,
  invoice_prefix: "SND"
};
