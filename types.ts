
export interface AppConfig {
  brandName: string;
  adminMode: boolean;
  pricing: {
    single: number;
    all: number;
    currencySymbol: string;
  };
  copy: {
    authHeadline: string;
    authSubtext: string;
    galleryHeadline: string;
    gallerySubtext: string;
    galleryScarcityText: string;
    galleryPanelHeadline: string;
    galleryPanelSubtext: string;
    checkoutHeadline: string;
    checkoutSubtext: string;
    successHeadline: string;
    successSubtext: string;
  };
  testimonials: Testimonial[];
  driveLink?: string; // Fallback default (Optional)
  accessRecords: AccessRecord[];
  analytics: {
    logins: LoginLog[];
    purchases: PurchaseRecord[];
    abandonedCheckouts: AbandonedCheckout[];
  };
}

export interface AccessRecord {
  id: string;
  code: string;
  email: string;
  driveLink?: string; // Optional now
  photos: Photo[];
  firstLoginAt?: string; // ISO String timestamp
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  rating?: number;
}

export interface Photo {
  id: string;
  url: string; // Low res preview URL
  highResUrl: string; // Mock high res URL
  title: string;
}

export interface LoginLog {
  id: string;
  email: string;
  codeUsed: string;
  timestamp: string;
  durationMinutes: number;
}

export interface PurchaseRecord {
  id: string;
  email: string;
  amount: number;
  description: string; // "Full Set" or "3 Images"
  timestamp: string;
  status: 'Completed' | 'Refunded';
}

export interface AbandonedCheckout {
  id: string;
  email: string;
  potentialValue: number;
  itemsCount: number;
  stage: 'Gallery' | 'Checkout';
  timestamp: string;
}

export interface UserSession {
  email: string;
  accessCode: string;
  isAuthenticated: boolean;
}

export enum CheckoutOption {
  INDIVIDUAL = 'INDIVIDUAL',
  ALL = 'ALL'
}

export interface Cart {
  selectedImageIds: string[];
}

export type Step = 'AUTH' | 'GALLERY' | 'CHECKOUT' | 'SUCCESS';
