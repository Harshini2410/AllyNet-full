import { create } from 'zustand';

export const useMarketplaceStore = create((set) => ({
  skills: [
    {
      id: 's1',
      name: 'Professional First Aid',
      provider: 'Dr. Emily Chen',
      category: 'Safety',
      rating: 4.9,
      reviews: 124,
      distance: '0.8km',
      price: 'Free / Volunteer',
      image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=400&fit=crop',
      isVerified: true
    },
    {
      id: 's2',
      name: 'Self Defense Basics',
      provider: 'Marcus Thorne',
      category: 'Training',
      rating: 4.8,
      reviews: 89,
      distance: '2.4km',
      price: '$25/hr',
      image: 'https://images.unsplash.com/photo-1552072092-7f9b8d63efcb?w=400&h=400&fit=crop',
      isVerified: true
    }
  ],
  businesses: [
    {
      id: 'b1',
      name: 'Safe Haven Cafe',
      category: 'Restaurant',
      rating: 4.7,
      distance: '0.3km',
      promotion: '10% off for verified helpers',
      image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=400&fit=crop',
      isOpen: true
    },
    {
      id: 'b2',
      name: 'City Pharmacy',
      category: 'Medical',
      rating: 4.5,
      distance: '1.1km',
      promotion: 'Free emergency kits',
      image: 'https://images.unsplash.com/photo-1586015555751-63bb00993e63?w=400&h=400&fit=crop',
      isOpen: true
    }
  ]
}));


