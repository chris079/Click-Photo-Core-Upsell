
import React, { useState, useEffect } from 'react';
import { AppConfig, Photo, CheckoutOption } from '../types';
import { Button } from './Button';
import { Check, AlertCircle, Star, Lock, Settings, Clock, Zap } from 'lucide-react';

interface GalleryStepProps {
  config: AppConfig;
  photos: Photo[];
  onProceed: (selectedIds: string[], total: number, mode: CheckoutOption) => void;
  onCartUpdate: (items: number, value: number) => void;
  onAdminAccess: () => void;
  offerExpiresAt: Date | null;
}

export const GalleryStep: React.FC<GalleryStepProps> = ({ 
  config, 
  photos, 
  onProceed, 
  onCartUpdate, 
  onAdminAccess,
  offerExpiresAt
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<{h: number, m: number, s: number} | null>(null);

  // Timer Logic
  useEffect(() => {
    if (!offerExpiresAt) return;

    const calculateTimeLeft = () => {
      const difference = +offerExpiresAt - +new Date();
      
      if (difference > 0) {
        return {
          h: Math.floor((difference / (1000 * 60 * 60))),
          m: Math.floor((difference / 1000 / 60) % 60),
          s: Math.floor((difference / 1000) % 60),
        };
      }
      return null; // Expired
    };

    // Initial set
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [offerExpiresAt]);

  // Testimonial Rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % config.testimonials.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [config.testimonials.length]);

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    setSelectedIds(new Set(photos.map(p => p.id)));
  };

  const clearAll = () => {
    setSelectedIds(new Set());
  };

  // Pricing Logic
  const singlePrice = config.pricing.single;
  const allPrice = config.pricing.all;
  const selectedCount = selectedIds.size;
  const totalImages = photos.length;
  
  const isOfferActive = timeLeft !== null;
  const isFullSetSelected = selectedCount === totalImages && totalImages > 0;

  // If offer is active: Single=7, All=95. 
  // If expired: Single=10 (passed in config), All = 10 * Total (passed in config as 'all').
  
  const rawTotal = selectedCount * singlePrice;
  
  // Only apply "allPrice" bundle if the offer is active. If expired, bundle price is just sum of singles.
  const bundlePrice = isOfferActive ? allPrice : (totalImages * singlePrice);
  
  const showNudge = isOfferActive && !isFullSetSelected && rawTotal > bundlePrice;
  
  // Final calculation
  const finalTotal = isFullSetSelected ? bundlePrice : rawTotal;

  // Calculate savings for display
  const fullValue = totalImages * 10; // Assumes standard price is £10/photo
  const savingsAmount = fullValue - bundlePrice;
  const savingsPercent = Math.round((savingsAmount / fullValue) * 100);

  // Cart Tracking Effect
  useEffect(() => {
    onCartUpdate(selectedCount, finalTotal);
  }, [selectedCount, finalTotal, onCartUpdate]);

  const handleCheckout = () => {
      const mode = isFullSetSelected ? CheckoutOption.ALL : CheckoutOption.INDIVIDUAL;
      onProceed(Array.from(selectedIds), finalTotal, mode);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
  };

  if (!photos || photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
        <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">No Photos Available</h2>
        <p className="text-slate-600 mb-6">There don't seem to be any photos uploaded for this access code yet. Please contact support.</p>
      </div>
    );
  }

  const Testimonials = ({ className = "" }: { className?: string }) => (
    <div className={`py-6 px-4 bg-white rounded-xl border border-slate-100 w-full shadow-sm ${className}`}>
       <div className="flex justify-center mb-3 text-[#0047BB]">
         {[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < (config.testimonials[testimonialIndex]?.rating || 5) ? 'fill-current text-[#0047BB]' : 'fill-transparent text-slate-200'}`} />)}
       </div>
       <div className="relative min-h-[80px] flex items-center justify-center">
         {config.testimonials.map((t, i) => (
           <div 
             key={t.id}
             className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-500 ${i === testimonialIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
           >
             <p className="text-center text-slate-700 font-medium text-lg mb-2">"{t.quote}"</p>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.author}</p>
           </div>
         ))}
       </div>
    </div>
  );

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
        
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          
          {/* Left Column: Gallery Grid */}
          <div className="flex-1">
            <div className="mb-6 md:mb-8">
               <div className="flex items-center gap-4 mb-3">
                 <h2 className="text-4xl md:text-5xl font-bold text-[#0047BB] tracking-tight">
                   {config.copy.galleryHeadline}
                 </h2>
               </div>
               <p className="text-slate-500 leading-relaxed max-w-2xl text-lg">
                 {config.copy.gallerySubtext}
               </p>
            </div>

            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white/90 backdrop-blur z-20 py-4">
               <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  {selectedCount} / {totalImages} photos selected
               </div>
               <div className="flex gap-4">
                  <button onClick={selectAll} className="text-sm font-semibold text-slate-900 hover:text-[#0047BB] transition-colors">
                     Select All
                  </button>
                  {selectedCount > 0 && (
                    <button onClick={clearAll} className="text-sm font-medium text-slate-400 hover:text-red-500 transition-colors">
                       Clear
                    </button>
                  )}
               </div>
            </div>

            {/* MASONRY LAYOUT */}
            <div className="columns-1 md:columns-2 gap-6 space-y-6 pb-32 md:pb-0">
              {photos.map((photo) => {
                const isSelected = selectedIds.has(photo.id);
                return (
                  <div 
                    key={photo.id}
                    onClick={() => toggleSelection(photo.id)}
                    onContextMenu={handleContextMenu}
                    className={`
                      break-inside-avoid relative cursor-pointer rounded-xl overflow-hidden transition-all duration-300
                      bg-slate-50 select-none group w-full
                      ${isSelected 
                        ? 'ring-[4px] ring-[#2F80ED] shadow-2xl z-10' 
                        : 'hover:shadow-lg'
                      }
                    `}
                  >
                    {/* Image Layer - No Filters, Original Aspect Ratio */}
                    <img 
                      src={photo.url} 
                      alt={photo.title || "Property Photo"}
                      draggable="false"
                      className="w-full h-auto block object-cover pointer-events-none select-none"
                    />
                    
                    {/* Watermark Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30 mix-blend-overlay">
                       <span className="text-white text-2xl font-black tracking-widest uppercase opacity-40 transform -rotate-12 border-4 border-white/30 px-6 py-2 whitespace-nowrap">
                         Click Preview
                       </span>
                    </div>

                    {/* Selection Indicator */}
                    <div className={`absolute top-4 right-4 transition-all duration-200 ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                       <div className="bg-[#2F80ED] text-white rounded-full p-1.5 shadow-lg">
                          <Check className="w-5 h-5" strokeWidth={3} />
                       </div>
                    </div>

                    {/* Lock Icon */}
                    {!isSelected && (
                      <div className="absolute bottom-4 right-4 opacity-60 group-hover:opacity-100 transition-opacity">
                         <div className="bg-black/20 backdrop-blur-sm p-2 rounded-full">
                           <Lock className="w-4 h-4 text-white" />
                         </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Sticky Sidebar (Desktop) */}
          <div className="hidden md:block w-80 lg:w-96 shrink-0">
             <div className="sticky top-8 bg-white p-8 rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-100 z-20">
                
                {/* Countdown Banner */}
                {isOfferActive && timeLeft && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-[#0047BB] to-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-300 fill-current" />
                        <span className="text-xs font-bold uppercase tracking-wider">Limited Offer</span>
                      </div>
                      <span className="text-xs font-mono opacity-80">Expires in:</span>
                    </div>
                    <div className="text-3xl font-bold font-mono tracking-wider text-center">
                      {String(timeLeft.h).padStart(2, '0')}:{String(timeLeft.m).padStart(2, '0')}:{String(timeLeft.s).padStart(2, '0')}
                    </div>
                    <div className="mt-2 text-center text-xs text-blue-100">
                       Unlock {savingsPercent}% savings before time runs out
                    </div>
                  </div>
                )}

                {!isOfferActive && (
                  <div className="mb-6 p-3 bg-slate-100 rounded-lg text-center text-xs text-slate-500 font-medium">
                    Offer Expired. Standard pricing applies.
                  </div>
                )}

                <h3 className="font-bold text-2xl text-[#0047BB] mb-2">
                  {config.copy.galleryPanelHeadline}
                </h3>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                  {config.copy.galleryPanelSubtext}
                </p>
                
                {/* Pricing Summary */}
                <div className="space-y-4 mb-8">
                   <div className="flex justify-between text-sm">
                      <span className="text-slate-600 font-medium uppercase tracking-wide text-xs">Selected</span>
                      <span className="font-bold text-slate-900">{selectedCount} / {totalImages}</span>
                   </div>

                   {/* Pricing Context Text */}
                   {isOfferActive && (
                     <div className="text-right text-xs text-[#2F80ED] font-medium">
                       Normally £10 each. Limited time: {config.pricing.currencySymbol}{singlePrice}
                     </div>
                   )}
                   
                   <div className="flex justify-between items-baseline border-t border-slate-100 pt-4">
                      <span className="text-slate-900 font-bold text-lg">Total</span>
                      <div className="text-right">
                         {isFullSetSelected && isOfferActive && (
                           <div className="flex flex-col items-end">
                             <span className="text-xs text-slate-400 line-through">
                                {config.pricing.currencySymbol}{totalImages * 10}
                             </span>
                             <span className="text-xs text-green-600 font-bold mb-1 uppercase tracking-wide">
                               {savingsPercent}% Bundle Savings
                             </span>
                           </div>
                         )}
                         <span className="text-4xl font-bold text-[#0047BB] tracking-tight">
                           {config.pricing.currencySymbol}{finalTotal}
                         </span>
                      </div>
                   </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                   {showNudge ? (
                     <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-center mb-4">
                        <p className="text-sm text-blue-900 mb-3 font-medium">
                           Get the full set for just <span className="font-bold text-lg">{config.pricing.currencySymbol}{allPrice}</span>
                        </p>
                        <Button onClick={selectAll} className="w-full bg-[#FFB83e] text-white hover:bg-[#e0a135] border-none">
                           Unlock All & Save {savingsPercent}%
                        </Button>
                        <button 
                          onClick={handleCheckout}
                          className="mt-3 text-xs text-slate-500 hover:text-[#0047BB] underline font-medium"
                        >
                          Continue with {selectedCount} images
                        </button>
                     </div>
                   ) : (
                     <>
                       {!isFullSetSelected && isOfferActive && (
                         <button 
                            onClick={selectAll} 
                            className="w-full mb-2 py-3 bg-[#FFB83e] text-white font-bold rounded-md shadow hover:bg-[#e0a135] transition-colors uppercase tracking-wide text-sm"
                         >
                            Add All for {config.pricing.currencySymbol}{allPrice}
                         </button>
                       )}
                       
                       <Button 
                         onClick={handleCheckout} 
                         disabled={selectedCount === 0}
                         className="w-full py-4 text-lg"
                       >
                         {isFullSetSelected && isOfferActive ? 'Checkout Full Set' : 'Checkout Selection'}
                       </Button>
                     </>
                   )}
                </div>

                <div className="mt-6 text-center">
                   <p className="text-xs text-slate-400 font-medium max-w-[200px] mx-auto">
                     {config.copy.galleryScarcityText}
                   </p>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100">
                   <Testimonials className="bg-transparent border-0 shadow-none p-0" />
                </div>
             </div>
          </div>

        </div>
      </div>
      
      {/* Mobile Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-[100] md:hidden">
         <div className="flex flex-col gap-3">
            {/* Mobile Timer */}
            {isOfferActive && timeLeft && (
              <div className="flex justify-center items-center gap-2 text-xs font-medium text-red-600">
                 <Clock className="w-3 h-3" />
                 Offer expires in {String(timeLeft.h).padStart(2, '0')}:{String(timeLeft.m).padStart(2, '0')}
              </div>
            )}

            {showNudge && (
               <div onClick={selectAll} className="bg-[#FFB83e] text-white text-xs p-2 text-center rounded font-bold uppercase tracking-wide">
                 Save {savingsPercent}%: Get All for {config.pricing.currencySymbol}{allPrice}
               </div>
            )}
            
            <div className="flex items-center justify-between gap-4">
               <div>
                  <div className="text-xs text-slate-500 font-bold uppercase">{selectedCount} Items</div>
                  <div className="text-2xl font-bold text-[#0047BB] leading-none mt-1">
                     {config.pricing.currencySymbol}{finalTotal}
                  </div>
               </div>
               <Button onClick={handleCheckout} disabled={selectedCount === 0} className="px-8 py-3">
                  Checkout
               </Button>
            </div>
            
            {/* Footer Content (Stacked below checkout button) */}
            <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-slate-100">
               <span className="text-[10px] text-slate-400">&copy; {new Date().getFullYear()} {config.brandName} Media Group.</span>
               <button 
                 onClick={onAdminAccess} 
                 className="text-slate-400 p-1 rounded hover:bg-slate-100 transition-colors"
                 title="Admin Mode"
               >
                 <Settings className="w-3 h-3" />
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};
