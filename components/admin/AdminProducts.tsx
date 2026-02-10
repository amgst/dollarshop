import React, { useState } from 'react';
import { Product, Category } from '../../types';
import { uploadFileToDrive } from '../../services/googleDriveService';

interface AdminProductsProps {
  products: Product[];
  gDriveToken: string | null;
  itemPrice: number;
  onAddProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  onUpdateProduct: (product: Product) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onNavigateToSettings: () => void;
}

const CATEGORIES: Category[] = ['Snacks', 'Stationery', 'Houseware', 'Gadgets', 'Self-Care'];

export const AdminProducts: React.FC<AdminProductsProps> = ({
  products,
  gDriveToken,
  itemPrice,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onNavigateToSettings
}) => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Snacks' as Category,
    image: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      image: product.image,
    });
    setView('form');
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '', category: 'Snacks', image: '' });
    setView('form');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!gDriveToken) {
      alert("Please connect Google Drive in Settings first!");
      onNavigateToSettings();
      return;
    }

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadProgress('Uploading...');
      try {
        const url = await uploadFileToDrive(file, gDriveToken);
        setFormData(prev => ({ ...prev, image: url }));
        setUploadProgress('Done!');
      } catch (error) {
        console.error("Upload failed", error);
        setUploadProgress('Failed');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.image) return;

    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await onUpdateProduct({
          id: editingProduct.id,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          image: formData.image,
          price: itemPrice,
        });
      } else {
        await onAddProduct({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          image: formData.image,
          price: itemPrice,
        });
      }
      setView('list');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to fix broken legacy Drive links
  const getImageUrl = (url: string) => {
    if (url.includes('drive.google.com/uc?export=view&id=')) {
      const id = url.split('id=')[1];
      return `https://lh3.googleusercontent.com/d/${id}`;
    }
    return url;
  };

  if (view === 'form') {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => setView('list')}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-2xl font-black text-slate-900">
            {editingProduct ? 'Edit Product' : 'Add Product'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Product Name</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3" placeholder="e.g. Spicy Chips" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Category</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3">
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 h-32 resize-none" placeholder="Product details..." />
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Media</label>
              
              <div className="bg-slate-50 rounded-2xl p-4 border-2 border-dashed border-slate-200 hover:border-emerald-500 transition-colors relative">
                {formData.image ? (
                  <div className="relative group">
                    <img src={getImageUrl(formData.image)} className="w-full h-48 object-cover rounded-xl shadow-sm" alt="Preview" />
                    <button 
                      type="button"
                      onClick={() => setFormData({ ...formData, image: '' })}
                      className="absolute top-2 right-2 bg-white/90 p-2 rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center text-slate-400">
                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-sm font-medium">No image selected</span>
                  </div>
                )}

                <div className="mt-4">
                  {!gDriveToken ? (
                     <div className="text-center">
                       <p className="text-xs text-red-500 mb-2 font-bold">Drive not connected</p>
                       <button 
                         type="button"
                         onClick={onNavigateToSettings}
                         className="text-xs bg-slate-900 text-white px-3 py-2 rounded-lg"
                       >
                         Go to Settings
                       </button>
                     </div>
                  ) : (
                    <label className="block text-center">
                      <span className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-50 transition-colors">
                        {uploadProgress || 'Upload from Drive'}
                      </span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <input required type="url" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs" placeholder="Or paste Image URL" />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => setView('list')}
              className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-lg shadow-emerald-200"
            >
              {isSubmitting ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900">Products</h1>
        <button 
          onClick={handleAddNew}
          className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          Add Product
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Product</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Category</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Price</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <img 
                      src={getImageUrl(product.image)} 
                      className="w-12 h-12 rounded-lg object-cover bg-slate-100" 
                      alt=""
                    />
                    <span className="font-bold text-slate-700">{product.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">
                    {product.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-medium text-slate-600">
                  Rs. {itemPrice}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => onDeleteProduct(product.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                  No products found. Add one to get started!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
