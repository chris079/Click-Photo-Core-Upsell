
import { AppConfig, Photo } from './types';

// Replace with your actual Stripe Publishable Key (starts with pk_test_ or pk_live_)
export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx';

// Helper to generate mock photos for default config
const generateMockPhotos = (): Photo[] => {
  const mockIds = [
    '10', '11', '12', '13', '14', '15', '16', '17',
    '18', '19', '20', '24', '25', '28', '29', '49'
  ];
  return mockIds.map((id, index) => ({
    id: `img_${id}_${index}`,
    title: `Property Photo ${index + 1}`,
    url: `https://picsum.photos/id/${id}/600/400`,
    highResUrl: `https://picsum.photos/id/${id}/2400/1600`,
  }));
};

const defaultPhotos = generateMockPhotos();

export const DEFAULT_CONFIG: AppConfig = {
  brandName: 'Click.',
  adminMode: false,
  pricing: {
    single: 7,
    all: 95,
    currencySymbol: '£',
  },
  copy: {
    authHeadline: 'Unlock your property photos',
    authSubtext: 'Enter your unique code to preview and secure your images at a limited price.',
    galleryHeadline: 'Choose the photos you want to keep forever',
    gallerySubtext: 'Select individual favourites or unlock the full set. Use them with future agents or simply keep them as a record of your home.',
    galleryScarcityText: 'Limited offer at this price. Once purchased, these images are yours to use with other agents in the future.',
    galleryPanelHeadline: 'Your Selection',
    galleryPanelSubtext: 'Choose the photos you want to keep forever. These images are yours to use with future agents or to keep as a record of your home.',
    checkoutHeadline: 'You now own your photos',
    checkoutSubtext: 'You have bought digital image files that you can share, save and use with other agents in the future. These are yours to keep, even after your home is sold.',
    successHeadline: 'Download your visual assets',
    successSubtext: 'Download and store these safely. You can use them with other agents for future listings or keep them as a complete visual record of your property.',
  },
  testimonials: [
    {
      id: 't1',
      quote: "We used the same photos with our second agent and it saved us weeks of hassle.",
      author: "Homeowner in Clapham",
      rating: 5
    },
    {
      id: 't2',
      quote: "I am so glad we kept these images. It is like a little album of our old home.",
      author: "Seller, NW3",
      rating: 5
    },
    {
      id: 't3',
      quote: "The process was simple. Code in, choose images, pay and download.",
      author: "Sarah, Property Developer",
      rating: 4
    }
  ],
  // driveLink: Optional now, omitted from top-level defaults
  accessRecords: [
    {
      id: 'demo-user',
      code: 'DEMO',
      email: 'demo@click.com',
      // driveLink omitted or can be kept if useful for demo
      photos: defaultPhotos
    },
    {
      id: 'client-2024',
      code: 'HOME2024',
      email: 'client@example.com',
      photos: defaultPhotos
    }
  ],
  analytics: {
    logins: [
      { id: 'l1', email: 'demo@click.com', codeUsed: 'DEMO', timestamp: '2023-10-26T10:30:00', durationMinutes: 12 },
      { id: 'l2', email: 'john.doe@example.com', codeUsed: 'HOME2024', timestamp: '2023-10-25T14:15:00', durationMinutes: 5 },
      { id: 'l3', email: 'sarah@agency.com', codeUsed: 'HOME2024', timestamp: '2023-10-25T09:00:00', durationMinutes: 24 },
    ],
    purchases: [
      { id: 'p1', email: 'sarah@agency.com', amount: 95, description: 'Full Set (16 Photos)', timestamp: '2023-10-25T09:25:00', status: 'Completed' },
      { id: 'p2', email: 'previous.owner@yahoo.com', amount: 14, description: '2 Photos', timestamp: '2023-10-24T18:20:00', status: 'Completed' },
    ],
    abandonedCheckouts: [
      { id: 'a1', email: 'window.shopper@gmail.com', potentialValue: 95, itemsCount: 16, stage: 'Checkout', timestamp: '2023-10-26T11:00:00' },
      { id: 'a2', email: 'undecided@hotmail.com', potentialValue: 21, itemsCount: 3, stage: 'Gallery', timestamp: '2023-10-26T10:45:00' },
    ]
  }
};

export const ADMIN_ACCESS_CODE = 'ADMIN123';
