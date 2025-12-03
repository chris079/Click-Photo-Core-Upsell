
import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  useStripe,
  useElements,
  CardNumberElement, 
  CardExpiryElement, 
  CardCvcElement 
} from '@stripe/react-stripe-js';
import { AppConfig, CheckoutOption } from '../types';
import { STRIPE_PUBLISHABLE_KEY } from '../constants';
import { Button } from './Button';
import { Input } from './Input';
import { ArrowLeft, CreditCard, ShieldCheck, Lock, AlertTriangle, Check } from 'lucide-react';
import { createPaymentIntent } from '../services/stripeService';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const stripeElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#0f172a',
      fontFamily: '"Inter", sans-serif',
      '::placeholder': {
        color: '#94a3b8',
      },
      iconColor: '#0047BB',
    },
    invalid: {
      color: '#ef4444',
    },
  },
};

interface CheckoutStepProps {
  config: AppConfig;
  total: number;
  selectedCount: number;
  mode: CheckoutOption;
  userEmail: string;
  onBack: () => void;
  onSuccess: (details: { amount: number, description: string, email: string }) => void;
  onCartUpdate: () => void;
}

const CheckoutForm: React.FC<{
  config: AppConfig;
  total: number;
  selectedCount: number;
  mode: CheckoutOption;
  userEmail: string;
  onSuccess: (details: { amount: number, description: string, email: string }) => void;
}> = ({ config, total, selectedCount, mode, userEmail, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  
  const [cardName, setCardName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStage, setPaymentStage] = useState<'idle' | 'processing' | 'authorizing' | 'success'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!stripe || !elements) return;

    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) return;

    setIsLoading(true);
    setPaymentStage('processing');

    try {
      const description = mode === CheckoutOption.ALL
        ? `Full Set (${selectedCount} Photos)`
        : `Selected Photos (${selectedCount} Items)`;

      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardNumber,
        billing_details: {
          name: cardName,
          email: userEmail,
        },
      });

      if (stripeError || !paymentMethod) {
        throw stripeError || new Error('Unable to create payment method.');
      }

      const { clientSecret } = await createPaymentIntent({
        amount: Math.round(total * 100),
        currency: 'gbp',
        description,
      });

      setPaymentStage('authorizing');

      const confirmation = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethod.id,
      });

      if (confirmation.error) {
        throw confirmation.error;
      }

      setPaymentStage('success');
      onSuccess({
        amount: total,
        description,
        email: userEmail
      });
    } catch (err: any) {
      console.error("Payment Error:", err);
      setError(err?.message || "Payment failed. Please check your details.");
      setPaymentStage('idle');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-slate-900 rounded-lg border border-slate-100">
          {paymentStage === 'success' ? (
            <>
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 animate-bounce shadow-xl">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-[#0047BB]">Payment Approved</h4>
            </>
          ) : (
            <>
              <div className="w-12 h-12 border-4 border-slate-200 border-t-[#0047BB] rounded-full animate-spin mb-4"></div>
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">
                {paymentStage === 'processing' ? 'Processing...' : 'Authorizing...'}
              </h4>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm flex items-start gap-2 rounded-r-md">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Input 
        label="Cardholder Name" 
        placeholder="Name on Card" 
        value={cardName}
        onChange={(e) => setCardName(e.target.value.toUpperCase())}
        required 
        disabled={isLoading}
        className="py-2.5"
      />
      
      <div className="w-full">
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Card Number</label>
        <div className="w-full px-4 py-2.5 border border-slate-200 rounded-md focus-within:border-[#0047BB] focus-within:ring-2 focus-within:ring-[#0047BB]/20 bg-white transition-all">
           <CardNumberElement options={stripeElementOptions} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="w-full">
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Expiry</label>
          <div className="w-full px-4 py-2.5 border border-slate-200 rounded-md focus-within:border-[#0047BB] focus-within:ring-2 focus-within:ring-[#0047BB]/20 bg-white transition-all">
            <CardExpiryElement options={stripeElementOptions} />
          </div>
        </div>

        <div className="w-full">
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">CVC</label>
          <div className="w-full px-4 py-2.5 border border-slate-200 rounded-md focus-within:border-[#0047BB] focus-within:ring-2 focus-within:ring-[#0047BB]/20 bg-white transition-all">
            <CardCvcElement options={stripeElementOptions} />
          </div>
        </div>
      </div>

      <div className="pt-4">
        <Button 
          type="submit" 
          className="w-full py-3.5 text-lg font-bold shadow-xl shadow-blue-900/20"
          disabled={isLoading || !stripe}
        >
          Pay {config.pricing.currencySymbol}{total}
        </Button>
      </div>
      
      <div className="text-center pt-2">
        <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1.5 uppercase tracking-wider">
          <Lock className="w-3 h-3" /> Secured by Stripe 256-bit encryption
        </p>
      </div>
    </form>
  );
};

export const CheckoutStep: React.FC<CheckoutStepProps> = (props) => {
  useEffect(() => {
    props.onCartUpdate();
  }, []);

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar">
      {/* 
        Layout: 
        - min-h-full ensures it fills the height to allow flex centering if content is short.
        - flex-col justify-center centers it vertically.
        - reduced padding (py-4) to prevent unnecessary scrolling on laptops.
      */}
      <div className="min-h-full flex flex-col justify-center w-full max-w-6xl mx-auto px-4 md:px-8 py-4">
        
        <button 
          onClick={props.onBack} 
          className="self-start mb-6 flex items-center text-slate-400 hover:text-[#0047BB] transition-colors text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Selection
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 w-full items-start">
          
          {/* Order Summary */}
          <div className="order-2 lg:order-1 space-y-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#0047BB] mb-3 tracking-tight leading-tight">
                {props.config.copy.checkoutHeadline}
              </h2>
              <p className="text-slate-600 leading-relaxed text-base md:text-lg">
                {props.config.copy.checkoutSubtext}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="p-6 md:p-8">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Order Summary</h3>
                 
                 <div className="flex justify-between items-center py-3 border-b border-slate-100">
                   <div>
                     <span className="block text-slate-900 font-bold text-lg mb-0.5">
                       {props.mode === CheckoutOption.ALL ? 'Full Photo Collection' : 'Selected Photos'}
                     </span>
                     <span className="text-sm text-slate-500 font-medium">
                       {props.mode === CheckoutOption.ALL ? '16 High-Resolution Images' : `${props.selectedCount} High-Resolution Images`}
                     </span>
                   </div>
                   <span className="font-bold text-slate-900 text-lg">{props.config.pricing.currencySymbol}{props.total}</span>
                 </div>

                 <div className="flex justify-between items-center py-6">
                   <span className="text-xl font-bold text-slate-900">Total Due</span>
                   <span className="text-4xl font-bold text-[#0047BB]">{props.config.pricing.currencySymbol}{props.total}</span>
                 </div>
              </div>
              <div className="bg-slate-50 px-6 md:px-8 py-3 border-t border-slate-100 flex items-center text-xs md:text-sm text-slate-500 font-medium">
                <ShieldCheck className="w-4 h-4 mr-3 text-[#0047BB]" />
                <span>Secure SSL Encrypted Payment</span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="order-1 lg:order-2">
             <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-slate-100 relative">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xl font-bold text-slate-900 flex items-center">
                   Payment Details
                 </h3>
                 <div className="flex gap-2">
                   <CreditCard className="w-6 h-6 text-[#0047BB]" />
                 </div>
               </div>
               
               <Elements stripe={stripePromise}>
                  <CheckoutForm {...props} />
               </Elements>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
