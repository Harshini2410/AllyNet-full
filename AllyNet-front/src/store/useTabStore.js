import { create } from 'zustand';

/**
 * Tab Navigation Store
 * Allows components to programmatically change the active tab
 */
export const useTabStore = create((set) => ({
  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));

