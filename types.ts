
export interface Product {
  id: string;
  name: string;
  price: number;
  category: Category;
  image: string;
  description: string;
}

export type Category = 'Snacks' | 'Stationery' | 'Houseware' | 'Gadgets' | 'Self-Care';

export interface Bundle {
  id: string;
  name: string;
  maxItems: number;
  bundlePrice: number;
  items: Product[];
}

export interface CartItem extends Product {
  quantity: number;
}

export interface StoreConfig {
  itemPrice: number;
  bundleItemCount: number;
}

export interface Order {
  id: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    city: string;
  };
  items: CartItem[];
  total: number;
  timestamp: number;
}

export interface AppState {
  cart: CartItem[];
  currentBundle: Bundle;
  isBundlerOpen: boolean;
}
