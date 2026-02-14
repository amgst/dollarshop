import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, CartItem, Bundle, Category, StoreConfig } from '../types';
import { BUNDLE_DEAL } from '../constants';
import { Header } from './Header';
import { ProductCard } from './ProductCard';
import { Bundler } from './Bundler';
import { AIConcierge } from './AIConcierge';
import { CheckoutModal } from './CheckoutModal';
import { ProductDetailsModal } from './ProductDetailsModal';

const CATEGORIES: Category[] = ['Snacks', 'Stationery', 'Houseware', 'Gadgets', 'Self-Care'];

interface ShopProps {
  allProducts: Product[];
  storeConfig: StoreConfig;
  isLocalMode: boolean;
  onPlaceOrder: (customerData: any, cart: CartItem[], total: number) => Promise<void>;
  resetMode: () => void;
}

export const Shop: React.FC<ShopProps> = ({ 
  allProducts, 
  storeConfig, 
  isLocalMode, 
  onPlaceOrder, 
  resetMode 
}) => {
  const navigate = useNavigate();
  // Shop State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('dollar-dash-favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All' | 'Favorites'>('All');
  const [isMobileBundlerOpen, setIsMobileBundlerOpen] = useState(false);

  // Derived State
  const bundlePrice = Math.floor(storeConfig.itemPrice * storeConfig.bundleItemCount * 0.9);
  
  const [activeBundle, setActiveBundle] = useState<Bundle>({
    ...BUNDLE_DEAL,
    maxItems: storeConfig.bundleItemCount,
    bundlePrice: bundlePrice,
    items: [],
  });

  // Effects
  useEffect(() => {
    setActiveBundle(prev => ({
      ...prev,
      maxItems: storeConfig.bundleItemCount,
      bundlePrice: bundlePrice
    }));
  }, [storeConfig, bundlePrice]);

  useEffect(() => {
    localStorage.setItem('dollar-dash-favorites', JSON.stringify(favorites));
  }, [favorites]);

  const productsWithCurrentPrice = useMemo(() => {
    return allProducts.map(p => ({ ...p, price: storeConfig.itemPrice }));
  }, [allProducts, storeConfig.itemPrice]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'Favorites') {
      return productsWithCurrentPrice.filter(p => favorites.includes(p.id));
    }
    return selectedCategory === 'All' 
      ? productsWithCurrentPrice 
      : productsWithCurrentPrice.filter(p => p.category === selectedCategory);
  }, [selectedCategory, favorites, productsWithCurrentPrice]);

  // Handlers
  const toggleFavorite = useCallback((productId: string) => {
    setFavorites(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  }, []);

  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const addToBundle = useCallback((product: Product) => {
    setActiveBundle(prev => {
      if (prev.items.length >= prev.maxItems) return prev;
      // Allow duplicates, just append the product
      return { ...prev, items: [...prev.items, product] };
    });
  }, []);

  const removeFromBundle = useCallback((productId: string, index?: number) => {
    setActiveBundle(prev => {
      // If index is provided, remove specifically at that index (for duplicates)
      if (typeof index === 'number') {
        const newItems = [...prev.items];
        newItems.splice(index, 1);
        return { ...prev, items: newItems };
      }
      // Fallback to removing all instances of ID (legacy behavior) or just first found
      const idx = prev.items.findIndex(i => i.id === productId);
      if (idx === -1) return prev;
      const newItems = [...prev.items];
      newItems.splice(idx, 1);
      return { ...prev, items: newItems };
    });
  }, []);

  const clearBundleItems = useCallback(() => {
    setActiveBundle(prev => ({ ...prev, items: [] }));
  }, []);

  const completeBundle = useCallback(() => {
    if (activeBundle.items.length === 0) return;
    const bundleItem: CartItem = {
      id: `bundle-${Date.now()}`,
      name: `Super Saver Bundle (${activeBundle.items.map(i => i.name).join(', ')})`,
      price: activeBundle.bundlePrice,
      category: 'Gadgets',
      image: activeBundle.items[0]?.image || '',
      description: 'Group Deal',
      quantity: 1
    };
    setCart(prev => [...prev, bundleItem]);
    setActiveBundle(prev => ({ ...prev, items: [] }));
  }, [activeBundle]);

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handlePlaceOrder = async (customerData: any) => {
    await onPlaceOrder(customerData, cart, cartTotal);
    setCart([]);
    setIsCheckoutOpen(false);
  };

  return (
    <div className="min-h-screen pb-20">
      <Header 
        itemCount={cartItemCount} 
        onCartClick={() => setIsCartOpen(true)} 
        favoritesCount={favorites.length}
        onFavoritesClick={() => setSelectedCategory('Favorites')}
        currentView="shop"
        onViewChange={(view) => {
          if (view === 'admin') {navigate('/admin');}
          if (view === 'shop') {
             window.scrollTo({ top: 0, behavior: 'smooth' });
             navigate('/');
          }
        }}
      />

      {isLocalMode && (
        <div className="bg-amber-100 text-amber-900 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-center sticky top-16 z-30 shadow-sm border-b border-amber-200 flex items-center justify-center gap-4">
          <span>Cloud Offline: Local Persistence Active</span>
          <button 
            onClick={resetMode}
            className="bg-amber-900 text-white px-2 py-0.5 rounded hover:bg-black transition-colors"
          >
            Retry Cloud Sync
          </button>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8 mt-16">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">
          <div className="flex-1">
            <div className="mb-10 text-center lg:text-left">
              <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight mb-4">
                Everything <span className="text-emerald-600">Rs. {storeConfig.itemPrice}</span>. 
              </h1>
              <p className="text-slate-500 text-lg max-w-2xl">
                {isLocalMode ? 'Running in local sandbox mode due to Firebase connection limits.' : 'Premium budget shop synced with the cloud.'} All items exactly Rs. {storeConfig.itemPrice}.
              </p>
            </div>

            <div 
              className="flex overflow-x-auto lg:flex-wrap gap-2 mb-8 pb-4 -mx-2 px-2 lg:mx-0 lg:px-0 lg:pb-0 snap-x [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <button
                onClick={() => setSelectedCategory('All')}
                className={`px-6 py-2 rounded-full font-semibold transition-all shadow-sm whitespace-nowrap snap-start flex-shrink-0 ${
                  selectedCategory === 'All' ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                All
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-2 rounded-full font-semibold transition-all shadow-sm whitespace-nowrap snap-start flex-shrink-0 ${
                    selectedCategory === cat ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={addToCart}
                  onAddToBundle={addToBundle}
                  isInBundle={!!activeBundle.items.find(i => i.id === product.id)}
                  bundleFull={activeBundle.items.length >= activeBundle.maxItems}
                  isFavorite={favorites.includes(product.id)}
                  onToggleFavorite={toggleFavorite}
                  onClick={(p) => {
                    setSelectedProduct(p);
                    setIsProductModalOpen(true);
                  }}
                />
              ))}
            </div>
          </div>

          <aside className="w-full lg:w-96 space-y-8 lg:sticky lg:top-24 h-fit hidden lg:block">
            <Bundler 
              bundle={activeBundle} 
              onRemove={removeFromBundle} 
              onComplete={completeBundle}
              onClear={clearBundleItems}
            />
            <AIConcierge 
              availableProducts={productsWithCurrentPrice}
              onSuggest={(products) => {
                setActiveBundle(prev => ({ ...prev, items: products.slice(0, activeBundle.maxItems) }));
              }} 
              bundleMaxItems={activeBundle.maxItems}
              bundlePrice={activeBundle.bundlePrice}
            />
          </aside>
        </div>
      </main>

      {/* Mobile Floating Bundle Bar (Mini Player Style) */}
      {activeBundle.items.length > 0 && (
        <>
          <div className="lg:hidden fixed bottom-6 left-4 right-4 z-30 animate-slide-up">
            <button 
              onClick={() => setIsMobileBundlerOpen(true)}
              className="w-full bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-slate-700/50 group hover:scale-[1.02] transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-emerald-900/50">
                    {activeBundle.items.length}
                  </div>
                  {activeBundle.items.length >= activeBundle.maxItems && (
                     <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-slate-900 animate-bounce" />
                  )}
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Bundle Savings</span>
                  <div className="font-medium text-slate-300 text-sm">
                    {activeBundle.items.length >= activeBundle.maxItems ? 'Bundle Complete!' : `${activeBundle.maxItems - activeBundle.items.length} more to save`}
                  </div>
                </div>
              </div>
              <div className="bg-slate-800 p-2 rounded-xl group-hover:bg-slate-700 transition-colors">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
              </div>
            </button>
          </div>

          {/* Mobile Bottom Sheet Modal */}
          {isMobileBundlerOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileBundlerOpen(false)} />
              <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto">
                <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-900">Your Bundle</h2>
                  <button 
                    onClick={() => setIsMobileBundlerOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="p-6 space-y-8 pb-24">
                  <Bundler 
                    bundle={activeBundle} 
                    onRemove={removeFromBundle} 
                    onComplete={() => {
                      completeBundle();
                      setIsMobileBundlerOpen(false);
                    }}
                    onClear={clearBundleItems}
                  />
                  <AIConcierge 
                    availableProducts={productsWithCurrentPrice}
                    onSuggest={(products) => {
                      setActiveBundle(prev => ({ ...prev, items: products.slice(0, activeBundle.maxItems) }));
                    }} 
                    bundleMaxItems={activeBundle.maxItems}
                    bundlePrice={activeBundle.bundlePrice}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-2xl font-bold">Your Cart</h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <svg className="w-20 h-20 mb-4 opacity-10" fill="currentColor" viewBox="0 0 24 24"><path d="M7,18c-1.1,0-1.99,0.9-1.99,2S5.9,22,7,22s2-0.9,2-2S8.1,18,7,18z M17,18c-1.1,0-1.99,0.9-1.99,2s0.89,2,1.99,2s2-0.9,2-2 S18.1,18,17,18z M7.17,14.75l0.03-0.12L8.1,13h7.45c0.75,0,1.41-0.41,1.75-1.03l3.58-6.49c0.37-0.66-0.11-1.48-0.87-1.48H5.21 L4.27,2H1V4h2l3.6,7.59l-1.35,2.44C4.52,15.37,5.48,17,7,17h12v-2H7.17z"/></svg>
                    <p className="font-bold">Cart is empty</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex gap-4 p-3 bg-slate-50 rounded-2xl">
                      <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-xl" />
                      <div className="flex-1">
                        <h4 className="font-bold text-sm leading-tight">{item.name}</h4>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-slate-500">Qty: {item.quantity}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="font-bold text-slate-900">Rs. {item.price * item.quantity}</span>
                         <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                           <button onClick={() => {
                             const newCart = cart.map(i => i.id === item.id ? { ...i, quantity: Math.max(0, i.quantity - 1) } : i).filter(i => i.quantity > 0);
                             setCart(newCart);
                           }} className="w-6 h-6 flex items-center justify-center hover:bg-white rounded shadow-sm">-</button>
                           <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                           <button onClick={() => {
                             const newCart = cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
                             setCart(newCart);
                           }} className="w-6 h-6 flex items-center justify-center hover:bg-white rounded shadow-sm">+</button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-6 border-t bg-slate-50">
                <div className="flex justify-between mb-4 text-lg font-bold">
                  <span>Total</span>
                  <span>Rs. {cart.reduce((sum, item) => sum + item.price * item.quantity, 0)}</span>
                </div>
                <button 
                  onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
                  disabled={cart.length === 0}
                  className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-lg shadow-slate-200"
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ProductDetailsModal 
        product={selectedProduct}
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onAddToCart={addToCart}
        onAddToBundle={addToBundle}
      />
      
      <CheckoutModal 
        isOpen={isCheckoutOpen}
        total={cartTotal}
        onClose={() => setIsCheckoutOpen(false)}
        onPlaceOrder={handlePlaceOrder}
      />
    </div>
  );
};
