
import React, { useState, useEffect } from 'react';
import { DEFAULT_CONFIG } from './constants';
import { AppConfig, Step, CheckoutOption, Photo, AccessRecord } from './types';
import { AuthStep } from './components/AuthStep';
import { GalleryStep } from './components/GalleryStep';
import { CheckoutStep } from './components/CheckoutStep';
import { SuccessStep } from './components/SuccessStep';
import { AdminPanel } from './components/AdminPanel';
import { Settings } from 'lucide-react';

const App: React.FC = () => {
  // Global State
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [currentStep, setCurrentStep] = useState<Step>('AUTH');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  
  // Session Data
  const [userEmail, setUserEmail] = useState<string>('');
  const [checkoutTotal, setCheckoutTotal] = useState(0);
  const [checkoutMode, setCheckoutMode] = useState<CheckoutOption>(CheckoutOption.INDIVIDUAL);
  const [selectedCount, setSelectedCount] = useState(0);
  const [currentPhotos, setCurrentPhotos] = useState<Photo[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Discount Logic
  const [offerExpiresAt, setOfferExpiresAt] = useState<Date | null>(null);
  const [isOfferExpired, setIsOfferExpired] = useState(false);

  // Tracking for abandonment
  const [cartItemsCount, setCartItemsCount] = useState(0);

  // Handle Admin Shortcut (Ctrl + Shift + A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        setIsAdminOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Also check URL params for admin
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      setIsAdminOpen(true);
    }
  }, []);

  // Check for offer expiry every minute
  useEffect(() => {
    if (!offerExpiresAt) return;
    
    const checkExpiry = () => {
      const now = new Date();
      if (now > offerExpiresAt) {
        setIsOfferExpired(true);
      }
    };

    checkExpiry(); // Initial check
    const interval = setInterval(checkExpiry, 10000);
    return () => clearInterval(interval);
  }, [offerExpiresAt]);

  // Dynamic Pricing based on expiration
  // If expired: Single = £10, All = 10 * Count (No bundle price)
  // If active: Single = £7, All = £95
  const activePricing = isOfferExpired 
    ? { single: 10, all: currentPhotos.length * 10, currencySymbol: config.pricing.currencySymbol }
    : config.pricing;

  // Abandoned Cart Logic
  const handleCartUpdate = (itemsCount: number, potentialValue: number, stage: 'Gallery' | 'Checkout') => {
    setCartItemsCount(itemsCount);
    
    // Only track if we have a user email
    if (!userEmail) return;

    setConfig(prev => {
      // Remove existing abandonment record for this email if exists
      const cleanRecords = prev.analytics.abandonedCheckouts.filter(r => r.email !== userEmail);
      
      const newRecord = {
        id: `abd_${Date.now()}`,
        email: userEmail,
        potentialValue,
        itemsCount,
        stage,
        timestamp: new Date().toISOString()
      };

      return {
        ...prev,
        analytics: {
          ...prev.analytics,
          abandonedCheckouts: [...cleanRecords, newRecord]
        }
      };
    });
  };

  // Step Handlers
  const handleAuthSuccess = (record: AccessRecord) => {
    setUserEmail(record.email);
    setCurrentPhotos(record.photos || []);
    
    // Handle Discount Timer Logic
    let expiryDate: Date;

    // If user has logged in before, use their existing timestamp
    if (record.firstLoginAt) {
      const firstLogin = new Date(record.firstLoginAt);
      // Add 48 hours
      expiryDate = new Date(firstLogin.getTime() + (48 * 60 * 60 * 1000));
    } else {
      // First time login
      const now = new Date();
      expiryDate = new Date(now.getTime() + (48 * 60 * 60 * 1000)); // 48 hours from now
      
      // Update the record in config to persist this timestamp (in memory for this demo)
      setConfig(prev => ({
        ...prev,
        accessRecords: prev.accessRecords.map(r => 
          r.id === record.id ? { ...r, firstLoginAt: now.toISOString() } : r
        )
      }));
    }

    setOfferExpiresAt(expiryDate);
    
    // Immediate check if already expired
    if (new Date() > expiryDate) {
      setIsOfferExpired(true);
    } else {
      setIsOfferExpired(false);
    }

    setCurrentStep('GALLERY');
  };

  const handleGalleryProceed = (ids: string[], total: number, mode: CheckoutOption) => {
    setSelectedIds(ids);
    setSelectedCount(ids.length);
    setCheckoutTotal(total);
    setCheckoutMode(mode);
    setCurrentStep('CHECKOUT');
  };

  const handleCheckoutBack = () => {
    setCurrentStep('GALLERY');
  };

  const handlePaymentSuccess = (details: { amount: number, description: string, email: string }) => {
    // Add purchase to analytics state
    const newPurchase = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      email: details.email,
      amount: details.amount,
      description: details.description,
      timestamp: new Date().toISOString(),
      status: 'Completed' as const
    };

    setConfig(prev => ({
      ...prev,
      analytics: {
        ...prev.analytics,
        purchases: [newPurchase, ...prev.analytics.purchases],
        // Clear abandonment record for this user
        abandonedCheckouts: prev.analytics.abandonedCheckouts.filter(r => r.email !== details.email)
      }
    }));

    setCurrentStep('SUCCESS');
  };

  return (
    <div className="h-screen w-full flex flex-col relative bg-white text-slate-900 font-sans overflow-hidden">
      {/* 
        Gradient Background Layer 
        Hidden in Gallery View as requested
      */}
      {currentStep !== 'GALLERY' && (
        <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_0%_0%,_#0047BB_0%,_#9333EA_25%,_#F3E8FF_50%,_#FFFFFF_80%)] opacity-10" />
      )}

      {/* Header / Branding */}
      <header className="w-full py-5 px-6 md:px-12 flex justify-between items-center z-30 shrink-0 bg-white/50 backdrop-blur-sm border-b border-slate-100/50">
        {/* Logo Area */}
        <div className="flex items-center gap-3 z-10">
           <svg width="180" height="48" viewBox="0 0 200 50" fill="none" xmlns="http://www.w3.org/2000/svg">
             <text x="0" y="38" fontSize="42" fontWeight="800" fontFamily="Inter, sans-serif" letterSpacing="-2" fill="#0047BB">CLICK</text>
             <g transform="translate(125, 10)">
               <text x="0" y="12" fontSize="14" fontWeight="600" fontFamily="Inter, sans-serif" fill="#0047BB">MEDIA</text>
               <text x="0" y="28" fontSize="14" fontWeight="600" fontFamily="Inter, sans-serif" fill="#0047BB">GROUP</text>
               <path d="M45 32 H 52 V 25" stroke="#0047BB" strokeWidth="2" />
             </g>
           </svg>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 w-full">
        <div className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${currentStep === 'AUTH' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
            <AuthStep 
              config={config} 
              onSuccess={handleAuthSuccess} 
              onAdminAccess={() => setIsAdminOpen(true)} 
            />
        </div>

        <div className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${currentStep === 'GALLERY' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
             <GalleryStep 
               config={{ ...config, pricing: activePricing }} 
               photos={currentPhotos} 
               onProceed={handleGalleryProceed}
               onCartUpdate={(items, val) => handleCartUpdate(items, val, 'Gallery')}
               onAdminAccess={() => setIsAdminOpen(true)}
               offerExpiresAt={offerExpiresAt}
             />
        </div>

        <div className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${currentStep === 'CHECKOUT' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
             <CheckoutStep 
               config={{ ...config, pricing: activePricing }} 
               total={checkoutTotal} 
               selectedCount={selectedCount} 
               mode={checkoutMode}
               userEmail={userEmail}
               onBack={handleCheckoutBack} 
               onSuccess={handlePaymentSuccess}
               onCartUpdate={() => handleCartUpdate(selectedCount, checkoutTotal, 'Checkout')}
             />
        </div>

        <div className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${currentStep === 'SUCCESS' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
              <SuccessStep 
                config={config} 
                mode={checkoutMode} 
                photos={currentPhotos} 
                selectedIds={selectedIds} 
              />
        </div>
      </main>

      {/* Footer with Admin Trigger */}
      <footer className="py-4 text-center text-slate-400 text-xs relative z-10 shrink-0 border-t border-slate-100 bg-white">
        <div className="flex items-center justify-center gap-2">
          <span>&copy; {new Date().getFullYear()} {config.brandName} Media Group.</span>
          <button 
            onClick={() => setIsAdminOpen(true)} 
            className="p-1 rounded hover:bg-slate-100 transition-colors"
            title="Admin Mode"
          >
            <Settings className="w-3 h-3" />
          </button>
        </div>
      </footer>

      {/* Admin Overlay */}
      <AdminPanel 
        config={config} 
        isOpen={isAdminOpen} 
        onClose={() => setIsAdminOpen(false)} 
        onUpdate={setConfig} 
      />
    </div>
  );
};

export default App;
