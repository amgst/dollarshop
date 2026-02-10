import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  orderBy,
  updateDoc
} from "firebase/firestore";
import { getToken, onMessage } from "firebase/messaging";
import { db, messaging } from './firebase';
import { Product, StoreConfig, Order, CartItem } from './types';
import { PRODUCTS as LOCAL_PRODUCTS } from './constants';
import { AdminPanel } from './components/AdminPanel';
import { Shop } from './components/Shop';
import { AdminLogin } from './components/AdminLogin';

function App() {
  const [loading, setLoading] = useState(true);
  const [isLocalMode, setIsLocalMode] = useState(() => {
    return localStorage.getItem('dollardash-mode') === 'local';
  });
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  
  // Data States
  const [storeConfig, setStoreConfig] = useState<StoreConfig>({ 
    itemPrice: 100, 
    bundleItemCount: 6 
  });
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Firebase Messaging Init
  useEffect(() => {
    const requestPermission = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Notification permission granted.');
          const token = await getToken(messaging, { 
            vapidKey: 'BGIQBywiCHAQAR3E5Qgoy2NgF3HsYgqNsHquANEwhMGEoNnVp6pPVyKoAMyywNR9QwzNWnK2gd0MRrQoZ2nZHsw' 
          });
          if (token) {
            console.log('FCM Token:', token);
          }
        }
      } catch (err) {
        console.log('An error occurred while retrieving token. ', err);
      }
    };

    requestPermission();

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received. ', payload);
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

  // Sync local data if in local mode
  useEffect(() => {
    if (isLocalMode) {
      localStorage.setItem('dollardash-local-products', JSON.stringify(allProducts));
      localStorage.setItem('dollardash-local-orders', JSON.stringify(orders));
      localStorage.setItem('dollardash-local-config', JSON.stringify(storeConfig));
    }
  }, [isLocalMode, allProducts, orders, storeConfig]);

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

  const placeOrder = async (customerData: any, cart: CartItem[], total: number) => {
    const newOrder = {
      customer: customerData,
      items: cart,
      total: total,
      timestamp: Date.now(),
    };
    if (isLocalMode) {
      setOrders(o => [{ id: `LOCAL-${Date.now()}`, ...newOrder } as Order, ...o]);
      return;
    }
    await addDoc(collection(db, "orders"), newOrder);
  };

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
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            <Shop 
              allProducts={allProducts} 
              storeConfig={storeConfig} 
              isLocalMode={isLocalMode} 
              onPlaceOrder={placeOrder} 
              resetMode={resetMode} 
            />
          } 
        />
        <Route 
          path="/admin" 
          element={
            isAdminAuthenticated ? (
              <AdminPanel 
                products={allProducts} 
                config={storeConfig} 
                orders={orders} 
                onAddProduct={addProduct} 
                onDeleteProduct={removeProduct} 
                onUpdateProduct={updateProduct}
                onUpdateConfig={updateStoreConfig} 
                onClearOrders={() => setOrders([])} 
              />
            ) : (
              <AdminLogin onLogin={() => setIsAdminAuthenticated(true)} />
            )
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
