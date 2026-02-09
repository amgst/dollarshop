
import { Product } from './types';

export const PRODUCTS: Product[] = [
  { id: '1', name: 'Crunchy Corn Chips', price: 100, category: 'Snacks', image: 'https://picsum.photos/seed/snack1/400/300', description: 'Savory and spicy corn chips.' },
  { id: '2', name: 'Neon Gel Pens (3pk)', price: 100, category: 'Stationery', image: 'https://picsum.photos/seed/pen1/400/300', description: 'Smooth writing in vibrant colors.' },
  { id: '3', name: 'Ceramic Mini Planter', price: 100, category: 'Houseware', image: 'https://picsum.photos/seed/house1/400/300', description: 'Perfect for small succulents.' },
  { id: '4', name: 'USB LED Light', price: 100, category: 'Gadgets', image: 'https://picsum.photos/seed/gadget1/400/300', description: 'Brighten your workspace anywhere.' },
  { id: '5', name: 'Charcoal Face Mask', price: 100, category: 'Self-Care', image: 'https://picsum.photos/seed/care1/400/300', description: 'Deep cleaning for glowing skin.' },
  { id: '6', name: 'Sour Gummy Worms', price: 100, category: 'Snacks', image: 'https://picsum.photos/seed/snack2/400/300', description: 'Tangy and chewy treats.' },
  { id: '7', name: 'Washi Tape Set', price: 100, category: 'Stationery', image: 'https://picsum.photos/seed/stationery2/400/300', description: 'Decorative tapes for journaling.' },
  { id: '8', name: 'Microfiber Cloth', price: 100, category: 'Houseware', image: 'https://picsum.photos/seed/house2/400/300', description: 'Ultra-absorbent cleaning cloth.' },
  { id: '9', name: 'Phone Kickstand', price: 100, category: 'Gadgets', image: 'https://picsum.photos/seed/gadget2/400/300', description: 'Sturdy support for all smartphones.' },
  { id: '10', name: 'Scented Candle', price: 100, category: 'Self-Care', image: 'https://picsum.photos/seed/care2/400/300', description: 'Lavender scent for relaxation.' },
  { id: '11', name: 'Roasted Almonds', price: 100, category: 'Snacks', image: 'https://picsum.photos/seed/snack3/400/300', description: 'Nutritious and lightly salted.' },
  { id: '12', name: 'Memo Pad Cube', price: 100, category: 'Stationery', image: 'https://picsum.photos/seed/stationery3/400/300', description: 'Colorful squares for quick notes.' },
];

export const BUNDLE_DEAL = {
  id: 'super-saver',
  name: 'Super Saver Bundle',
  maxItems: 6,
  bundlePrice: 500, // 6 items for Rs. 500
};
