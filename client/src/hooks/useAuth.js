import useAuthStore from '../store/auth.store.js';

export function useAuth() {
  return useAuthStore((state) => ({
    user: state.user,
    accessToken: state.accessToken,
    isLoggedIn: state.isLoggedIn,
    hydrated: state.hydrated,
    setAuth: state.setAuth,
    clearAuth: state.clearAuth,
  }));
}

export default useAuth;
