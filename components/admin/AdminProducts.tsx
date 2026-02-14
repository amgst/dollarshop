import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/cropImage';
import { Product, Category } from '../../types';
import { uploadFileToDrive } from '../../services/googleDriveService';
import { analyzeProductImage } from '../../services/geminiService';

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  // Crop State
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

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

      // Convert to base64 for cropping
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setCropImage(reader.result as string);
      });
      reader.readAsDataURL(file);

      // Clear input so same file can be selected again
      e.target.value = '';
    }
  };

  const handleCropConfirm = async () => {
    if (!cropImage || !croppedAreaPixels) return;

    try {
      const croppedBlob = await getCroppedImg(cropImage, croppedAreaPixels);
      if (!croppedBlob) throw new Error("Could not crop image");

      // Create a File object from Blob
      const file = new File([croppedBlob], "product-image.jpg", { type: "image/jpeg" });

      setCropImage(null); // Close cropper
      setUploadProgress('Uploading...');

      // Auto-fill details with AI if it's a new product or fields are empty
      if (!editingProduct) {
        setIsAnalyzing(true);
        setAiError(null);
        analyzeProductImage(file).then(analysis => {
          if (analysis) {
            setFormData(prev => ({
              ...prev,
              name: analysis.name || prev.name,
              description: analysis.description || prev.description,
              category: (CATEGORIES.includes(analysis.category as Category) ? analysis.category as Category : prev.category)
            }));
          }
        }).catch(err => {
          console.error("AI Error:", err);
          setAiError(err.message || "AI Analysis failed. Please fill details manually.");
        }).finally(() => setIsAnalyzing(false));
      }

      try {
        const url = await uploadFileToDrive(file, gDriveToken);
        setFormData(prev => ({ ...prev, image: url }));
        setUploadProgress('Done!');
      } catch (error) {
        console.error("Upload failed", error);
        setUploadProgress('Failed');
      }
    } catch (e) {
      console.error(e);
      alert("Something went wrong with cropping");
    }
  };

  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        let newProducts: any[] = [];

        if (file.name.endsWith('.json')) {
          newProducts = JSON.parse(text);
        } else if (file.name.endsWith('.csv')) {
          // Simple CSV parser
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const values = lines[i].split(','); // This is basic, doesn't handle commas in quotes
            const product: any = {};

            headers.forEach((header, index) => {
              if (values[index]) {
                product[header] = values[index].trim();
              }
            });

            if (product.name) newProducts.push(product);
          }
        }

        if (newProducts.length === 0) {
          alert("No valid products found in file");
          return;
        }

        let count = 0;
        for (const p of newProducts) {
          if (!p.name || !p.image) continue;

          await onAddProduct({
            name: p.name,
            description: p.description || '',
            category: (CATEGORIES.includes(p.category) ? p.category : 'Snacks') as Category,
            image: p.image,
            price: itemPrice
          });
          count++;
        }

        alert(`Successfully imported ${count} products!`);
        e.target.value = ''; // Reset input
      } catch (err) {
        console.error("Import failed", err);
        alert("Failed to import products. Check file format.");
      }
    };

    reader.readAsText(file);
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
    let id = '';
    // Handle standard view export format
    if (url.includes('drive.google.com/uc?export=view&id=')) {
      id = url.split('id=')[1];
    }
    // Handle file/d/ format
    else if (url.includes('drive.google.com/file/d/')) {
      const parts = url.split('/d/');
      if (parts[1]) {
        id = parts[1].split('/')[0];
      }
    }
    // Handle open?id= format
    else if (url.includes('drive.google.com/open?id=')) {
      id = url.split('id=')[1];
    }

    if (id) {
      // Clean ID just in case
      id = id.split('&')[0].split('?')[0];
      return `https://lh3.googleusercontent.com/d/${id}`;
    }
    return url;
  };

  if (cropImage) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col animate-fade-in">
        <div className="flex-1 relative">
          <Cropper
            image={cropImage}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>
        <div className="bg-slate-900 p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-white text-xs font-bold">Zoom</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-24 accent-emerald-500"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setCropImage(null)}
              className="text-white text-sm font-bold px-4 py-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCropConfirm}
              className="bg-emerald-500 text-white text-sm font-bold px-6 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Confirm Crop
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Media
                {aiError && <span className="ml-2 text-red-500 normal-case text-xs font-normal">{aiError}</span>}
              </label>

              <div className="bg-slate-50 rounded-2xl p-4 border-2 border-dashed border-slate-200 hover:border-emerald-500 transition-colors relative">
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center backdrop-blur-sm rounded-2xl">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                      <p className="text-sm font-bold text-emerald-800 animate-pulse">AI Analyzing...</p>
                    </div>
                  </div>
                )}
                {formData.image ? (
                  <div className="relative group">
                    <img
                      src={getImageUrl(formData.image)}
                      className="w-full h-48 object-cover rounded-xl shadow-sm"
                      alt="Preview"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+Load+Error';
                      }}
                    />
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

                <div className="mt-4 flex flex-col gap-2">
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
                    <div className="flex gap-3 justify-center">
                      {/* Standard Upload */}
                      <label className="flex-1 text-center cursor-pointer bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>

                      {/* Camera Capture */}
                      <label className="flex-1 text-center cursor-pointer bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-2 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-1.129l.812-1.218a2 2 0 011.664-.87h5.86a2 2 0 011.664.87l.812 1.218A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <span>Camera</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                  {uploadProgress && <p className="text-center text-xs text-slate-400 font-medium">{uploadProgress}</p>}
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
        <div className="flex gap-2">
          <label className="bg-white text-slate-600 border border-slate-200 px-4 py-3 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm cursor-pointer flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            Bulk Import
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleBulkImport}
              className="hidden"
            />
          </label>
          <button
            onClick={handleAddNew}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Add Product
          </button>
        </div>
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
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/100?text=Error';
                      }}
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
                    <button
                      onClick={async () => {
                        if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
                          try {
                            await onDeleteProduct(product.id);
                          } catch (err) {
                            // Error is handled in App.tsx alert, but we catch it here to prevent unhandled rejection
                          }
                        }
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
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
