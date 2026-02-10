
import React from 'react';
import { Bundle, Product } from '../types';

interface BundlerProps {
  bundle: Bundle;
  onRemove: (productId: string, index?: number) => void;
  onComplete: () => void;
  onClear: () => void;
}

export const Bundler: React.FC<BundlerProps> = ({ bundle, onRemove, onComplete, onClear }) => {
  const progress = (bundle.items.length / bundle.maxItems) * 100;
  const isFull = bundle.items.length === bundle.maxItems;
  const hasItems = bundle.items.length > 0;

  // Helper to fix broken legacy Drive links
  const getImageUrl = (url: string) => {
    if (url.includes('drive.google.com/uc?export=view&id=')) {
      const id = url.split('id=')[1];
      return `https://lh3.googleusercontent.com/d/${id}`;
    }
    return url;
  };

  return (
    <div className="bg-emerald-600 text-white rounded-3xl p-6 shadow-2xl relative overflow-hidden border border-emerald-500/50">
      {/* Background patterns */}
      <div className="absolute top-0 right-0 p-4 opacity-10 select-none pointer-events-none">
        <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20,6H16V4c0-1.1-0.9-2-2-2H10C8.9,2,8,2.9,8,4v2H4C2.9,6,2,6.9,2,8v10c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V8C22,6.9,21.1,6,20,6z M10,4h4v2h-4V4z"/>
        </svg>
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black tracking-tight">Saver Bundler</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-white/20 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">Deal</span>
              <p className="text-emerald-100 text-sm font-bold">{bundle.maxItems} items for Rs. {bundle.bundlePrice}</p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-2xl flex flex-col items-center transition-all duration-300 ${
            isFull ? 'bg-yellow-400 text-slate-900 scale-105 shadow-lg' : 'bg-white/10 text-white'
          }`}>
            <span className="text-xs font-bold uppercase opacity-60">Status</span>
            <span className="text-lg font-black leading-none">{bundle.items.length}/{bundle.maxItems}</span>
          </div>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="relative w-full bg-emerald-800/40 rounded-full h-5 mb-8 p-1 shadow-inner overflow-hidden border border-emerald-400/20">
          <div 
            className={`h-full rounded-full transition-all duration-700 relative overflow-hidden shadow-[0_0_10px_rgba(52,211,153,0.3)] ${
              isFull ? 'bg-gradient-to-r from-green-400 via-emerald-300 to-green-400 animate-pulse-soft' : 'bg-gradient-to-r from-green-500 via-emerald-400 to-green-300'
            }`}
            style={{ 
              width: `${progress}%`,
              transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {/* Shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {[...Array(bundle.maxItems)].map((_, i) => {
            const item = bundle.items[i];
            return (
              <div 
                key={i} 
                className={`aspect-square rounded-2xl border-2 border-dashed flex items-center justify-center relative group transition-all duration-300 ${
                  item ? 'bg-white border-transparent scale-100 rotate-0 shadow-lg' : 'border-emerald-400/50 bg-emerald-700/30 scale-95 hover:scale-100'
                }`}
              >
                {item ? (
                  <>
                    <img 
                      src={getImageUrl(item.image)} 
                      alt={item.name} 
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/100?text=Error';
                      }}
                    />
                    <button 
                      onClick={() => onRemove(item.id, i)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 active:scale-90"
                      title="Remove from bundle"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <span className="text-emerald-400/40 font-black text-2xl">{i + 1}</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          <button
            disabled={!isFull}
            onClick={onComplete}
            className={`w-full py-4 rounded-2xl font-black text-lg shadow-xl transition-all duration-300 relative overflow-hidden group/btn ${
              isFull 
                ? 'bg-yellow-400 text-slate-900 hover:scale-[1.02] hover:shadow-yellow-400/20 active:scale-95 cursor-pointer' 
                : 'bg-emerald-700 text-emerald-400/50 cursor-not-allowed border border-emerald-500/20'
            }`}
          >
            {isFull ? (
              <>
                <div className="relative z-10 flex items-center justify-center gap-2">
                  <span>ADD BUNDLE</span>
                  <span className="bg-slate-900 text-white px-3 py-1 rounded-full text-sm">Rs. {bundle.bundlePrice}</span>
                </div>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
              </>
            ) : (
              `NEED ${bundle.maxItems - bundle.items.length} MORE`
            )}
          </button>

          {hasItems && (
            <button
              onClick={onClear}
              className="w-full py-2 text-emerald-200 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear Bundle
            </button>
          )}
        </div>

        <p className="text-center text-[10px] mt-4 font-bold text-emerald-200 uppercase tracking-widest">
          Enjoy a 10% discount on every bundle!
        </p>
      </div>
    </div>
  );
};
