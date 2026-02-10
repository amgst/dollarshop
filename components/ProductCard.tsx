
import React, { useState, useEffect } from 'react';
import { Product } from '../types';

export interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
  onAddToBundle: (product: Product) => void;
  isInBundle: boolean;
  bundleFull: boolean;
  isFavorite: boolean;
  onToggleFavorite: (productId: string) => void;
  onClick?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onAdd, 
  onAddToBundle, 
  isInBundle, 
  bundleFull, 
  isFavorite, 
  onToggleFavorite, 
  onClick
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  // Trigger animation when favorite status changes
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 600);
    return () => clearTimeout(timer);
  }, [isFavorite]);

  // Helper to fix broken legacy Drive links on the fly
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
    <div 
      onClick={() => onClick?.(product)}
      className={`bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-100 group relative cursor-pointer ${isAnimating ? 'animate-flash' : ''}`}
    >
      <div className="relative h-48 overflow-hidden">
        <img 
          src={getImageUrl(product.image)} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            // Fallback for failed images
            e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
          }}
        />
        
        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(product.id);
          }}
          className={`absolute top-2 left-2 p-2 rounded-xl backdrop-blur-md transition-all duration-300 z-10 ${
            isFavorite 
              ? 'bg-red-500 text-white shadow-lg shadow-red-200 scale-110' 
              : 'bg-white/70 text-slate-400 hover:text-red-500 hover:bg-white'
          } ${isAnimating && isFavorite ? 'animate-heart-pop' : ''}`}
        >
          <svg 
            className={`w-5 h-5 transition-transform duration-300 ${isFavorite ? 'scale-110' : 'group-hover/fav:scale-125'}`} 
            fill={isFavorite ? 'currentColor' : 'none'} 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        <div className="absolute top-2 right-2 bg-yellow-400 text-slate-900 font-extrabold px-3 py-1 rounded-full text-sm shadow-sm">
          Rs. {product.price}
        </div>
        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded-lg text-xs font-semibold text-slate-600">
          {product.category}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1 truncate">{product.name}</h3>
        <p className="text-slate-500 text-sm mb-4 line-clamp-1">{product.description}</p>
        
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdd(product);
            }}
            className="flex-1 bg-slate-900 text-white py-2 rounded-xl font-semibold hover:bg-slate-800 transition-colors text-sm shadow-sm active:scale-95"
          >
            Add Single
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToBundle(product);
            }}
            disabled={bundleFull}
            className={`px-4 py-2 rounded-xl font-bold transition-all text-sm flex items-center gap-1 ${
              bundleFull 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 active:scale-95'
            }`}
          >
            {isInBundle ? 'Add Another' : 'Bundle'}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};
