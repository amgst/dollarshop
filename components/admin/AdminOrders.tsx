import React from 'react';
import { Order } from '../../types';

interface AdminOrdersProps {
  orders: Order[];
  onClearOrders: () => void;
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({ orders, onClearOrders }) => {
  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900">Orders</h1>
        {orders.length > 0 && (
          <button 
            onClick={onClearOrders}
            className="text-red-500 hover:text-red-700 font-bold text-sm underline"
          >
            Clear All History
          </button>
        )}
      </div>

      <div className="grid gap-6">
        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <h3 className="font-bold text-slate-900">No Orders Yet</h3>
            <p className="text-slate-500 text-sm mt-1">New orders will appear here instantly.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-slate-50 px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <span className="bg-slate-200 text-slate-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                    #{order.id.slice(-6)}
                  </span>
                  <span className="text-sm font-bold text-slate-500">
                    {formatDate(order.timestamp)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total</span>
                  <span className="text-xl font-black text-emerald-600">Rs. {order.total}</span>
                </div>
              </div>
              
              <div className="p-6 grid md:grid-cols-2 gap-8">
                <div>
                  <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Customer Details</h5>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 text-lg">{order.customer.name}</p>
                    <p className="text-slate-600 font-medium">{order.customer.phone}</p>
                    <div className="flex items-start gap-2 mt-2">
                      <svg className="w-4 h-4 text-slate-400 mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {order.customer.address}<br/>
                        <span className="text-slate-400">{order.customer.city}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Order Items</h5>
                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                            {item.quantity}x
                          </div>
                          <span className="font-medium text-slate-700">{item.name}</span>
                        </div>
                        <span className="font-bold text-slate-900">Rs. {item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
