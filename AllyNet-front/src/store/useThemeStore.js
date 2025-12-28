import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'light',
      toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        // DOM update is handled in a side effect or here for immediate feedback
        return { theme: newTheme };
      }),
    }),
    {
      name: 'allynet-theme-storage',
    }
  )
);


