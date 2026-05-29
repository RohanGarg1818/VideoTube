import { create } from "zustand";
import { AuthAPI, type User } from "../services/endpoints";
import { tokenStore } from "../services/api";

interface AuthState {
  user: User | null;
  ready: boolean;
  setUser: (user: User | null) => void;
  fetchMe: () => Promise<void>;
  login: (creds: { email?: string; username?: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  ready: false,
  setUser: (user) => set({ user }),
  fetchMe: async () => {
    if (!tokenStore.getAccess()) {
      set({ user: null, ready: true });
      return;
    }
    try {
      const user = await AuthAPI.me();
      set({ user, ready: true });
    } catch {
      tokenStore.clear();
      set({ user: null, ready: true });
    }
  },
  login: async (creds) => {
    const res = await AuthAPI.login(creds);
    const data = (res?.data ?? res) as { accessToken?: string; refreshToken?: string; user?: User };
    tokenStore.set(data.accessToken, data.refreshToken);
    if (data.user) {
      set({ user: data.user, ready: true });
    } else {
      await get().fetchMe();
    }
  },
  logout: async () => {
    try {
      await AuthAPI.logout();
    } catch {
      /* ignore */
    }
    tokenStore.clear();
    set({ user: null });
  },
}));