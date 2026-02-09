
import React, { useState } from 'react';
import { getAIBundleSuggestions } from '../services/geminiService';
import { Product } from '../types';

interface AIConciergeProps {
  onSuggest: (products: Product[]) => void;
  availableProducts: Product[];
  bundleMaxItems: number;
  bundlePrice: number;
}

export const AIConcierge: React.FC<AIConciergeProps> = ({ 
  onSuggest, 
  availableProducts,
  bundleMaxItems,
  bundlePrice
}) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState('');

  const handleConsult = async () => {
    if (!input.trim() || availableProducts.length === 0) return;
    setLoading(true);
    setExplanation('');
    
    try {
      const result = await getAIBundleSuggestions(input, availableProducts, bundleMaxItems, bundlePrice);
      if (result && result.recommendedIds) {
        const suggestedProducts = availableProducts.filter(p => result.recommendedIds.includes(p.id));
        onSuggest(suggestedProducts);
        setExplanation(result.explanation);
      }
    } catch (error) {
      console.error("AI Concierge error:", error);
      setExplanation("I couldn't whip up a bundle right now. Mind trying another prompt?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-white/20 p-2 rounded-xl">
            <svg className="w-6 h-6 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold">AI Concierge</h2>
        </div>

        <p className="text-indigo-100 text-sm mb-4">
          Describe the occasion and I'll curate your Rs. {bundlePrice} bundle!
        </p>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your vibe..."
            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleConsult()}
          />
          <button
            onClick={handleConsult}
            disabled={loading || availableProducts.length === 0}
            className="bg-white text-indigo-700 font-bold px-4 py-2 rounded-xl hover:bg-indigo-50 transition-all disabled:opacity-50 min-w-[64px] flex items-center justify-center text-sm shadow-lg shadow-indigo-900/20 active:scale-95"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-indigo-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : 'Go'}
          </button>
        </div>

        {explanation && (
          <div className="mt-4 bg-white/15 rounded-2xl p-4 text-sm animate-fade-in border border-white/10 shadow-inner group transition-all hover:bg-white/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-indigo-300 font-extrabold uppercase tracking-widest text-[10px]">Concierge Insights</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <p className="text-indigo-50 leading-relaxed font-medium italic">
              "{explanation}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
