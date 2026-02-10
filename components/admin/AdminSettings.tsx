import React, { useState } from 'react';
import { StoreConfig } from '../../types';
import { initGoogleDriveAuth } from '../../services/googleDriveService';

interface AdminSettingsProps {
  config: StoreConfig;
  onUpdateConfig: (config: StoreConfig) => Promise<void>;
  gDriveToken: string | null;
  setGDriveToken: (token: string | null) => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  config,
  onUpdateConfig,
  gDriveToken,
  setGDriveToken
}) => {
  const [priceInput, setPriceInput] = useState(config.itemPrice.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePriceUpdate = async () => {
    const newPrice = parseInt(priceInput);
    if (isNaN(newPrice) || newPrice < 0) return;
    setIsSubmitting(true);
    try {
      await onUpdateConfig({ ...config, itemPrice: newPrice });
      alert('Store configuration updated!');
    } catch (e) {
      alert('Failed to update configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConnectDrive = () => {
    const client = initGoogleDriveAuth((token, expiresIn) => {
      setGDriveToken(token);
      
      const expiryTime = Date.now() + (expiresIn * 1000); 
      localStorage.setItem('gdrive_token', token);
      localStorage.setItem('gdrive_token_expiry', expiryTime.toString());

      alert('Google Drive Connected Successfully!');
    });
    // @ts-ignore
    client.requestAccessToken();
  };

  const handleDisconnectDrive = () => {
    setGDriveToken(null);
    localStorage.removeItem('gdrive_token');
    localStorage.removeItem('gdrive_token_expiry');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black text-slate-900">Settings</h1>
      </div>

      {/* Google Drive Connection Card */}
      <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Google Drive Integration</h3>
            <p className="text-slate-500 text-sm leading-relaxed max-w-lg">
              Connect your Google Drive to upload and manage product images directly. 
              This connection is required to add new products with images.
            </p>
          </div>
          <div className="shrink-0">
            {gDriveToken ? (
              <div className="flex flex-col items-end gap-2">
                <span className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1.5 rounded-full">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/>
                  Connected
                </span>
                <button 
                  onClick={handleDisconnectDrive}
                  className="text-xs font-bold text-red-500 hover:text-red-600 underline"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button 
                onClick={handleConnectDrive}
                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.01 1.99c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-2-5.5l6-4-6-4v8z"/></svg>
                Connect Drive
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Store Configuration Card */}
      <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Store Configuration</h3>
        
        <div className="grid gap-6 max-w-md">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Global Item Price (Rs.)
            </label>
            <div className="flex gap-2">
              <input 
                type="number" 
                value={priceInput} 
                onChange={(e) => setPriceInput(e.target.value)} 
                className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500" 
              />
              <button 
                onClick={handlePriceUpdate} 
                disabled={isSubmitting} 
                className="bg-emerald-600 text-white px-6 rounded-xl font-bold text-sm disabled:opacity-50 hover:bg-emerald-700 transition-colors"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              This will update the price for ALL items in the store immediately.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
