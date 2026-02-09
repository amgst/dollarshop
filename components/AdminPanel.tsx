
import React, { useState } from 'react';
import { Product, Category, StoreConfig, Order } from '../types';

interface AdminPanelProps {
  products: Product[];
  config: StoreConfig;
  orders: Order[];
  onAddProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onUpdateConfig: (config: StoreConfig) => Promise<void>;
  onClearOrders: () => void;
}

const CATEGORIES: Category[] = ['Snacks', 'Stationery', 'Houseware', 'Gadgets', 'Self-Care'];

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  products, 
  config, 
  orders,
  onAddProduct, 
  onDeleteProduct, 
  onUpdateConfig,
  onClearOrders
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders'>('inventory');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Snacks' as Category,
    image: '',
  });

  const [priceInput, setPriceInput] = useState(config.itemPrice.toString());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.image) return;

    setIsSubmitting(true);
    try {
      await onAddProduct({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        image: formData.image,
        price: config.itemPrice,
      });
      setFormData({ name: '', description: '', category: 'Snacks', image: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePriceUpdate = async () => {
    const newPrice = parseInt(priceInput);
    if (isNaN(newPrice) || newPrice < 0) return;
    setIsSubmitting(true);
    try {
      await onUpdateConfig({ ...config, itemPrice: newPrice });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-12 animate-fade-in">
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Cloud Management</h2>
          <p className="text-slate-500">Real-time control via Firebase Firestore.</p>
        </div>
        
        <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1">
          <button onClick={() => setActiveTab('inventory')} className={`px-6 py-2 rounded-xl font-bold text-sm ${activeTab === 'inventory' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Inventory</button>
          <button onClick={() => setActiveTab('orders')} className={`px-6 py-2 rounded-xl font-bold text-sm relative ${activeTab === 'orders' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
            Orders {orders.length > 0 && activeTab !== 'orders' && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-slate-100"></span>}
          </button>
        </div>
      </header>

      {activeTab === 'inventory' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="space-y-8">
            <section className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 h-fit">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">Store Configuration</h3>
              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Global Item Price (Rs.)</label>
                <div className="flex gap-2">
                  <input type="number" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} className="flex-1 bg-slate-50 border-none rounded-2xl px-4 py-3" />
                  <button onClick={handlePriceUpdate} disabled={isSubmitting} className="bg-slate-900 text-white px-4 rounded-2xl font-bold text-sm disabled:opacity-50">Update</button>
                </div>
              </div>
            </section>

            <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 space-y-4">
              <h3 className="text-xl font-bold mb-6">Add New Product</h3>
              <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3" placeholder="Item Name" />
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })} className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3">
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <input required type="url" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3" placeholder="Image URL" />
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 h-24" placeholder="Description" />
              <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl disabled:opacity-50">CREATE PRODUCT</button>
            </form>
          </div>

          <section className="lg:col-span-2 space-y-4">
            <h3 className="text-xl font-bold">Active Inventory ({products.length})</h3>
            <div className="grid grid-cols-1 gap-4">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-3xl p-4 shadow-sm border flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img src={product.image} className="w-16 h-16 rounded-2xl object-cover" />
                    <div>
                      <h4 className="font-bold">{product.name}</h4>
                      <span className="text-xs font-black text-emerald-600">Rs. {product.price}</span>
                    </div>
                  </div>
                  <button onClick={() => onDeleteProduct(product.id)} className="p-3 text-red-500 hover:bg-red-50 rounded-2xl"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Orders ({orders.length})</h3>
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-3xl shadow-sm border overflow-hidden">
              <div className="bg-slate-50 p-6 flex justify-between">
                <div>
                  <span className="text-xs font-black text-slate-400">ORDER #{order.id}</span>
                  <p className="font-bold">{formatDate(order.timestamp)}</p>
                </div>
                <p className="font-black text-emerald-600 text-xl">Rs. {order.total}</p>
              </div>
              <div className="p-6 grid md:grid-cols-2 gap-8">
                <div>
                  <h5 className="text-xs font-black text-slate-400 uppercase mb-2">Customer</h5>
                  <p className="font-bold">{order.customer.name}</p>
                  <p className="text-sm">{order.customer.phone}</p>
                  <p className="text-sm">{order.customer.address}, {order.customer.city}</p>
                </div>
                <div>
                  <h5 className="text-xs font-black text-slate-400 uppercase mb-2">Items</h5>
                  {order.items.map((item, idx) => <div key={idx} className="text-sm flex justify-between"><span>{item.quantity}x {item.name}</span><span>Rs. {item.price * item.quantity}</span></div>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
