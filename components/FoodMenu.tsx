
import React from 'react';
import { FoodItem } from '../types';
import { APP_CONFIG, FOOD_CATEGORIES } from '../constants';

interface FoodMenuProps {
  foodItems: FoodItem[];
  onAddFoodItem: (e: React.FormEvent<HTMLFormElement>) => void;
  onDeleteFoodItem: (id: string) => void;
}

const FoodMenu: React.FC<FoodMenuProps> = ({ foodItems, onAddFoodItem, onDeleteFoodItem }) => {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-blue-600 flex items-center justify-between">
        Food Menu Management
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="md:col-span-1">
          <h3 className="text-xl font-bold mb-4">Add New Item</h3>
          <form onSubmit={onAddFoodItem} className="space-y-4">
            <input name="name" placeholder="Item Name *" required className="w-full px-4 py-3 rounded-lg border-2 border-gray-100 focus:border-blue-500 outline-none" />
            <select name="category" required className="w-full px-4 py-3 rounded-lg border-2 border-gray-100 focus:border-blue-500 outline-none">
              <option value="">Category *</option>
              {FOOD_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <input name="price" type="number" step="0.01" placeholder="Price *" required className="w-full px-4 py-3 rounded-lg border-2 border-gray-100 focus:border-blue-500 outline-none" />
            <button type="submit" className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">Save Food Item</button>
          </form>
        </div>
        <div className="md:col-span-2 space-y-6">
          <h3 className="text-xl font-bold">Current Menu</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {foodItems.map(item => (
              <div key={item.__backendId} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center group">
                <div>
                  <div className="text-[10px] text-blue-500 font-bold uppercase">{item.category}</div>
                  <div className="font-bold">{item.itemName}</div>
                  <div className="text-lg font-bold text-gray-700">{APP_CONFIG.currency_symbol}{item.price.toFixed(2)}</div>
                </div>
                <button onClick={() => onDeleteFoodItem(item.__backendId)} className="p-2 text-red-300 hover:text-red-500 transition-colors">🗑️</button>
              </div>
            ))}
            {foodItems.length === 0 && <div className="col-span-full text-center py-12 text-gray-400">No items in menu</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodMenu;
