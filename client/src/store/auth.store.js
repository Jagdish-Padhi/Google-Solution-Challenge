import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const initialState = {
  user: null,
  accessToken: null,
  isLoggedIn: false,
  hydrated: false,
};

const useAuthStore = create(
  persist(
    (set) => ({
      ...initialState,
      isTransitioning: false,
      isExiting: false,
      transitionShowTagline: false,
      setAuth: ({ user, accessToken }) =>
        set({
          user,
          accessToken,
          isLoggedIn: true,
        }),
      clearAuth: () =>
        set({
          ...initialState,
          hydrated: true,
        }),
      setHydrated: () => set({ hydrated: true }),
      setTransitioning: (isTransitioning, showTagline = false) => 
        set({ isTransitioning, transitionShowTagline: showTagline, isExiting: false }),
      setExiting: (isExiting) => set({ isExiting }),
    }),
    {
      name: 'sportshield-auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isLoggedIn: state.isLoggedIn,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

export default useAuthStore;
