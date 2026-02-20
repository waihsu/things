// If you want to use a relative path, update as follows:
import { authClient } from "../things_web/lib/auth";

// Or, if you want to keep the alias, make sure your tsconfig.json includes:
// "paths": { "@/*": ["./src/*"] }
import { create } from "zustand";

type User = {
  id: string;
  email: string;
  name?: string;
  image?: string;
};

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true, // ⬅️ important

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  setLoading: (loading) => set({ loading }),

  logout: async () => {
    try {
      // 🔥 invalidate server session
      await authClient.signOut();
    } finally {
      // 🔥 clear client state no matter what
      set({
        user: null,
        isAuthenticated: false,
      });
    }
  },
}));
