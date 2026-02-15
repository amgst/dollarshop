import React, { useState } from 'react';
import { Product, StoreConfig, Order, CategoryConfig } from '../types';
import { AdminLayout, AdminView } from './admin/AdminLayout';
import { AdminProducts } from './admin/AdminProducts';
import { AdminCategories } from './admin/AdminCategories';
import { AdminOrders } from './admin/AdminOrders';
import { AdminSettings } from './admin/AdminSettings';

interface AdminPanelProps {
  products: Product[];
  categories: CategoryConfig[];
  config: StoreConfig;
  orders: Order[];
  onAddProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onUpdateProduct: (product: Product) => Promise<void>;
  onAddCategory: (name: string) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onUpdateConfig: (config: StoreConfig) => Promise<void>;
  onClearOrders: () => void;
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  products,
  categories,
  config,
  orders,
  onAddProduct,
  onDeleteProduct,
  onUpdateProduct,
  onAddCategory,
  onDeleteCategory,
  onUpdateConfig,
  onClearOrders,
  onLogout
}) => {
  const [currentView, setCurrentView] = useState<AdminView>('products');
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

  return (
    <AdminLayout currentView={currentView} onViewChange={setCurrentView} onLogout={onLogout}>
      {currentView === 'products' && (
        <AdminProducts
          products={products}
          categories={categories}
          gDriveToken={gDriveToken}
          itemPrice={config.itemPrice}
          onAddProduct={onAddProduct}
          onUpdateProduct={onUpdateProduct}
          onDeleteProduct={onDeleteProduct}
          onNavigateToSettings={() => setCurrentView('settings')}
        />
      )}

      {currentView === 'categories' && (
        <AdminCategories
          categories={categories}
          onAddCategory={onAddCategory}
          onDeleteCategory={onDeleteCategory}
        />
      )}

      {currentView === 'orders' && (
        <AdminOrders
          orders={orders}
          onClearOrders={onClearOrders}
        />
      )}

      {currentView === 'settings' && (
        <AdminSettings
          config={config}
          onUpdateConfig={onUpdateConfig}
          gDriveToken={gDriveToken}
          setGDriveToken={setGDriveToken}
        />
      )}
    </AdminLayout>
  );
};
