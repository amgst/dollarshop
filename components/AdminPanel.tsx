
import React, { useState } from 'react';
import { Product, Category, StoreConfig, Order } from '../types';
import { initGoogleDriveAuth, uploadFileToDrive } from '../services/googleDriveService';

interface AdminPanelProps {
  products: Product[];
  config: StoreConfig;
  orders: Order[];
  onAddProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onUpdateProduct: (product: Product) => Promise<void>;
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
  onUpdateProduct,
  onUpdateConfig,
  onClearOrders
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders'>('inventory');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Snacks' as Category,
    image: '',
  });

  const [priceInput, setPriceInput] = useState(config.itemPrice.toString());
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [gDriveToken, setGDriveToken] = useState<string | null>(null);

  // Check for existing token on mount
  React.useEffect(() => {
    const storedToken = localStorage.getItem('gdrive_token');
    const storedExpiry = localStorage.getItem('gdrive_token_expiry');

    if (storedToken && storedExpiry) {
      const expiryTime = parseInt(storedExpiry, 10);
      if (Date.now() < expiryTime) {
        setGDriveToken(storedToken);
      } else {
        // Token expired
        localStorage.removeItem('gdrive_token');
        localStorage.removeItem('gdrive_token_expiry');
      }
    }
  }, []);

  const handleConnectDrive = () => {
    const client = initGoogleDriveAuth((token, expiresIn) => {
      setGDriveToken(token);
      
      // Calculate expiry time (current time + seconds * 1000)
      const expiryTime = Date.now() + (expiresIn * 1000); 
      
      localStorage.setItem('gdrive_token', token);
      localStorage.setItem('gdrive_token_expiry', expiryTime.toString());

      alert('Google Drive Connected!');
    });
    // @ts-ignore
    client.requestAccessToken();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!gDriveToken) {
      alert("Please connect Google Drive first!");
      return;
    }

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadProgress('Uploading to Drive...');
      try {
        const url = await uploadFileToDrive(file, gDriveToken);
        setFormData(prev => ({ ...prev, image: url }));
        setUploadProgress('Upload Complete!');
      } catch (error) {
        console.error("Upload failed", error);
        setUploadProgress('Upload Failed');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.image) return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        await onUpdateProduct({
          id: editingId,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          image: formData.image,
          price: config.itemPrice,
        });
        setEditingId(null);
      } else {
        await onAddProduct({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          image: formData.image,
          price: config.itemPrice,
        });
      }
      setFormData({ name: '', description: '', category: 'Snacks', image: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      image: product.image,
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', description: '', category: 'Snacks', image: '' });
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
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
                {editingId && (
                  <button type="button" onClick={handleCancelEdit} className="text-sm font-bold text-slate-400 hover:text-slate-600">
                    Cancel
                  </button>
                )}
              </div>
              <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3" placeholder="Item Name" />
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })} className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3">
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Product Image (Google Drive)</label>
                
                {!gDriveToken ? (
                  <button 
                    type="button"
                    onClick={handleConnectDrive}
                    className="w-full bg-blue-50 text-blue-600 font-bold py-2 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.01 1.99c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-2-5.5l6-4-6-4v8z"/></svg>
                    Connect Google Drive
                  </button>
                ) : (
                  <div className="flex gap-2">
                     <input 
                       type="file" 
                       accept="image/*"
                       onChange={handleImageUpload}
                       className="block w-full text-sm text-slate-500
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-full file:border-0
                         file:text-xs file:font-semibold
                         file:bg-blue-50 file:text-blue-700
                         hover:file:bg-blue-100
                       "
                     />
                  </div>
                )}

                {uploadProgress && <p className="text-xs font-bold text-blue-600 ml-1">{uploadProgress}</p>}
                <input required type="url" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3" placeholder="Or paste Image URL" />
              </div>

              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 h-24" placeholder="Description" />
              <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl disabled:opacity-50">
                {editingId ? 'UPDATE PRODUCT' : 'CREATE PRODUCT'}
              </button>
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
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(product)} className="p-3 text-blue-500 hover:bg-blue-50 rounded-2xl">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => onDeleteProduct(product.id)} className="p-3 text-red-500 hover:bg-red-50 rounded-2xl">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
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
