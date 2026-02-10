
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from "firebase/firestore";
import { getToken, onMessage } from "firebase/messaging";
import { db, messaging } from './firebase';
import { Product, CartItem, Bundle, Category, StoreConfig, Order } from './types';
import { BUNDLE_DEAL, PRODUCTS as LOCAL_PRODUCTS } from './constants';
import { Header } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { Bundler } from './components/Bundler';
import { AIConcierge } from './components/AIConcierge';
import { AdminPanel } from './components/AdminPanel';
import { CheckoutModal } from './components/CheckoutModal';
import { ProductDetailsModal } from './components/ProductDetailsModal';

const CATEGORIES: Category[] = ['Snacks', 'Stationery', 'Houseware', 'Gadgets', 'Self-Care'];

function App() {
  const [view, setView] = useState<'shop' | 'admin'>('shop');
  const [loading, setLoading] = useState(true);
  const [isLocalMode, setIsLocalMode] = useState(() => {
    return localStorage.getItem('dollardash-mode') === 'local';
  });
  
  // States
  const [storeConfig, setStoreConfig] = useState<StoreConfig>({ 
    itemPrice: 100, 
    bundleItemCount: 6 
  });
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('dollar-dash-favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Calculate dynamic bundle price
  const bundlePrice = Math.floor(storeConfig.itemPrice * storeConfig.bundleItemCount * 0.9);

  const [activeBundle, setActiveBundle] = useState<Bundle>({
    ...BUNDLE_DEAL,
    maxItems: storeConfig.bundleItemCount,
    bundlePrice: bundlePrice,
    items: [],
  });

  const [selectedCategory, setSelectedCategory] = useState<Category | 'All' | 'Favorites'>('All');

  // Firebase Messaging Init
  useEffect(() => {
    const requestPermission = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Notification permission granted.');
          // TODO: Replace with your VAPID key from Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates
          const token = await getToken(messaging, { 
            vapidKey: 'BGIQBywiCHAQAR3E5Qgoy2NgF3HsYgqNsHquANEwhMGEoNnVp6pPVyKoAMyywNR9QwzNWnK2gd0MRrQoZ2nZHsw' 
          });
          if (token) {
            console.log('FCM Token:', token);
            // You would typically send this token to your server to subscribe the user
          }
        }
      } catch (err) {
        console.log('An error occurred while retrieving token. ', err);
      }
    };

    requestPermission();

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received. ', payload);
      // Customize notification here or show a toast
      alert(`New Message: ${payload.notification?.title} - ${payload.notification?.body}`);
    });

    return () => unsubscribe();
  }, []);

  // Firebase Subscriptions with Seamless Local Fallback
  useEffect(() => {
    if (isLocalMode) {
      const localInventory = JSON.parse(localStorage.getItem('dollardash-local-products') || 'null') || LOCAL_PRODUCTS;
      const localOrders = JSON.parse(localStorage.getItem('dollardash-local-orders') || '[]');
      const localConfig = JSON.parse(localStorage.getItem('dollardash-local-config') || 'null') || { itemPrice: 100, bundleItemCount: 6 };
      
      setAllProducts(localInventory);
      setOrders(localOrders);
      setStoreConfig(localConfig);
      setLoading(false);
      return;
    }

    const handleError = (err: any) => {
      console.warn("Firebase Sync Error (Switching to Local Mode):", err.message);
      // Auto-switch to local mode if Firebase fails (usually due to permissions or missing config)
      setIsLocalMode(true);
      localStorage.setItem('dollardash-mode', 'local');
      setLoading(false);
    };

    const unsubConfig = onSnapshot(doc(db, "settings", "store"), (doc) => {
      if (doc.exists()) {
        setStoreConfig(doc.data() as StoreConfig);
      } else {
        setDoc(doc.ref, { itemPrice: 100, bundleItemCount: 6 }).catch(handleError);
      }
    }, handleError);

    const unsubProducts = onSnapshot(query(collection(db, "products")), (snapshot) => {
      const prods = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      setAllProducts(prods.length > 0 ? prods : LOCAL_PRODUCTS);
      setLoading(false);
    }, handleError);

    const unsubOrders = onSnapshot(query(collection(db, "orders"), orderBy("timestamp", "desc")), (snapshot) => {
      const ords = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      setOrders(ords);
    }, handleError);

    return () => {
      unsubConfig();
      unsubProducts();
      unsubOrders();
    };
  }, [isLocalMode]);

  // Update bundle local state when config changes
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

  // Sync local data if in local mode
  useEffect(() => {
    if (isLocalMode) {
      localStorage.setItem('dollardash-local-products', JSON.stringify(allProducts));
      localStorage.setItem('dollardash-local-orders', JSON.stringify(orders));
      localStorage.setItem('dollardash-local-config', JSON.stringify(storeConfig));
    }
  }, [isLocalMode, allProducts, orders, storeConfig]);

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
      if (prev.items.find(i => i.id === product.id)) return prev;
      return { ...prev, items: [...prev.items, product] };
    });
  }, []);

  const removeFromBundle = useCallback((productId: string) => {
    setActiveBundle(prev => ({ ...prev, items: prev.items.filter(i => i.id !== productId) }));
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

  const addProduct = async (product: Omit<Product, 'id'>) => {
    if (isLocalMode) {
      const newP = { ...product, id: Date.now().toString() } as Product;
      setAllProducts(p => [newP, ...p]);
      return;
    }
    await addDoc(collection(db, "products"), product);
  };

  const removeProduct = async (productId: string) => {
    if (isLocalMode) {
      setAllProducts(p => p.filter(i => i.id !== productId));
      return;
    }
    await deleteDoc(doc(db, "products", productId));
  };

  const updateProduct = async (product: Product) => {
    if (isLocalMode) {
      setAllProducts(p => p.map(i => i.id === product.id ? product : i));
      return;
    }
    const { id, ...data } = product;
    await updateDoc(doc(db, "products", id), data);
  };

  const updateStoreConfig = async (newConfig: StoreConfig) => {
    if (isLocalMode) {
      setStoreConfig(newConfig);
      return;
    }
    await setDoc(doc(db, "settings", "store"), newConfig);
  };

  const placeOrder = async (customerData: any) => {
    const newOrder = {
      customer: customerData,
      items: cart,
      total: cartTotal,
      timestamp: Date.now(),
    };
    if (isLocalMode) {
      setOrders(o => [{ id: `LOCAL-${Date.now()}`, ...newOrder } as Order, ...o]);
      return;
    }
    await addDoc(collection(db, "orders"), newOrder);
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const resetMode = () => {
    localStorage.removeItem('dollardash-mode');
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse">Initializing Dash...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Header 
        itemCount={cartItemCount} 
        onCartClick={() => setIsCartOpen(true)} 
        currentView={view}
        onViewChange={setView}
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
        {view === 'admin' ? (
          <AdminPanel 
            products={productsWithCurrentPrice} 
            config={storeConfig} 
            orders={orders} 
            onAddProduct={addProduct} 
            onDeleteProduct={removeProduct} 
            onUpdateProduct={updateProduct}
            onUpdateConfig={updateStoreConfig} 
            onClearOrders={() => setOrders([])} 
          />
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <div className="mb-10 text-center lg:text-left">
                <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight mb-4">
                  Everything <span className="text-emerald-600">Rs. {storeConfig.itemPrice}</span>. 
                </h1>
                <p className="text-slate-500 text-lg max-w-2xl">
                  {isLocalMode ? 'Running in local sandbox mode due to Firebase connection limits.' : 'Premium budget shop synced with the cloud.'} All items exactly Rs. {storeConfig.itemPrice}.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 mb-8 justify-center lg:justify-start">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`px-6 py-2 rounded-full font-semibold transition-all shadow-sm ${
                    selectedCategory === 'All' ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedCategory('Favorites')}
                  className={`px-6 py-2 rounded-full font-semibold transition-all shadow-sm flex items-center gap-2 ${
                    selectedCategory === 'Favorites' ? 'bg-red-500 text-white shadow-red-200' : 'bg-white text-slate-600 hover:bg-red-50'
                  }`}
                >
                  <svg className="w-4 h-4" fill={selectedCategory === 'Favorites' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  Favorites ({favorites.length})
                </button>
                <div className="w-px h-8 bg-slate-200 mx-2 hidden sm:block" />
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-6 py-2 rounded-full font-semibold transition-all shadow-sm ${
                      selectedCategory === cat ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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

            <aside className="w-full lg:w-96 space-y-8 lg:sticky lg:top-24 h-fit">
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
        )}
      </main>

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
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        total={cartTotal}
        onPlaceOrder={placeOrder}
      />
    </div>
  );
}

export default App;