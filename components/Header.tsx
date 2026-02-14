
import React from 'react';

interface HeaderProps {
  itemCount: number;
  onCartClick: () => void;
  favoritesCount?: number;
  onFavoritesClick?: () => void;
  currentView: 'shop' | 'admin';
  onViewChange: (view: 'shop' | 'admin') => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  itemCount, 
  onCartClick, 
  favoritesCount = 0,
  onFavoritesClick,
  currentView, 
  onViewChange 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-40 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onViewChange('shop')}>
          <div className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-200">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <span className="text-xl font-black tracking-tighter text-slate-900">
            DOLLAR<span className="text-emerald-600">DASH</span>
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 font-semibold text-slate-500">
          <button 
            onClick={() => onViewChange('shop')}
            className={`hover:text-emerald-600 transition-colors ${currentView === 'shop' ? 'text-emerald-600 underline decoration-2 underline-offset-4' : ''}`}
          >
            Shop
          </button>
          <button 
            onClick={() => onViewChange('admin')}
            className={`hover:text-emerald-600 transition-colors ${currentView === 'admin' ? 'text-emerald-600 underline decoration-2 underline-offset-4' : ''}`}
          >
            Manage Store
          </button>
        </nav>

        <div className="flex items-center gap-3">
          {currentView === 'shop' && (
            <>
              {onFavoritesClick && (
                <button 
                  onClick={onFavoritesClick}
                  className="relative bg-white text-slate-400 p-3 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all active:scale-95 group border border-slate-100"
                >
                  <svg className="w-6 h-6" fill={favoritesCount > 0 ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {favoritesCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-bounce">
                      {favoritesCount}
                    </span>
                  )}
                </button>
              )}
              
              <button 
                onClick={onCartClick}
                className="relative bg-slate-100 p-3 rounded-2xl hover:bg-slate-200 transition-all active:scale-95 group"
              >
              <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-bounce">
                  {itemCount}
                </span>
              )}
            </button>
          </>
          )}
          
          <button 
            onClick={() => onViewChange(currentView === 'shop' ? 'admin' : 'shop')}
            className="hidden md:flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-95"
          >
            {currentView === 'shop' ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                Admin Access
              </>
            ) : (
              'Exit Admin'
            )}
          </button>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-white z-50 p-6 flex flex-col gap-6 animate-fade-in">
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => { onViewChange('shop'); setIsMobileMenuOpen(false); }}
              className={`text-left text-lg font-bold p-4 rounded-2xl transition-all ${
                currentView === 'shop' 
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              🛍️ Shop
            </button>
            <button 
              onClick={() => { onViewChange('admin'); setIsMobileMenuOpen(false); }}
              className={`text-left text-lg font-bold p-4 rounded-2xl transition-all ${
                currentView === 'admin' 
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              🔧 Manage Store
            </button>
          </div>
          
          <div className="mt-auto mb-8">
             <button 
              onClick={() => { onViewChange(currentView === 'shop' ? 'admin' : 'shop'); setIsMobileMenuOpen(false); }}
              className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white px-6 py-4 rounded-2xl text-lg font-bold shadow-xl active:scale-95 transition-all"
            >
              {currentView === 'shop' ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                  Switch to Admin
                </>
              ) : (
                'Exit Admin Mode'
              )}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
