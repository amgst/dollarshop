import React from 'react';
import { Product } from '../types';

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onAddToBundle: (product: Product) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ 
  product, 
  isOpen, 
  onClose,
  onAddToCart,
  onAddToBundle
}) => {
  if (!isOpen || !product) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white text-slate-500 hover:text-red-500 rounded-full p-2 transition-all backdrop-blur-sm"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="grid md:grid-cols-2 gap-0">
          {/* Image Section */}
          <div className="h-64 md:h-full bg-slate-100 relative">
            <img 
              src={getImageUrl(product.image)} 
              alt={product.name} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/400x400?text=Image+Not+Found';
              }}
            />
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-slate-800">
              {product.category}
            </div>
          </div>

          {/* Details Section */}
          <div className="p-8 flex flex-col h-full">
            <div className="flex-1">
              <h2 className="text-3xl font-black text-slate-800 mb-2 leading-tight">{product.name}</h2>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl font-bold text-emerald-600">Rs. {product.price}</span>
                {product.price < 200 && (
                  <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">
                    Best Value
                  </span>
                )}
              </div>
              
              <div className="prose prose-slate mb-8">
                <h3 className="text-sm font-bold uppercase text-slate-400 mb-2 tracking-widest">Description</h3>
                <p className="text-slate-600 leading-relaxed">
                  {product.description || "No description available for this amazing product. Grab it before it's gone!"}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 mt-auto pt-6 border-t border-slate-100">
              <button
                onClick={() => {
                  onAddToBundle(product);
                  onClose();
                }}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors group"
              >
                <span className="text-xs font-bold uppercase tracking-widest mb-1">Add to</span>
                <span className="font-black flex items-center gap-1">
                  BUNDLE
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </span>
              </button>

              <button
                onClick={() => {
                  onAddToCart(product);
                  onClose();
                }}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 group"
              >
                <span className="text-xs font-bold uppercase tracking-widest mb-1 opacity-70">Add to</span>
                <span className="font-black flex items-center gap-1">
                  CART
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
